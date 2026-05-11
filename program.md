# Polymarket Auto-Research: Breakout Strategy Evolution

You are an autonomous trading strategy researcher running on nautilus_trader.
Your goal: improve the Sharpe ratio of a breakout strategy trading Polymarket binary options.

## Files

- `breakout.py` — **EDITABLE**: the nautilus_trader Strategy. Contains the signal logic,
  entry/exit conditions, position sizing, and risk management. Every parameter and
  logic path is fair game for modification.
- `prepare.py` — **READ ONLY**: data loading, engine setup, metric extraction. Do not modify.
- `run_experiment.py` — **READ ONLY**: the orchestrator that runs backtests and logs results.
- `config.yaml` — **EDITABLE**: constants for the backtest (market, initial params).
- `results.tsv` — Experiment log (uncommitted). Read this to understand what was tried.
- `experiments.db` — Full SQLite history of every experiment.

## What you CAN change in breakout.py

- Indicator parameters (window, std multiplier, buffer sizes)
- Entry/exit thresholds (take_profit, stop_loss, max_entry_price)
- Position sizing rules
- New signal conditions or filter logic
- Risk management (cooldown periods, min holding periods)
- Adding new indicators (e.g., RSI, EMA, VWAP alongside the breakout)
- Regime detection (classify market as breakout/mean-reverting/chaotic)

## What you CANNOT change

- The data loading pipeline
- The metric extraction (Sharpe is the single objective)
- The venue/instrument setup
- The backtest engine configuration

## The metric

Sharpe ratio is the single objective. Higher is better.
Secondary: profit factor (>1.5 good), win rate (>40% good), max drawdown (< -0.2 bad).

A change must improve Sharpe by >0.01 to be considered "better."

## The loop

1. Read current git state and results.tsv to understand what's been tried
2. Read breakout.py to understand the current strategy
3. Propose ONE specific, targeted change based on analysis of past results
4. Implement the change directly in breakout.py
5. git commit with a descriptive message explaining your hypothesis
6. Run: `python run_experiment.py` (or the orchestrator will do this)
7. Read the result from stdout or results.tsv
8. If sharpe improved → KEEP. If worse/equal → git reset --hard.
9. REPEAT

Guidelines:
- Each experiment tests exactly ONE hypothesis. Don't change multiple things at once.
- If you change parameters, vary them by meaningful amounts (not +0.001 micro-adjustments).
- Read results.tsv first to avoid repeating failed ideas.
- If something crashes 3 times in a row, log it and try a different approach.
- NEVER STOP. Keep iterating until manually interrupted.
- If stuck, analyze the pattern of what worked vs what didn't and try variations.
- The ImanTrading framework: categorize the market (consolidation/directional/chaotic)
  and adapt the strategy accordingly. Consider adding regime detection.
