"""Strategy library endpoints — browse, inspect, and import strategies."""

from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from pydantic import BaseModel

from api.models.schemas import StrategyDetail, StrategyInfo, StrategyParam
from api.services.strategy_loader import StrategyLoader

router = APIRouter(prefix="/strategies", tags=["strategies"])

loader = StrategyLoader(strategies_dir="strategies")


def _ensure_strategy_exists(name: str) -> None:
    if loader.get_strategy_detail(name) is None:
        raise HTTPException(status_code=404, detail=f"Strategy '{name}' not found")


@router.get("", response_model=list[StrategyInfo])
async def list_strategies():
    """List all discovered strategies."""
    return loader.list_strategies()


@router.get("/{name}", response_model=StrategyDetail)
async def get_strategy(name: str):
    """Get strategy details including params and source code."""
    detail = loader.get_strategy_detail(name)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Strategy '{name}' not found")
    return detail


@router.get("/{name}/params", response_model=list[StrategyParam])
async def get_strategy_params(name: str):
    """Get parameter schema for a strategy (for dynamic form generation)."""
    _ensure_strategy_exists(name)
    return loader.get_strategy_params(name)


@router.get("/{name}/source")
async def get_strategy_source(name: str):
    """Get raw source code of a strategy."""
    source = loader.get_strategy_source(name)
    if source is None:
        raise HTTPException(status_code=404, detail=f"Strategy '{name}' not found")
    return {"name": name, "source": source, "lines": source.count("\n") + 1}


class StrategySourceUpdate(BaseModel):
    source: str


@router.put("/{name}/source")
async def update_strategy_source(name: str, body: StrategySourceUpdate):
    _ensure_strategy_exists(name)
    try:
        loader.save_strategy(name, body.source)
        return {
            "message": "Strategy saved",
            "name": name,
            "params": loader.get_strategy_params(name),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/import", status_code=201)
async def import_strategy(file: UploadFile = File(...)):
    """Import a new strategy Python file."""
    if not file.filename or not file.filename.endswith(".py"):
        raise HTTPException(status_code=400, detail="Only .py files are accepted")

    content = await file.read()
    tmp_path = Path(tempfile.gettempdir()) / file.filename
    tmp_path.write_bytes(content)

    try:
        result = loader.import_strategy(str(tmp_path))
        return {
            "message": "Strategy imported",
            "name": result.get("name", file.filename),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500, detail="Internal server error importing strategy"
        )
    finally:
        tmp_path.unlink(missing_ok=True)
