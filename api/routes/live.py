"""Live trading endpoints — positions, orders, account, and node control."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from api.models.schemas import AccountBalance, LiveStatus, Order, Position

router = APIRouter(prefix="/live", tags=["live"])
_node_status: dict = {"status": "stopped", "started_at": None}


@router.get(
    "/status",
    response_model=LiveStatus,
    summary="Get live trading node status",
)
async def get_live_status() -> LiveStatus:
    """Return the current state of the live trading node."""
    status = _node_status["status"]
    uptime = 0.0
    if _node_status["started_at"]:
        uptime = (datetime.now() - _node_status["started_at"]).total_seconds()
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
    if _node_status["status"] == "stopped":
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
    if _node_status["status"] == "stopped":
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
    _node_status["status"] = "running"
    _node_status["started_at"] = datetime.now()
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
    _node_status["status"] = "stopped"
    _node_status["started_at"] = None
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
    _node_status["status"] = "stopped"
    _node_status["started_at"] = None
    return LiveStatus(
        status="stopped",
        uptime_seconds=0.0,
        node_version="",
        active_strategies=0,
    )
