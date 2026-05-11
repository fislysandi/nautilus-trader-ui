"""Market data endpoints — instruments and data coverage."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.models.schemas import Instrument

router = APIRouter(tags=["data"])

# Static instrument list derived from config.yaml
INSTRUMENTS: dict[str, Instrument] = {
    "BTC-15M-UP.POLYMARKET": Instrument(
        id="BTC-15M-UP.POLYMARKET",
        venue="POLYMARKET",
        tick_size=0.0001,
        lot_size=1.0,
        currency="USDC",
    ),
    "ETH-1H-UP.POLYMARKET": Instrument(
        id="ETH-1H-UP.POLYMARKET",
        venue="POLYMARKET",
        tick_size=0.0001,
        lot_size=1.0,
        currency="USDC",
    ),
    "BTC-5M-DOWN.POLYMARKET": Instrument(
        id="BTC-5M-DOWN.POLYMARKET",
        venue="POLYMARKET",
        tick_size=0.0001,
        lot_size=1.0,
        currency="USDC",
    ),
}


@router.get(
    "/instruments",
    response_model=list[Instrument],
    summary="List available instruments",
)
async def list_instruments() -> list[Instrument]:
    """Return all instruments available for backtesting and live trading."""
    return list(INSTRUMENTS.values())


@router.get(
    "/instruments/{instrument_id}",
    response_model=Instrument,
    summary="Get instrument details",
)
async def get_instrument(instrument_id: str) -> Instrument:
    """Return details for a single instrument by ID."""
    inst = INSTRUMENTS.get(instrument_id)
    if inst is None:
        raise HTTPException(
            status_code=404,
            detail=f"Instrument '{instrument_id}' not found",
        )
    return inst


@router.get(
    "/data/coverage/{venue}",
    response_model=dict,
    summary="Get data coverage for a venue",
)
async def get_data_coverage(venue: str) -> dict:
    """Return available date ranges per instrument for the given venue."""
    if venue.upper() != "POLYMARKET":
        raise HTTPException(
            status_code=404,
            detail=f"Venue '{venue}' not found",
        )
    return {
        "venue": venue,
        "instruments": {
            "BTC-15M-UP.POLYMARKET": {
                "start": "2024-06-01",
                "end": "2025-06-01",
                "total_days": 365,
            },
            "ETH-1H-UP.POLYMARKET": {
                "start": "2024-08-01",
                "end": "2025-06-01",
                "total_days": 304,
            },
        },
    }
