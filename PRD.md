# PRD: NautilusTrader UI

**Status**: Draft  
**Version**: 1.0  
**Date**: 2026-05-11  

## 1. Executive Summary

A general-purpose web UI for **nautilus_trader** (22K⭐, Rust-native algorithmic trading engine with Python strategy API). The UI lets traders design strategies, run backtests, visualize performance, and monitor live trading — without touching the command line.

Currently, nautilus_trader has no official UI. Users interact with it via Python scripts, Jupyter notebooks, or CLI. This creates a barrier: you need to write code to see results, and there's no unified view of your trading operation.

## 2. Goals

### Primary
- Provide a visual interface for running backtests and viewing results
- Allow configuration of strategy parameters without editing Python files
- Display performance metrics (Sharpe, PnL, drawdown, win rate) as charts and tables
- Support both backtesting and live trading monitoring

### Non-Goals
- Replace the nautilus_trader Python API (strategies still written in Python)
- Provide a strategy builder/editor (code is authored externally)
- Become a portfolio management system
- Support brokers/exchanges beyond what nautilus_trader adapters support

## 3. User Personas

### Persona A: Quant Trader
Builds strategies in Python, needs to iterate quickly. Wants to run backtests, tweak parameters, compare results side-by-side. Has strong technical skills but hates context-switching between editor and terminal.

### Persona B: Strategy Operator
Runs strategies developed by someone else. Needs to monitor live positions, PnL, and risk metrics. Wants alerts and dashboards. May not write code.

### Persona C: Researcher
Explores market data and strategy ideas. Runs many parameter sweeps. Needs to visualize results and export data for analysis.

## 4. Functional Requirements

### FR-1: Backtest Runner

**Description**: Configure and run backtests from the UI.

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | User selects a strategy Python file from a list | P0 |
| FR-1.2 | User configures strategy parameters via a form (auto-generated from StrategyConfig fields) | P0 |
| FR-1.3 | User sets backtest period (start date, end date) | P0 |
| FR-1.4 | User selects instrument/market | P0 |
| FR-1.5 | User sets initial capital | P1 |
| FR-1.6 | System runs the backtest and displays progress | P0 |
| FR-1.7 | User can cancel a running backtest | P1 |
| FR-1.8 | User can save backtest configurations as presets | P2 |
| FR-1.9 | User can run parameter sweeps (grid search over ranges) | P1 |

### FR-2: Backtest Results Dashboard

**Description**: Visualize backtest results.

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Display key metrics as cards: Sharpe, Sortino, Total PnL, Win Rate, Profit Factor, Max Drawdown, Total Trades | P0 |
| FR-2.2 | Show equity curve chart (portfolio value over time) | P0 |
| FR-2.3 | Show drawdown chart (percentage below peak) | P0 |
| FR-2.4 | Show monthly returns heatmap | P1 |
| FR-2.5 | Show trade list as a sortable/filterable table (entry time, exit time, side, size, entry price, exit price, PnL) | P0 |
| FR-2.6 | Show positions list | P1 |
| FR-2.7 | Show order fills list | P1 |
| FR-2.8 | Display distribution of trade returns (histogram) | P1 |
| FR-2.9 | Allow exporting results as CSV/JSON | P1 |
| FR-2.10 | Generate and display the HTML tearsheet | P2 |

### FR-3: Strategy Library

**Description**: Browse, import, and manage strategies.

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | List available strategies with name and description | P0 |
| FR-3.2 | Display strategy source code (read-only viewer with syntax highlighting) | P1 |
| FR-3.3 | Show strategy parameters with types and defaults | P0 |
| FR-3.4 | Allow importing a new strategy Python file | P1 |
| FR-3.5 | Show backtest history per strategy | P1 |
| FR-3.6 | Mark strategies as favorites | P2 |

### FR-4: Comparison View

**Description**: Compare multiple backtest runs.

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Select 2+ backtest runs to compare | P1 |
| FR-4.2 | Show metrics side-by-side in a table | P1 |
| FR-4.3 | Overlay equity curves on the same chart | P1 |
| FR-4.4 | Highlight which metrics improved/worsened between runs | P1 |

### FR-5: Live Trading Monitor

**Description**: Monitor live trading node.

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Display live positions (instrument, side, quantity, entry price, current price, unrealized PnL) | P1 |
| FR-5.2 | Display open orders (instrument, side, type, price, quantity, status) | P1 |
| FR-5.3 | Display account balance and margin | P1 |
| FR-5.4 | Show real-time PnL chart | P2 |
| FR-5.5 | Show recent fills feed | P2 |
| FR-5.6 | Kill switch (cancel all orders, close all positions) | P1 |
| FR-5.7 | Start/stop trading node | P2 |

### FR-6: Data & Market Browser

**Description**: Browse available instruments and market data.

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | List available instruments/venues | P1 |
| FR-6.2 | Show data coverage (date ranges, available history) | P2 |
| FR-6.3 | Show basic instrument info (tick size, lot size, currency) | P1 |
| FR-6.4 | Preview price chart for an instrument | P2 |

### FR-7: Configuration & Settings

**Description**: Manage system configuration.

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Set default backtest parameters (capital, commission model) | P1 |
| FR-7.2 | Configure data source paths | P2 |
| FR-7.3 | Manage Polymarket API credentials (encrypted storage) | P2 |
| FR-7.4 | Set risk limits for live trading | P2 |

## 5. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Backtest loading time | <30s for 6 months of tick data |
| NFR-2 | Chart rendering | <2s for equity curve |
| NFR-3 | UI runs locally | All processing on user's machine |
| NFR-4 | Strategy code never leaves user's machine | Fully self-custodied |
| NFR-5 | Supported nautilus_trader version | >= 1.226.0 |
| NFR-6 | Deployment | Docker container or standalone Python |
| NFR-7 | API credentials | Encrypted at rest (if stored) |

## 6. Architecture Options

### Option A: Streamlit (Recommended for v1)

```
┌──────────────────────────────────────────────────┐
│              Streamlit App (single process)      │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ Strategy │  │ Backtest │  │ Results View  │   │
│  │ Config   │  │ Runner   │  │ (charts +     │   │
│  │ Panel    │  │          │  │  tables)      │   │
│  └─────────┘  └──────────┘  └───────────────┘   │
│                        │                          │
│                        ▼                          │
│  ┌──────────────────────────────────────────┐    │
│  │         nautilus_trader BacktestEngine    │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

**Pros**: Fast to build, single dependency, no backend architecture needed, runs anywhere
**Cons**: No real-time updates, limited interactivity, all state in memory

### Option B: FastAPI + React (Recommended for v2)

```
┌──────────────────────────────────────────────────────┐
│                   Frontend (React/TS)                 │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌────────┐ │
│  │Strategy │  │ Backtest │  │ Live   │  │Settings│ │
│  │Config   │  │ Results  │  │Monitor │  │        │ │
│  └─────────┘  └──────────┘  └────────┘  └────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP REST + WebSocket
┌──────────────────────▼───────────────────────────────┐
│                   Backend (FastAPI/Python)            │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌────────┐ │
│  │ Backtest │  │ Strategy │  │ Live   │  │ Auth/  │ │
│  │ API      │  │ Manager  │  │ Node   │  │ Config │ │
│  │          │  │          │  │ Proxy  │  │        │ │
│  └────┬─────┘  └────┬─────┘  └────┬───┘  └────────┘ │
│       │             │             │                   │
│       ▼             ▼             ▼                   │
│  ┌──────────────────────────────────────────────┐     │
│  │         nautilus_trader (BacktestEngine      │     │
│  │         or Live TradingNode)                 │     │
│  └──────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────┘
```

**Pros**: Proper separation, real-time WebSocket, extensible, can add auth
**Cons**: More infrastructure, 2x build time, need to maintain 2 codebases

## 7. UI Wireframes (Text)

### Main Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Logo                    NautilusTrader UI              v1.0    │
├──────────┬──────────────────────────────────────────────────────┤
│          │  [Backtest] [Live] [Strategies] [Data] [Settings]    │
│  Sidebar ├──────────────────────────────────────────────────────┤
│          │                                                      │
│  Backtest│  ┌──────────────────────────────────────────────┐    │
│  History │  │  Backtest Results - Breakout v2              │    │
│  ─────── │  ├──────────┬──────────┬──────────┬───────────┤    │
│  Mar 10  │  │ Sharpe   │  PnL     │ Win Rate │ Max DD    │    │
│  Breakout│  │  1.42    │ +$342.50 │  44.2%   │ -12.3%    │    │
│  v1      │  ├──────────┴──────────┴──────────┴───────────┤    │
│  Mar 09  │  │                                              │    │
│  Breakout│  │  [Equity Curve Chart]                        │    │
│  initial │  │                                              │    │
│  Mar 09  │  │  ▁▃▅▇▆▇▅▃▁▂▄▆▇▇▆▅▃▁▂▃▅▇▆▅▃▁                │    │
│  EMA Crs │  │                                              │    │
│          │  ├──────────────────────────────────────────────┤    │
│          │  │  Trades                                      │    │
│          │  │  Date  │ Side│ Size│ Entry│ Exit│ PnL        │    │
│          │  │  ...   │ BUY │  5  │ 0.45 │ 0.92│ +2.35     │    │
│          │  │  ...   │ BUY │  5  │ 0.30 │ 0.28│ -0.10     │    │
│          │  └──────────────────────────────────────────────┘    │
└──────────┴──────────────────────────────────────────────────────┘
```

### Backtest Config Panel

```
┌─────────────────────────────────────────────┐
│  New Backtest                                │
├─────────────────────────────────────────────┤
│  Strategy: [BreakoutStrategy       ▼]       │
│  Instrument: [BTC-15M-UP.POLYMARKET    ▼]  │
│  Start: [2025-01-01]  End: [2025-06-01]    │
│  Initial Capital: [$1000.00               ] │
│                                              │
│  Parameters:                                 │
│  ┌──────────────────────────────────────┐   │
│  │ trade_size:       [5       ]         │   │
│  │ window:           [120     ]         │   │
│  │ breakout_std:     [1.50    ]         │   │
│  │ breakout_buffer:  [0.001   ]         │   │
│  │ take_profit:      [0.015   ]         │   │
│  │ stop_loss:        [0.02    ]         │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [▶ Run Backtest]  [Save Config]             │
└─────────────────────────────────────────────┘
```

### Live Monitor Panel

```
┌──────────────────────────────────────────────────────────────┐
│  Live Trading                              [STOP] [KILL]    │
├──────────────────────────────────────────────────────────────┤
│  Status: ● Running    Uptime: 12h 34m    Node: v1.226.0    │
├──────────┬──────────┬──────────┬───────────────────────────┤
│ Positions│ Orders   │ Balance  │ Real-time PnL             │
│ ──────── │ ─────── │ ──────── │                            │
│ BTC-15M  │ 2 open   │ $1,245   │  [Mini equity chart]      │
│  BUY 5   │ GTC      │          │  ▁▃▅▇▆▇▅▃                │
│  Entry:  │ 0.45 ×2  │          │                            │
│  Current:│          │          │  PnL: +$23.40 (+2.3%)     │
│  0.52    │          │          │                            │
└──────────┴──────────┴──────────┴───────────────────────────┘
```

## 8. API Endpoints (FastAPI Option)

### Backtest Endpoints
```
POST   /api/backtest/run              # Run a backtest (returns run_id)
GET    /api/backtest/{run_id}/status  # Poll backtest progress
GET    /api/backtest/{run_id}/results # Get metrics & report paths
GET    /api/backtest/{run_id}/trades  # Get trade list
GET    /api/backtest/{run_id}/positions # Get positions
GET    /api/backtest/{run_id}/fills   # Get order fills
DELETE /api/backtest/{run_id}         # Delete results

POST   /api/backtest/sweep            # Run parameter sweep
GET    /api/backtest/sweep/{id}       # Get sweep results
```

### Strategy Endpoints
```
GET    /api/strategies                # List all available strategies
GET    /api/strategies/{name}         # Get strategy details + params
GET    /api/strategies/{name}/params  # Get parameter schema (for form generation)
GET    /api/strategies/{name}/source  # Get source code
POST   /api/strategies/import         # Import a strategy file

GET    /api/strategies/{name}/history # Get backtest history for this strategy
```

### Live Trading Endpoints
```
GET    /api/live/status               # Node status (running/stopped)
POST   /api/live/start                # Start trading node
POST   /api/live/stop                 # Stop trading node
POST   /api/live/kill                 # Kill switch (cancel all + close all)

GET    /api/live/positions            # Current positions
GET    /api/live/orders               # Open orders
GET    /api/live/account              # Account balances
GET    /api/live/pnl                  # Realized + unrealized PnL
```

### Data Endpoints
```
GET    /api/instruments               # List available instruments
GET    /api/instruments/{id}          # Instrument details
GET    /api/data/coverage/{venue}     # Available date ranges per instrument
```

## 9. Tech Stack Recommendation

### v1 (Streamlit) — 2-3 days
```
streamlit==1.40+
pandas==2.x
plotly==5.x (for interactive charts)
nautilus_trader[polymarket,visualization]==1.226.0
```

### v2 (FastAPI + React) — 2-3 weeks
```
Backend:
  fastapi==0.115+
  uvicorn==0.34+
  nautilus_trader[polymarket,visualization]==1.226.0
  pandas==2.x

Frontend:
  React 18+ / TypeScript
  Vite (build)
  Recharts (charts)
  TanStack Table (data grids)
  TailwindCSS (styling)
  Zustand or Jotai (state)
```

## 10. Milestones

| Milestone | Scope | Timeline | Dependencies |
|-----------|-------|----------|-------------|
| M1 | Streamlit MVP: run backtest from config form, display metrics + equity curve + trade list | 2-3 days | nautilus_trader installed |
| M2 | Add parameter sweep, comparison view, strategy library browser | +2 days | M1 |
| M3 | Live monitor: positions, orders, account, kill switch | +3 days | M2, running TradingNode |
| M4 | FastAPI + React frontend (v2) | 2-3 weeks | M1-M3 as reference |

## 11. Future Considerations

- **Strategy editor** — Monaco-based code editor for modifying strategies in-browser
- **Walk-forward analysis** — Built-in walk-forward with parameter optimization
- **Backtest queue** — Run multiple backtests in parallel, view results as they complete
- **Alerting** — Telegram/Discord notifications for drawdown, fills, strategy signals
- **Multi-user** — Read-only sharing of results
- **Plugin system** — Third-party strategy packs
- **Dark mode** — Because every trading dashboard needs it

## 12. Open Questions

1. Should the UI be a separate Docker container or run directly on the host?
2. How should strategy files be discovered? Filesystem glob? Explicit import?
3. For live trading, should the UI manage the TradingNode lifecycle or connect to an already-running node?
4. What's the priority between backtest visualization vs live monitoring?
