"""
run_experiment.py — Auto-research loop orchestrator.
This is the main loop: modify strategy → backtest → extract metrics → keep/revert.

Usage:
    python run_experiment.py              # single experiment
    python run_experiment.py --loop       # continuous improvement loop
    python run_experiment.py --loop --interval 300  # loop with 5min between runs
"""

import argparse
import hashlib
import json
import os
import sqlite3
import subprocess
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

import yaml


def load_config(path: str = "config.yaml") -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def get_git_commit() -> str:
    result = subprocess.run(
        ["git", "rev-parse", "--short", "HEAD"],
        capture_output=True, text=True, cwd=os.path.dirname(__file__)
    )
    return result.stdout.strip()


def get_strategy_hash() -> str:
    strategy_path = os.path.join(os.path.dirname(__file__), "breakout.py")
    with open(strategy_path) as f:
        return hashlib.sha256(f.read().encode()).hexdigest()[:12]


def run_backtest(config: dict) -> dict:
    """Run a single backtest and return metrics."""
    from prepare import setup_engine, extract_metrics, load_data_for_market

    engine = setup_engine(
        instrument_id=config["market"]["instrument_id"],
        data_path=os.path.dirname(__file__),
        initial_cash=config["backtest"]["initial_cash"],
    )

    instrument = load_data_for_market(
        engine,
        market_slug=config["market"]["slug"],
        data_dir=os.path.dirname(__file__),
    )

    if instrument is None:
        return {"error": "No data loaded for market"}

    from breakout import BreakoutStrategy, BreakoutConfig

    strategy_config = BreakoutConfig(
        instrument_id=str(instrument.id),
        trade_size=Decimal(config["strategy"]["trade_size"]),
        window=config["strategy"]["window"],
        breakout_std=config["strategy"]["breakout_std"],
        breakout_buffer=config["strategy"]["breakout_buffer"],
        mean_reversion_buffer=config["strategy"]["mean_reversion_buffer"],
        min_holding_periods=config["strategy"]["min_holding_periods"],
        reentry_cooldown=config["strategy"]["reentry_cooldown"],
        max_entry_price=config["strategy"]["max_entry_price"],
        take_profit=config["strategy"]["take_profit"],
        stop_loss=config["strategy"]["stop_loss"],
    )

    t0 = time.time()
    engine.add_strategy(BreakoutStrategy(config=strategy_config))
    engine.run()
    elapsed = time.time() - t0

    metrics = extract_metrics(engine)
    metrics["duration_seconds"] = round(elapsed, 2)

    return metrics


def log_experiment(db_path: str, metrics: dict, commit: str, strategy_hash: str,
                    status: str, description: str, parent_id: int = None):
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS experiments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            commit_hash TEXT, strategy_hash TEXT, timestamp TEXT,
            sharpe REAL, sortino REAL, profit_factor REAL,
            win_rate REAL, total_pnl REAL, max_drawdown REAL,
            num_trades INTEGER, status TEXT, description TEXT,
            duration_seconds REAL, generation INTEGER,
            parent_experiment_id INTEGER
        )
    """)

    gen = 1
    if parent_id:
        row = conn.execute("SELECT generation FROM experiments WHERE id = ?",
                          (parent_id,)).fetchone()
        if row:
            gen = row[0] + 1

    conn.execute("""
        INSERT INTO experiments
        (commit_hash, strategy_hash, timestamp, sharpe, sortino,
         profit_factor, win_rate, total_pnl, max_drawdown, num_trades,
         status, description, duration_seconds, generation, parent_experiment_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        commit, strategy_hash, datetime.now(timezone.utc).isoformat(),
        metrics.get("sharpe", 0), metrics.get("sortino", 0),
        metrics.get("profit_factor", 0), metrics.get("win_rate", 0),
        metrics.get("total_pnl", 0), metrics.get("max_drawdown", 0),
        metrics.get("num_trades", 0), status, description,
        metrics.get("duration_seconds", 0), gen, parent_id
    ))
    conn.commit()
    conn.close()

    return gen


def append_results_tsv(path: str, commit: str, metrics: dict, status: str, desc: str):
    from prepare import format_results_line
    line = format_results_line(metrics, commit, desc).replace(
        "'keep'", status if status == "keep" else "'discard'"
    )
    with open(path, "a") as f:
        f.write(line)


def git_commit(description: str):
    subprocess.run(["git", "add", "breakout.py"], cwd=os.path.dirname(__file__))
    subprocess.run(["git", "commit", "-m", description],
                  cwd=os.path.dirname(__file__),
                  capture_output=True)


def git_reset():
    subprocess.run(["git", "reset", "--hard", "HEAD~1"],
                  cwd=os.path.dirname(__file__),
                  capture_output=True)


def run_experiment(config: dict, db_path: str, results_path: str,
                   description: str = "baseline", parent_id: int = None) -> dict:
    commit = get_git_commit()
    strategy_hash = get_strategy_hash()

    print(f"[{datetime.now().isoformat()}] Running experiment...")
    print(f"  commit: {commit}")
    print(f"  strategy hash: {strategy_hash}")
    print(f"  description: {description}")

    metrics = run_backtest(config)
    if "error" in metrics:
        print(f"  ERROR: {metrics['error']}")
        status = "crash"
    else:
        print(f"  sharpe={metrics['sharpe']:.4f}  pnl={metrics['total_pnl']:.2f}")
        print(f"  win_rate={metrics['win_rate']:.4f}  profit_factor={metrics['profit_factor']:.2f}")
        status = "keep" if metrics["sharpe"] > 0 else "discard"

    gen = log_experiment(db_path, metrics, commit, strategy_hash, status, description, parent_id)
    append_results_tsv(results_path, commit, metrics, status, description)

    return {**metrics, "status": status, "generation": gen, "commit": commit}


def main():
    parser = argparse.ArgumentParser(description="Auto-research loop for Polymarket trading")
    parser.add_argument("--loop", action="store_true", help="Continuous improvement loop")
    parser.add_argument("--interval", type=int, default=60, help="Seconds between loop iterations")
    args = parser.parse_args()

    config = load_config()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "experiments.db")
    results_path = os.path.join(base_dir, "results.tsv")

    if not os.path.exists(results_path):
        with open(results_path, "w") as f:
            f.write("commit\tsharpe\tpnl\twin_rate\tprofit_factor\tmax_dd\ttrades\tstatus\tdescription\n")

    if not args.loop:
        return run_experiment(config, db_path, results_path)

    print(f"=== Starting auto-research loop ===")
    print(f"  interval: {args.interval}s")
    print(f"  strategy: breakout.py")
    print(f"  market: {config['market']['slug']}")
    print()

    parent_id = None
    iteration = 0

    while True:
        iteration += 1
        print(f"\n--- Iteration {iteration} ---")

        if iteration == 1:
            description = "baseline breakout strategy"
        else:
            description = f"iteration-{iteration}"

        result = run_experiment(config, db_path, results_path, description, parent_id)

        if result["status"] == "keep" and iteration > 1:
            git_commit(description)
            print(f"  >> KEPT: sharpe={result['sharpe']:.4f}")
            parent_id = result.get("generation")
        elif result["status"] == "discard" and iteration > 1:
            git_reset()
            print(f"  >> DISCARDED: sharpe={result['sharpe']:.4f} was worse")
        elif result["status"] == "crash":
            print(f"  >> CRASHED")

        print(f"  Sleeping {args.interval}s...")
        time.sleep(args.interval)


if __name__ == "__main__":
    from decimal import Decimal
    main()
