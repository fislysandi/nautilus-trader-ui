"""Backtest endpoints — configure, run, and fetch results.

All 9 endpoints wired to BacktestService for real backtest execution.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.models.schemas import (
    BacktestConfig,
    BacktestResults,
    BacktestRunResponse,
    BacktestStatus,
    Position,
    SweepConfig,
    SweepResult,
    Trade,
)
from api.services.backtest_service import BacktestService

router = APIRouter(prefix="/backtest", tags=["backtest"])

service = BacktestService(strategies_dir="strategies")


@router.post(
    "/run",
    response_model=BacktestRunResponse,
    status_code=202,
    summary="Submit a backtest run",
)
async def run_backtest(config: BacktestConfig) -> BacktestRunResponse:
    """Queue a backtest with the given strategy, instrument, and date range.

    Returns a run_id that can be polled for status and results.
    """
    run_id = await service.run_backtest(config.model_dump())
    return BacktestRunResponse(run_id=run_id)


@router.get(
    "/{run_id}/status",
    response_model=BacktestStatus,
    summary="Get backtest run status",
)
async def get_backtest_status(run_id: str, since: int = 0) -> BacktestStatus:
    """Return the current status and progress of a backtest run, with logs since index."""
    try:
        status = await service.get_status(run_id)
        logs = await service.get_logs(run_id, since)
        return BacktestStatus(logs=logs, **status)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")


@router.get(
    "/{run_id}/results",
    response_model=BacktestResults,
    summary="Get backtest results and metrics",
)
async def get_backtest_results(run_id: str) -> BacktestResults:
    """Return the full backtest results including metrics, equity curve, and drawdown."""
    try:
        results = await service.get_results(run_id)
        return BacktestResults(**results)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")


@router.get(
    "/{run_id}/trades",
    response_model=list[Trade],
    summary="Get backtest trade list",
)
async def get_backtest_trades(run_id: str) -> list[Trade]:
    """Return all trades generated during the backtest run."""
    try:
        return [Trade(**t) for t in await service.get_trades(run_id)]
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")


@router.get(
    "/{run_id}/positions",
    response_model=list[Position],
    summary="Get backtest position history",
)
async def get_backtest_positions(run_id: str) -> list[Position]:
    """Return the position history for the backtest run."""
    try:
        return [Position(**p) for p in await service.get_positions(run_id)]
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")


@router.get(
    "/{run_id}/fills",
    response_model=list[dict],
    summary="Get backtest fill report",
)
async def get_backtest_fills(run_id: str) -> list[dict]:
    """Return the fill report for the backtest run."""
    try:
        return await service.get_fills(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")


@router.post(
    "/{run_id}/cancel",
    status_code=200,
    summary="Cancel a running backtest",
)
async def cancel_backtest(run_id: str) -> dict:
    """Cancel a running backtest by cancelling its background task."""
    try:
        await service.cancel_backtest(run_id)
        return {"run_id": run_id, "status": "cancelled"}
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")


@router.delete(
    "/{run_id}",
    status_code=204,
    summary="Delete a backtest run",
)
async def delete_backtest(run_id: str):
    """Delete backtest results from memory (also cancels if running)."""
    try:
        _ = await service.get_status(run_id)  # raises KeyError if not found
        await service.delete_run(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")


@router.post(
    "/sweep",
    status_code=202,
    summary="Submit a parameter sweep",
)
async def run_sweep(config: SweepConfig) -> dict:
    """Queue a parameter sweep — runs the strategy across multiple param values.

    Returns a sweep_id to poll for sweep results.
    """
    sweep_id = await service.run_sweep(config.model_dump())
    return {"sweep_id": sweep_id, "status": "running"}


@router.get(
    "/sweep/{sweep_id}",
    response_model=list[SweepResult],
    summary="Get parameter sweep results",
)
async def get_sweep_results(sweep_id: str) -> list[SweepResult]:
    """Return the results table for a completed parameter sweep."""
    try:
        results = await service.get_sweep_results(sweep_id)
        return [SweepResult(**r) for r in results]
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Sweep '{sweep_id}' not found")
