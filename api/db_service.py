"""Async database service wrapping SQLite operations for backtest persistence."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import selectinload

from api.db_models import (
    BacktestRun,
    EquityPoint,
    Trade,
    Position,
    Sweep,
    SweepResult,
    BacktestLog,
    SystemState,
)


class DbService:
    """Persistence layer for backtest runs, sweeps, and logs."""

    def __init__(self, engine=None):
        if engine is None:
            from api.database import get_engine

            engine = get_engine()
        self._session_factory = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

    async def create_run(self, run_id: str, config: dict) -> None:
        now = datetime.now(timezone.utc).isoformat()
        run = BacktestRun(
            run_id=run_id,
            strategy_name=config.get("strategy_name", ""),
            instrument_id=config.get("instrument_id", ""),
            start_date=config.get("start_date", ""),
            end_date=config.get("end_date", ""),
            initial_capital=config.get("initial_capital", "10000"),
            config=config,
            status="pending",
            progress=0.0,
            created_at=now,
            updated_at=now,
        )
        async with self._session_factory() as session:
            session.add(run)
            await session.commit()

    async def get_run(self, run_id: str) -> Optional[BacktestRun]:
        async with self._session_factory() as session:
            return await session.get(BacktestRun, run_id)

    async def update_run_status(
        self, run_id: str, status: str, progress: float, error: str = None
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        async with self._session_factory() as session:
            run = await session.get(BacktestRun, run_id)
            if run:
                run.status = status
                run.progress = progress
                run.error = error
                run.updated_at = now
                await session.commit()

    async def update_run_results(
        self,
        run_id: str,
        metrics: dict,
        equity_curve: list[dict],
        trades: list[dict],
        positions: list[dict],
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        async with self._session_factory() as session:
            run = await session.get(BacktestRun, run_id)
            if not run:
                return
            run.sharpe_ratio = metrics.get("sharpe_ratio")
            run.sortino_ratio = metrics.get("sortino_ratio")
            run.total_pnl = metrics.get("total_pnl")
            run.win_rate = metrics.get("win_rate")
            run.profit_factor = metrics.get("profit_factor")
            run.max_drawdown = metrics.get("max_drawdown")
            run.total_trades = metrics.get("total_trades", 0)
            run.completed_at = now
            run.updated_at = now
            for pt in equity_curve:
                session.add(
                    EquityPoint(
                        run_id=run_id, timestamp=pt["timestamp"], value=pt["value"]
                    )
                )
            for t in trades:
                session.add(
                    Trade(
                        run_id=run_id,
                        entry_time=t.get("entry_time", ""),
                        exit_time=t.get("exit_time"),
                        side=t.get("side", ""),
                        size=t.get("size", 0),
                        entry_price=t.get("entry_price", 0),
                        exit_price=t.get("exit_price"),
                        pnl=t.get("pnl"),
                        instrument_id=t.get("instrument_id", ""),
                    )
                )
            for p in positions:
                session.add(
                    Position(
                        run_id=run_id,
                        instrument_id=p.get("instrument_id", ""),
                        side=p.get("side", ""),
                        quantity=p.get("quantity", 0),
                        entry_price=p.get("entry_price", 0),
                        current_price=p.get("current_price", 0),
                        unrealized_pnl=p.get("unrealized_pnl", 0),
                    )
                )
            await session.commit()

    async def delete_run(self, run_id: str) -> None:
        async with self._session_factory() as session:
            run = await session.get(BacktestRun, run_id)
            if run:
                await session.delete(run)
                await session.commit()

    async def list_runs(self, limit: int = 50) -> list[BacktestRun]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(BacktestRun).order_by(BacktestRun.created_at.desc()).limit(limit)
            )
            return list(result.scalars().all())

    async def prune_runs(self, before_date: str) -> int:
        async with self._session_factory() as session:
            result = await session.execute(
                delete(BacktestRun).where(
                    BacktestRun.completed_at.isnot(None),
                    BacktestRun.completed_at < before_date,
                )
            )
            await session.commit()
            return result.rowcount

    async def get_equity_curve(self, run_id: str) -> list[dict]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(EquityPoint)
                .where(EquityPoint.run_id == run_id)
                .order_by(EquityPoint.id)
            )
            return [
                {"timestamp": pt.timestamp, "value": pt.value}
                for pt in result.scalars().all()
            ]

    async def get_trades(self, run_id: str) -> list[dict]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(Trade).where(Trade.run_id == run_id).order_by(Trade.id)
            )
            return [
                {
                    "entry_time": t.entry_time,
                    "exit_time": t.exit_time,
                    "side": t.side,
                    "size": t.size,
                    "entry_price": t.entry_price,
                    "exit_price": t.exit_price,
                    "pnl": t.pnl,
                    "instrument_id": t.instrument_id,
                }
                for t in result.scalars().all()
            ]

    async def get_positions(self, run_id: str) -> list[dict]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(Position).where(Position.run_id == run_id).order_by(Position.id)
            )
            return [
                {
                    "instrument_id": p.instrument_id,
                    "side": p.side,
                    "quantity": p.quantity,
                    "entry_price": p.entry_price,
                    "current_price": p.current_price,
                    "unrealized_pnl": p.unrealized_pnl,
                }
                for p in result.scalars().all()
            ]

    async def append_log(self, run_id: str, line_number: int, message: str) -> None:
        async with self._session_factory() as session:
            session.add(
                BacktestLog(run_id=run_id, line_number=line_number, message=message)
            )
            await session.commit()

    async def get_logs(self, run_id: str, since: int = 0) -> list[str]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(BacktestLog)
                .where(BacktestLog.run_id == run_id)
                .where(BacktestLog.line_number >= since)
                .order_by(BacktestLog.line_number)
            )
            return [log.message for log in result.scalars().all()]

    async def create_sweep(self, sweep_id: str, config: dict) -> None:
        now = datetime.now(timezone.utc).isoformat()
        async with self._session_factory() as session:
            session.add(Sweep(sweep_id=sweep_id, config=config, created_at=now))
            await session.commit()

    async def update_sweep(
        self, sweep_id: str, status: str, results: list[dict]
    ) -> None:
        async with self._session_factory() as session:
            sweep = await session.get(Sweep, sweep_id)
            if sweep:
                sweep.status = status
                for r in results:
                    session.add(
                        SweepResult(
                            sweep_id=sweep_id,
                            param_value=str(r.get("param_value", "")),
                            metrics=r.get("metrics"),
                        )
                    )
                await session.commit()

    async def get_sweep(self, sweep_id: str) -> Optional[dict]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(Sweep)
                .where(Sweep.sweep_id == sweep_id)
                .options(selectinload(Sweep.results))
            )
            sweep = result.scalar_one_or_none()
            if not sweep:
                return None
            return {
                "sweep_id": sweep.sweep_id,
                "config": sweep.config,
                "status": sweep.status,
                "created_at": sweep.created_at,
                "results": [
                    {"param_value": r.param_value, "metrics": r.metrics}
                    for r in sweep.results
                ],
            }

    async def get_state(self, key: str) -> Optional[str]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(SystemState).where(SystemState.key == key)
            )
            state = result.scalar_one_or_none()
            return state.value if state else None

    async def set_state(self, key: str, value: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        async with self._session_factory() as session:
            result = await session.execute(
                select(SystemState).where(SystemState.key == key)
            )
            state = result.scalar_one_or_none()
            if state:
                state.value = value
                state.updated_at = now
            else:
                session.add(SystemState(key=key, value=value, updated_at=now))
            await session.commit()
