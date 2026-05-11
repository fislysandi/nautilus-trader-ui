"""NautilusTrader UI — FastAPI application."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/")
async def root() -> dict[str, str]:
    """Health-check root endpoint."""
    return {
        "name": "NautilusTrader UI API",
        "version": "0.1.0",
        "status": "ok",
    }
