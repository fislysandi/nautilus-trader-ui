from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    run_id: Mapped[str] = mapped_column(primary_key=True)
    strategy_name: Mapped[str] = mapped_column(String(255))
    instrument_id: Mapped[str] = mapped_column(String(255))
    start_date: Mapped[str]
    end_date: Mapped[str]
    initial_capital: Mapped[str] = mapped_column(default="10000")
    status: Mapped[str] = mapped_column(default="pending")
    progress: Mapped[float] = mapped_column(default=0.0)
    error: Mapped[Optional[str]]
    config: Mapped[Optional[dict]] = mapped_column(JSON, default=None)

    # Metrics (NULL until completed)
    sharpe_ratio: Mapped[Optional[float]]
    sortino_ratio: Mapped[Optional[float]]
    total_pnl: Mapped[Optional[float]]
    win_rate: Mapped[Optional[float]]
    profit_factor: Mapped[Optional[float]]
    max_drawdown: Mapped[Optional[float]]
    total_trades: Mapped[int] = mapped_column(default=0)

    completed_at: Mapped[Optional[str]]
    created_at: Mapped[str] = mapped_column(
        default=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: Mapped[str] = mapped_column(
        default=lambda: datetime.now(timezone.utc).isoformat()
    )

    equity_points = relationship(
        "EquityPoint", back_populates="run", cascade="all, delete-orphan"
    )
    trades = relationship("Trade", back_populates="run", cascade="all, delete-orphan")
    positions = relationship(
        "Position", back_populates="run", cascade="all, delete-orphan"
    )
    logs = relationship(
        "BacktestLog", back_populates="run", cascade="all, delete-orphan"
    )


class EquityPoint(Base):
    __tablename__ = "equity_points"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(
        ForeignKey("backtest_runs.run_id", ondelete="CASCADE")
    )
    timestamp: Mapped[str]
    value: Mapped[float]
    run = relationship("BacktestRun", back_populates="equity_points")


class Trade(Base):
    __tablename__ = "trades"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(
        ForeignKey("backtest_runs.run_id", ondelete="CASCADE")
    )
    entry_time: Mapped[str]
    exit_time: Mapped[Optional[str]]
    side: Mapped[str]
    size: Mapped[float]
    entry_price: Mapped[float]
    exit_price: Mapped[Optional[float]]
    pnl: Mapped[Optional[float]]
    instrument_id: Mapped[str]
    run = relationship("BacktestRun", back_populates="trades")


class Position(Base):
    __tablename__ = "positions"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(
        ForeignKey("backtest_runs.run_id", ondelete="CASCADE")
    )
    instrument_id: Mapped[str]
    side: Mapped[str]
    quantity: Mapped[float]
    entry_price: Mapped[float]
    current_price: Mapped[float]
    unrealized_pnl: Mapped[float]
    run = relationship("BacktestRun", back_populates="positions")


class Sweep(Base):
    __tablename__ = "sweeps"
    sweep_id: Mapped[str] = mapped_column(primary_key=True)
    config: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(default="running")
    created_at: Mapped[str] = mapped_column(
        default=lambda: datetime.now(timezone.utc).isoformat()
    )
    results = relationship(
        "SweepResult", back_populates="sweep", cascade="all, delete-orphan"
    )


class SweepResult(Base):
    __tablename__ = "sweep_results"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sweep_id: Mapped[str] = mapped_column(
        ForeignKey("sweeps.sweep_id", ondelete="CASCADE")
    )
    param_value: Mapped[str]
    metrics: Mapped[Optional[dict]] = mapped_column(JSON, default=None)
    sweep = relationship("Sweep", back_populates="results")


class BacktestLog(Base):
    __tablename__ = "backtest_logs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(
        ForeignKey("backtest_runs.run_id", ondelete="CASCADE")
    )
    line_number: Mapped[int]
    message: Mapped[str]
    run = relationship("BacktestRun", back_populates="logs")


class SystemState(Base):
    __tablename__ = "system_state"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(255), unique=True)
    value: Mapped[str]
    updated_at: Mapped[str] = mapped_column(
        default=lambda: datetime.now(timezone.utc).isoformat()
    )
