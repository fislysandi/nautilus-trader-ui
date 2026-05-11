# NautilusTrader UI — Context Dump

## What This Project Is

A general-purpose UI/dashboard for **nautilus_trader** — the open-source algorithmic trading engine (22K⭐, github.com/nautechsystems/nautilus_trader). 

The UI should let a trader:
- Design and configure strategies
- Run backtests with parameter sweeps
- Visualize results (equity curves, metrics, trade lists)
- Monitor live trading nodes (positions, orders, PnL)
- Compare strategies side-by-side
- Export/import strategy configs

**Not tied to any specific strategy or market.** Should work with any nautilus_trader strategy on any instrument.

## Technical Context

### nautilus_trader Core Concepts

nautilus_trader is a **Rust-native trading engine with a Python strategy API**:

```
┌─────────────────────────────────────────────┐
│              Trading Node                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Backtest │  │ Sandbox  │  │   Live   │  │
│  │  Engine  │  │  Engine  │  │  Node    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│         │            │            │         │
│         ▼            ▼            ▼         │
│  ┌──────────────────────────────────────┐   │
│  │         Strategy (Python)            │   │
│  │  on_start → on_data → on_order...   │   │
│  └──────────────────────────────────────┘   │
│         │            │            │         │
│         ▼            ▼            ▼         │
│  ┌──────────────────────────────────────┐   │
│  │        Adapters (Rust/Python)        │   │
│  │  Polymarket │ Binance │ IB │ etc.    │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

Key architectural points:
- **Same code for backtest and live** — no rewrite needed
- **Strategies are Python classes** inheriting from `Strategy`
- **Adapter pattern** — Polymarket, Binance, Interactive Brokers, etc. all plug in the same way
- **BacktestEngine** for historical simulation
- **TradingNode** for live execution

### The Polymarket Adapter

Already installed and working. Supports:
- `POLYMARKET_VENUE` — venue constant
- `PolymarketDataLoader` — loads historical trade data
- `PolymarketLiveDataClientFactory` — live data client
- `PolymarketLiveExecClientFactory` — live execution client
- Auth: EOA (type 0), Magic Wallet (type 1), Gnosis Safe (type 2), Deposit Wallet (type 3)

### Strategy Anatomy

Every nautilus_trader strategy follows this pattern:

```python
from nautilus_trader.trading.strategy import Strategy
from nautilus_trader.config import StrategyConfig

class MyStrategyConfig(StrategyConfig, frozen=True):
    instrument_id: str = ""
    trade_size: Decimal = Decimal(5)
    # ... any parameters ...

class MyStrategy(Strategy):
    def __init__(self, config: MyStrategyConfig):
        super().__init__(config)
        self.config = config

    def on_start(self):
        # Subscribe to data, initialize state
        pass

    def on_order_book_deltas(self, deltas):
        # React to orderbook changes
        pass

    def on_bar(self, bar):
        # React to OHLCV bars
        pass

    def on_order_filled(self, order_fill):
        # Track fills
        pass

    def on_stop(self):
        # Cleanup
        pass
```

### Metrics Available After Backtest

```python
engine = BacktestEngine(config=...)
engine.run()

analyzer = engine.portfolio.analyzer

# Returns-based statistics
stats_returns = analyzer.get_performance_stats_returns()
# Keys: "Sharpe Ratio (252 days)", "Sortino Ratio (252 days)",
#        "Returns Average", "Volatility (ann.)", "Max Return", "Min Return"

# PnL-based statistics
stats_pnls = analyzer.get_performance_stats_pnls()
# Keys: "PnL (total)", "PnL Mean", "PnL Max", "PnL Min"

# General statistics
stats_general = analyzer.get_performance_stats_general()
# Keys: "Profit Factor", "Win Rate", "Avg Win", "Avg Loss",
#        "Max Loss", "Max Win", "Expectancy", "Total Trades"

# Reports
positions = engine.trader.generate_positions_report()  # DataFrame
fills = engine.trader.generate_fills_report()           # DataFrame
account = engine.trader.generate_account_report(...)     # DataFrame

# Tearsheet (HTML)
from nautilus_trader.analysis import create_tearsheet
create_tearsheet(engine, output_path="tearsheet.html")
```

### Available Generated Reports

```python
from nautilus_trader.analysis import ReportProvider

provider = ReportProvider(engine)
positions_report = provider.positions_report()    # DataFrame
fills_report = provider.fills_report()             # DataFrame
orders_report = provider.orders_report()           # DataFrame
account_report = provider.account_report(venue)    # DataFrame
instrument_report = provider.instrument_report()   # DataFrame
```

## The Auto-Research Loop (Supplementary)

There's also an auto-research loop running on the server that evolves a breakout strategy by:
1. Modifying strategy parameters
2. Running backtest
3. Keeping only changes that improve Sharpe

The UI could optionally integrate with this by reading from `experiments.db` and `results.tsv`, but the core purpose is a **general nautilus_trader dashboard**.

## The 13 Built-In Strategy Patterns

From the prediction-market-backtesting extension (cloned at `strategies/prediction-market-backtesting/`), these strategy patterns exist:

| Strategy | Type | Signal |
|----------|------|--------|
| Breakout | Statistical | Price > mean + N*std |
| VWAP Reversion | Mean reversion | Price < VWAP - threshold |
| Threshold Momentum | Momentum | Cross above entry price |
| RSI Reversion | Mean reversion | RSI oversold |
| Panic Fade | Event-driven | Price crash from peak |
| Microprice Imbalance | L2 microstructure | Bid depth vs ask depth |
| Mean Reversion | Mean reversion | Price < rolling avg |
| Late Favorite Limit Hold | Late-game | Price near 1.0 pre-close |
| Final Period Momentum | Late-game | Breakout in final minutes |
| EMA Crossover | Trend | Fast EMA crosses slow EMA |
| Deep Value Hold | Value | Price < 0.25 |
| Binary Pair Arb | Arbitrage | Complementary tokens < $1 |
| Account Trade Replay | N/A | Replay historical trades |

Each one inherits from `LongOnlyPredictionMarketStrategy` in `strategies/core.py` at the cloned repo path.

## UI Technical Recommendations

### Option A: Streamlit (Recommended for 1-2 day build)
- Single Python script
- Reads from nautilus_trader directly (import the library)
- Can run backtests on-demand
- `st.line_chart`, `st.dataframe`, `st.metric` for visualization
- `st.file_uploader` for loading strategy configs
- Deploy: `streamlit run dashboard.py --server.port 8501`
- Add to docker-compose as another service
- Pros: Fast to build, no backend needed, runs in container

### Option B: FastAPI + React (1-2 weeks, more flexible)
- FastAPI backend with endpoints to:
  - Run backtests (POST /api/backtest)
  - List strategies (GET /api/strategies)
  - Get metrics (GET /api/results/{id})
  - Monitor live node (WebSocket /ws/live)
- React frontend with:
  - Recharts for charts
  - DataGrid for trade/position tables
  - Strategy config editor (JSON or form)
- Separate Docker service in compose stack

### Option C: Grafana + SQLite (monitoring-only)
- If live trading, expose metrics to Prometheus
- Grafana dashboards for PnL, positions, drawdown
- Not interactive (can't run backtests from it)

## Installation (for UI development)

nautilus_trader can be installed anywhere:
```bash
pip install nautilus_trader[polymarket]
# or with visualization extras:
pip install "nautilus_trader[polymarket,visualization]"
```

The existing server uses a Docker container. The UI could:
1. Run **inside** the existing container (as a new service in docker-compose)
2. Run **locally** on the development machine, connecting to the server's data
3. Run as a **standalone** container that only needs nautilus_trader installed

## Server Connection for Live Data

If the UI needs live Polymarket data:
```bash
# Redis is exposed on localhost:6379
# Jupyter on localhost:8888
# Both accessible via SSH tunnel:
ssh -L 8888:127.0.0.1:8888 -L 6379:127.0.0.1:6379 -L 8501:127.0.0.1:8501 mykingdom
```

## Key Files on Server

| Path | What |
|------|------|
| `~/docker-containers/nautilustrader/docker-compose.yml` | Docker stack |
| `~/docker-containers/nautilustrader/Dockerfile` | Container build |
| `~/docker-containers/nautilustrader/autoresearch/` | Auto-research loop |
| `~/docker-containers/nautilustrader/strategies/prediction-market-backtesting/` | PM backtesting extension with 13 strategies |
| `~/docker-containers/nautilustrader/data/` | Market data, experiment DB |
| `~/docker-containers/nautilustrader/data/pmxt/` | PMXT L2 book archives (if downloaded) |
