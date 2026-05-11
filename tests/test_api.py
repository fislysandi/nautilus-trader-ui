"""Pytest tests for NautilusTrader UI API routes."""

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_root():
    """GET / returns health check with status ok."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_strategies_list():
    """GET /api/strategies returns strategy list including BreakoutStrategy."""
    response = client.get("/api/strategies")
    assert response.status_code == 200
    strategies = response.json()
    assert isinstance(strategies, list)

    names = [s["name"] for s in strategies]
    assert "BreakoutStrategy" in names


def test_strategy_params():
    """GET /api/strategies/BreakoutStrategy/params returns param schema."""
    response = client.get("/api/strategies/BreakoutStrategy/params")
    assert response.status_code == 200
    params = response.json()
    assert len(params) > 0


def test_strategy_source():
    """GET /api/strategies/BreakoutStrategy/source returns source code."""
    response = client.get("/api/strategies/BreakoutStrategy/source")
    assert response.status_code == 200
    data = response.json()
    assert "source" in data
    assert data["lines"] > 0


def test_strategy_not_found():
    """GET /api/strategies/Nonexistent returns 404."""
    response = client.get("/api/strategies/Nonexistent")
    assert response.status_code == 404


def test_backtest_run():
    """POST /api/backtest/run returns 202 with run_id."""
    response = client.post("/api/backtest/run", json={
        "strategy_name": "BreakoutStrategy",
        "instrument_id": "BTC-15M-UP.POLYMARKET",
        "start_date": "2025-01-01",
        "end_date": "2025-01-02",
        "initial_capital": "10000",
        "params": {"trade_size": 1},
    })
    assert response.status_code == 202
    assert "run_id" in response.json()


def test_backtest_status_not_found():
    """GET /api/backtest/nonexistent/status returns 404."""
    response = client.get("/api/backtest/nonexistent/status")
    assert response.status_code == 404


def test_live_status():
    """GET /api/live/status returns valid status."""
    response = client.get("/api/live/status")
    assert response.status_code == 200
    assert response.json()["status"] in ("running", "stopped")


def test_live_start_stop():
    """POST /api/live/start then stop changes status accordingly."""
    client.post("/api/live/start")
    response = client.get("/api/live/status")
    assert response.json()["status"] == "running"

    client.post("/api/live/stop")
    response = client.get("/api/live/status")
    assert response.json()["status"] == "stopped"


def test_live_kill():
    """POST /api/live/kill returns 200."""
    response = client.post("/api/live/kill")
    assert response.status_code == 200


def test_live_positions():
    """GET /api/live/positions returns 200."""
    response = client.get("/api/live/positions")
    assert response.status_code == 200


def test_live_orders():
    """GET /api/live/orders returns 200."""
    response = client.get("/api/live/orders")
    assert response.status_code == 200


def test_live_account():
    """GET /api/live/account returns account with total_balance."""
    response = client.get("/api/live/account")
    assert response.status_code == 200
    data = response.json()
    assert "total_balance" in data


def test_instruments_list():
    """GET /api/instruments returns non-empty instrument list."""
    response = client.get("/api/instruments")
    assert response.status_code == 200
    instruments = response.json()
    assert len(instruments) > 0


def test_instrument_detail():
    """GET /api/instruments/BTC-15M-UP.POLYMARKET returns 200."""
    response = client.get("/api/instruments/BTC-15M-UP.POLYMARKET")
    assert response.status_code == 200


def test_instrument_not_found():
    """GET /api/instruments/NONEXISTENT returns 404."""
    response = client.get("/api/instruments/NONEXISTENT")
    assert response.status_code == 404
