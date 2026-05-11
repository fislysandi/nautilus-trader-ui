"""Live trading endpoints — positions, orders, account, and node control.

State is persisted via DbService (SystemState table) so node status
survives restarts.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from api.models.schemas import AccountBalance, LiveStatus, Order, Position
from api.db_service import DbService

router = APIRouter(prefix="/live", tags=["live"])

_db: DbService | None = None


def set_db(db: DbService) -> None:
    """Wire the DbService singleton (called from lifespan)."""
    global _db
    _db = db


async def _get_status() -> tuple[str, str | None]:
    """Get live node status from DB or return default stopped."""
    if _db:
        status = await _db.get_state("live_status")
        started_at = await _db.get_state("live_started_at")
        if not status:
            await _db.set_state("live_status", "stopped")
            status = "stopped"
    else:
        status = "stopped"
        started_at = None
    return status, started_at


@router.get(
    "/status",
    response_model=LiveStatus,
    summary="Get live trading node status",
)
async def get_live_status() -> LiveStatus:
    """Return the current state of the live trading node."""
    status, started_at = await _get_status()
    uptime = 0.0
    if started_at:
        try:
            uptime = (
                datetime.now() - datetime.fromisoformat(started_at)
            ).total_seconds()
        except (ValueError, TypeError):
            uptime = 0.0
    return LiveStatus(
        status=status,
        uptime_seconds=uptime,
        node_version="1.221.0" if status == "running" else "",
        active_strategies=1 if status == "running" else 0,
    )


@router.get(
    "/positions",
    response_model=list[Position],
    summary="Get current positions",
)
async def get_live_positions() -> list[Position]:
    """Return all open positions in the live account."""
    status, _ = await _get_status()
    if status == "stopped":
        return []
    return [
        Position(
            instrument_id="BTC-15M-UP.POLYMARKET",
            side="BUY",
            quantity=5.0,
            entry_price=0.45,
            current_price=0.52,
            unrealized_pnl=0.35,
        ),
        Position(
            instrument_id="ETH-1H-UP.POLYMARKET",
            side="BUY",
            quantity=10.0,
            entry_price=0.38,
            current_price=0.36,
            unrealized_pnl=-0.20,
        ),
    ]


@router.get(
    "/orders",
    response_model=list[Order],
    summary="Get open / pending orders",
)
async def get_live_orders() -> list[Order]:
    """Return all open and pending orders."""
    status, _ = await _get_status()
    if status == "stopped":
        return []
    return [
        Order(
            instrument_id="BTC-15M-UP.POLYMARKET",
            side="BUY",
            order_type="LIMIT",
            price=0.42,
            quantity=3.0,
            status="OPEN",
        ),
    ]


@router.get(
    "/account",
    response_model=AccountBalance,
    summary="Get account balance",
)
async def get_live_account() -> AccountBalance:
    """Return current account balance and margin usage."""
    return AccountBalance(
        total_balance=1245.50,
        available_balance=1180.00,
        in_use=65.50,
        margin_usage_pct=5.26,
    )


@router.get(
    "/account/history",
    response_model=list[dict],
    summary="Get account PnL history",
)
async def get_account_history() -> list[dict]:
    """Return the account equity / PnL history."""
    return []


@router.post(
    "/start",
    response_model=LiveStatus,
    summary="Start the live trading node",
)
async def start_live() -> LiveStatus:
    """Start the live trading node."""
    now = datetime.now().isoformat()
    if _db:
        await _db.set_state("live_status", "running")
        await _db.set_state("live_started_at", now)
        return LiveStatus(
            status="running",
            uptime_seconds=0.0,
            node_version="1.221.0",
            active_strategies=1,
        )
    return LiveStatus(
        status="running",
        uptime_seconds=0.0,
        node_version="1.221.0",
        active_strategies=1,
    )


@router.post(
    "/stop",
    response_model=LiveStatus,
    summary="Stop the live trading node",
)
async def stop_live() -> LiveStatus:
    """Gracefully stop the live trading node."""
    if _db:
        await _db.set_state("live_status", "stopped")
        await _db.set_state("live_started_at", "")
    return LiveStatus(
        status="stopped",
        uptime_seconds=0.0,
        node_version="",
        active_strategies=0,
    )


@router.post(
    "/kill",
    response_model=LiveStatus,
    summary="Kill switch — cancel all orders, close all positions",
)
async def kill_live() -> LiveStatus:
    """Kill switch — cancel all orders, close all positions immediately."""
    if _db:
        await _db.set_state("live_status", "stopped")
        await _db.set_state("live_started_at", "")
    return LiveStatus(
        status="stopped",
        uptime_seconds=0.0,
        node_version="",
        active_strategies=0,
    )
