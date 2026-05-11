"""NautilusTrader UI — FastAPI application."""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import backtest, data, live, strategies


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    yield


app = FastAPI(
    title="NautilusTrader UI",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(backtest.router, prefix="/api")
app.include_router(strategies.router, prefix="/api")
app.include_router(live.router, prefix="/api")
app.include_router(data.router, prefix="/api")


@app.get("/", tags=["health"])
async def health_check():
    """Health check endpoint — verifies service dependencies."""
    checks = {}
    healthy = True

    strategies_dir = Path("strategies")
    if strategies_dir.exists():
        py_files = list(strategies_dir.glob("*.py"))
        non_init = [f for f in py_files if f.name != "__init__.py"]
        checks["strategies_dir"] = "ok" if strategies_dir.exists() else "missing"
        checks["strategy_files"] = len(non_init)
        if not non_init:
            checks["strategies"] = "warning: no strategy files found"
    else:
        checks["strategies_dir"] = "missing"
        checks["strategy_files"] = 0
        healthy = False

    status_code = 200 if healthy else 503
    return JSONResponse(
        content={
            "name": "NautilusTrader UI API",
            "version": "0.1.0",
            "status": "ok" if healthy else "degraded",
            "checks": checks,
        },
        status_code=status_code,
    )
