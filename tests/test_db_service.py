import pytest
from api.db_service import DbService


@pytest.mark.asyncio
async def test_create_and_get_run(db_service: DbService):
    config = {
        "strategy_name": "BreakoutStrategy",
        "instrument_id": "BTC-15M-UP.POLYMARKET",
        "start_date": "2025-01-01",
        "end_date": "2025-06-01",
        "initial_capital": "10000",
    }
    await db_service.create_run("test-run-1", config)
    run = await db_service.get_run("test-run-1")
    assert run is not None
    assert run.status == "pending"
    assert run.progress == 0.0


@pytest.mark.asyncio
async def test_update_run_status(db_service: DbService):
    await db_service.create_run("test-run-2", {})
    await db_service.update_run_status("test-run-2", "running", 0.5)
    run = await db_service.get_run("test-run-2")
    assert run.status == "running"


@pytest.mark.asyncio
async def test_update_run_with_error(db_service: DbService):
    await db_service.create_run("test-err", {})
    await db_service.update_run_status("test-err", "failed", 0.0, error="crashed")
    run = await db_service.get_run("test-err")
    assert run.error == "crashed"


@pytest.mark.asyncio
async def test_update_run_results(db_service: DbService):
    await db_service.create_run("test-run-3", {})
    await db_service.update_run_results(
        "test-run-3",
        {
            "sharpe_ratio": 1.5,
            "total_pnl": 342.50,
            "win_rate": 0.44,
            "total_trades": 12,
        },
        [{"timestamp": "2025-01-01T00:00:00", "value": 10000.0}],
        [
            {
                "entry_time": "2025-01-15",
                "side": "BUY",
                "size": 5,
                "entry_price": 0.45,
                "pnl": 0.35,
                "instrument_id": "BTC-15M-UP.POLYMARKET",
            }
        ],
        [
            {
                "instrument_id": "BTC-15M-UP.POLYMARKET",
                "side": "BUY",
                "quantity": 5,
                "entry_price": 0.45,
                "current_price": 0.52,
                "unrealized_pnl": 0.35,
            }
        ],
    )
    run = await db_service.get_run("test-run-3")
    assert run.sharpe_ratio == 1.5
    eq = await db_service.get_equity_curve("test-run-3")
    assert len(eq) == 1
    assert eq[0]["value"] == 10000.0
    tr = await db_service.get_trades("test-run-3")
    assert len(tr) == 1
    assert tr[0]["pnl"] == 0.35
    pos = await db_service.get_positions("test-run-3")
    assert len(pos) == 1
    assert pos[0]["unrealized_pnl"] == 0.35


@pytest.mark.asyncio
async def test_cascade_delete(db_service: DbService):
    await db_service.create_run("test-del", {})
    await db_service.update_run_results(
        "test-del", {}, [{"timestamp": "x", "value": 1}], [], []
    )
    await db_service.append_log("test-del", 0, "log")
    await db_service.delete_run("test-del")
    assert await db_service.get_run("test-del") is None
    assert await db_service.get_equity_curve("test-del") == []


@pytest.mark.asyncio
async def test_append_and_get_logs(db_service: DbService):
    await db_service.create_run("test-logs", {})
    await db_service.append_log("test-logs", 0, "Starting")
    await db_service.append_log("test-logs", 1, "Running")
    assert len(await db_service.get_logs("test-logs")) == 2
    assert (await db_service.get_logs("test-logs", since=1))[0] == "Running"


@pytest.mark.asyncio
async def test_sweep_lifecycle(db_service: DbService):
    await db_service.create_sweep("sweep-1", {"param": "window"})
    await db_service.update_sweep(
        "sweep-1",
        "completed",
        [{"param_value": "20", "metrics": {"sharpe_ratio": 1.2}}],
    )
    s = await db_service.get_sweep("sweep-1")
    assert s["status"] == "completed"
    assert s["results"][0]["metrics"]["sharpe_ratio"] == 1.2


@pytest.mark.asyncio
async def test_list_runs(db_service: DbService):
    for i in range(3):
        await db_service.create_run(f"list-{i}", {})
    assert len(await db_service.list_runs(limit=2)) == 2


@pytest.mark.asyncio
async def test_prune_runs(db_service: DbService):
    await db_service.create_run("prune-1", {})
    await db_service.update_run_results("prune-1", {}, [], [], [])
    await db_service.create_run("prune-2", {})
    await db_service.update_run_results("prune-2", {}, [], [], [])
    count = await db_service.prune_runs("3000-01-01")
    assert count >= 2
    assert await db_service.get_run("prune-1") is None
    assert await db_service.get_run("prune-2") is None


@pytest.mark.asyncio
async def test_system_state(db_service: DbService):
    assert await db_service.get_state("live") is None
    await db_service.set_state("live", "running")
    assert await db_service.get_state("live") == "running"


@pytest.mark.asyncio
async def test_get_nonexistent(db_service: DbService):
    assert await db_service.get_run("nonexistent") is None
    assert await db_service.get_sweep("nonexistent") is None
