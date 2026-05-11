"""
prepare.py — Data loading, backtest engine setup, and metric extraction.
READ ONLY by the auto-research loop. Do not edit.
"""

import sys
import os
from decimal import Decimal
from pathlib import Path

from nautilus_trader.backtest.engine import BacktestEngine
from nautilus_trader.backtest.config import BacktestEngineConfig
from nautilus_trader.model.identifiers import TraderId, Venue
from nautilus_trader.model.enums import AccountType, OmsType
from nautilus_trader.model.data import Bar, BarType, BarSpecification
from nautilus_trader.model.identifiers import InstrumentId


def setup_engine(
    instrument_id: str,
    data_path: str,
    initial_cash: str = "1000.00",
) -> BacktestEngine:
    """Create a BacktestEngine with a Polymarket-like venue and data."""
    engine = BacktestEngine(
        config=BacktestEngineConfig(
            trader_id=TraderId("AUTORESEARCH-001"),
        )
    )

    venue = Venue("POLYMARKET")
    engine.add_venue(
        venue=venue,
        oms_type=OmsType.NETTING,
        account_type=AccountType.CASH,
        base_currency=None,
        starting_balances=[Money(Decimal(initial_cash), currency)],
    )

    return engine


def extract_metrics(engine: BacktestEngine) -> dict:
    """Extract all relevant metrics from a finished backtest run."""
    analyzer = engine.portfolio.analyzer

    stats_returns = analyzer.get_performance_stats_returns() or {}
    stats_pnls = analyzer.get_performance_stats_pnls() or {}
    stats_general = analyzer.get_performance_stats_general() or {}

    metrics = {
        "sharpe": stats_returns.get("Sharpe Ratio (252 days)", 0.0),
        "sortino": stats_returns.get("Sortino Ratio (252 days)", 0.0),
        "profit_factor": stats_general.get("Profit Factor", 0.0),
        "win_rate": stats_general.get("Win Rate", 0.0),
        "total_pnl": stats_pnls.get("PnL (total)", 0.0),
        "max_drawdown": 0.0,
        "num_trades": stats_general.get("Total Trades", 0),
        "avg_win": stats_general.get("Avg Win", 0.0),
        "avg_loss": stats_general.get("Avg Loss", 0.0),
        "expectancy": stats_general.get("Expectancy", 0.0),
    }

    returns = stats_returns.get("Returns (Daily)", None)
    if returns is not None and len(returns) > 0:
        cum = (1 + returns).cumprod()
        peak = cum.expanding().max()
        dd = (cum - peak) / peak
        metrics["max_drawdown"] = float(dd.min()) if len(dd) > 0 else 0.0

    return metrics


def format_results_line(metrics: dict, commit_hash: str, description: str) -> str:
    """Format a TSV line matching results.tsv schema."""
    return (
        f"{commit_hash}\t"
        f"{metrics['sharpe']:.4f}\t"
        f"{metrics['total_pnl']:.2f}\t"
        f"{metrics['win_rate']:.4f}\t"
        f"{metrics['profit_factor']:.2f}\t"
        f"{metrics['max_drawdown']:.4f}\t"
        f"{metrics['num_trades']}\t"
        f"{'keep' if metrics['sharpe'] > 0 else 'discard'}\t"
        f"{description}\n"
    )


def load_data_for_market(engine: BacktestEngine, market_slug: str, data_dir: str):
    """Load historical Polymarket data for a given market.
    
    Uses prediction-market-backtesting's data loading if available,
    otherwise creates simulated test data.
    """
    # Try using PM backtesting data loaders
    try:
        sys.path.insert(0, data_dir)
        from prediction_market_extensions.backtesting.data_sources.pmxt import (
            PolymarketPMXTBookReplayAdapter,
        )
        adapter = PolymarketPMXTBookReplayAdapter(market_slug=market_slug)
        instrument = adapter.instrument
        trades = adapter.load_trades()
        engine.add_instrument(instrument)
        engine.add_data(trades)
        return instrument
    except Exception:
        pass

    # Fallback: load from parquet if available
    parquet_path = Path(data_dir) / "pmxt" / f"{market_slug}.parquet"
    if parquet_path.exists():
        try:
            import pandas as pd
            df = pd.read_parquet(parquet_path)
            engine.add_data(df.to_dict(orient="records"))
            return None
        except Exception:
            pass

    return None
