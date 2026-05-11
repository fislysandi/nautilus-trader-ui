"""Pydantic v2 models for all request/response types."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel


# ── Backtest ────────────────────────────────────────────────────────────────


class BacktestConfig(BaseModel):
    strategy_name: str
    instrument_id: str
    start_date: str
    end_date: str
    initial_capital: str = "10000"
    params: dict[str, Any] = {}


class BacktestRunResponse(BaseModel):
    run_id: str


class BacktestStatus(BaseModel):
    run_id: str
    status: Literal["pending", "running", "completed", "failed"]
    progress: float = 0.0
    error: str | None = None


class BacktestMetrics(BaseModel):
    sharpe_ratio: float | None = None
    sortino_ratio: float | None = None
    total_pnl: float | None = None
    win_rate: float | None = None
    profit_factor: float | None = None
    max_drawdown: float | None = None
    total_trades: int = 0


class BacktestResults(BaseModel):
    run_id: str
    status: str
    metrics: BacktestMetrics
    equity_curve: list[dict] = []
    drawdown_curve: list[dict] = []


class Trade(BaseModel):
    entry_time: str
    exit_time: str | None = None
    side: str
    size: float
    entry_price: float
    exit_price: float | None = None
    pnl: float | None = None
    instrument_id: str


class Position(BaseModel):
    instrument_id: str
    side: str
    quantity: float
    entry_price: float
    current_price: float
    unrealized_pnl: float


class Order(BaseModel):
    instrument_id: str
    side: str
    order_type: str
    price: float
    quantity: float
    status: str


class SweepConfig(BaseModel):
    strategy_name: str
    instrument_id: str
    start_date: str
    end_date: str
    initial_capital: str = "10000"
    param_name: str
    param_values: list[Any]
    fixed_params: dict[str, Any] = {}


class SweepResult(BaseModel):
    param_value: Any
    metrics: BacktestMetrics


# ── Strategies ──────────────────────────────────────────────────────────────


class StrategyInfo(BaseModel):
    name: str
    description: str = ""
    file_path: str = ""
    backtest_count: int = 0


class StrategyParam(BaseModel):
    name: str
    type: str
    default: Any = None
    description: str = ""


class StrategyDetail(BaseModel):
    name: str
    description: str = ""
    params: list[StrategyParam] = []
    source: str = ""
    backtest_count: int = 0


# ── Live ────────────────────────────────────────────────────────────────────


class LiveStatus(BaseModel):
    status: Literal["running", "stopped", "error"]
    uptime_seconds: float = 0.0
    node_version: str = ""
    active_strategies: int = 0


class AccountBalance(BaseModel):
    total_balance: float = 0.0
    available_balance: float = 0.0
    in_use: float = 0.0
    margin_usage_pct: float = 0.0


# ── Data ────────────────────────────────────────────────────────────────────


class Instrument(BaseModel):
    id: str
    venue: str = ""
    tick_size: float = 0.0
    lot_size: float = 0.0
    currency: str = "USD"
