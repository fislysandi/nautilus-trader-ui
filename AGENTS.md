# NautilusTrader UI — Agent Instructions

## Project Overview

Build a **general-purpose web UI for nautilus_trader** — the open-source algorithmic trading engine (22K⭐, Rust-native with Python strategy API).

The UI lets traders:
- Configure and run backtests
- Visualize results (equity curves, metrics, trade lists)
- Monitor live trading (positions, orders, PnL)
- Compare strategies side-by-side
- Browse strategy library and market data

## Key Files — Read First

| File | What It Contains |
|------|------------------|
| `PRD.md` | Full product requirements document — features, API endpoints, wireframes |
| `DESIGN.md` | Material 3 design system — colors, typography, components, `@material/web` usage |
| `CONTEXT.md` | Server architecture, nautilus_trader internals, data sources, deployment |
| `breakout.py` | Example strategy (reference for how strategies look in nautilus_trader) |
| `docker-compose.yml` | Current server deployment (dev server: `mykingdom`, user: `claw`) |
| `prepare.py` | Backtest engine setup and metric extraction API |
| `run_experiment.py` | Auto-research loop orchestrator (reference for how backtests are run) |

## Tech Stack

### Option A: Streamlit (recommended for v1, 2-3 days)
```
streamlit==1.40+
pandas==2.x
plotly==5.x (interactive charts)
nautilus_trader[polymarket,visualization]==1.226.0
```

### Option B: FastAPI + React (recommended for v2, 2-3 weeks)
```
Backend:
  fastapi==0.115+
  uvicorn==0.34+
  nautilus_trader[polymarket,visualization]==1.226.0
  pandas==2.x

Frontend:
  React 18+ / TypeScript
  Vite
  Recharts (charts)
  TanStack Table (data grids)
  TailwindCSS (styling) + @material/web components
  Zustand or Jotai (state)
```

## Design System

**Material 3** via `@material/web` web components. Full design tokens in `DESIGN.md`.

Key colors:
- Primary: `#5e6ad2` (lavender-blue)
- Surface: `#010102` (near-black)
- On-surface: `#f7f8f8` (light gray)
- Success: `#27a644` / Danger: `#ef4444`

Theme via CSS custom properties:
```css
:root {
  --md-sys-color-primary: #5e6ad2;
  --md-sys-color-surface: #010102;
  --md-sys-color-surface-container-low: #0f1011;
  --md-sys-color-surface-container: #141516;
}
```

Use `<md-*>` components from `@material/web` for all UI controls.

## Architecture

```
┌────────────────────────────────────────────────────┐
│  Frontend (React + @material/web + Recharts)       │
│  ┌────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │Backtest│ │ Results │ │  Live   │ │Settings  │  │
│  │Config  │ │  View   │ │ Monitor │ │          │  │
│  └────────┘ └─────────┘ └─────────┘ └──────────┘  │
└────────────────────┬───────────────────────────────┘
                     │ HTTP REST + WebSocket
┌────────────────────▼───────────────────────────────┐
│  Backend (FastAPI / Python)                        │
│                                                     │
│  POST /api/backtest/run       → run backtest       │
│  GET  /api/backtest/{id}      → get results        │
│  GET  /api/strategies         → list strategies    │
│  GET  /api/live/positions     → live positions     │
│  WS   /api/live/ws            → real-time updates  │
│                                                     │
│  Backend wraps nautilus_trader's:                   │
│    - BacktestEngine (backtesting)                   │
│    - TradingNode (live execution)                   │
│    - PortfolioAnalyzer (metric extraction)          │
└─────────────────────────────────────────────────────┘
```

### Key nautilus_trader APIs to use:

```python
# Run backtest
from nautilus_trader.backtest.engine import BacktestEngine
engine = BacktestEngine(config=...)
engine.add_venue(...)
engine.add_instrument(...)
engine.add_data(...)
engine.add_strategy(strategy)
engine.run()

# Extract metrics
analyzer = engine.portfolio.analyzer
sharpe = analyzer.get_performance_stats_returns().get("Sharpe Ratio (252 days)")
pnl = analyzer.get_performance_stats_pnls().get("PnL (total)")
win_rate = analyzer.get_performance_stats_general().get("Win Rate")

# Get trades/positions as DataFrames
positions = engine.trader.generate_positions_report()
fills = engine.trader.generate_fills_report()

# Live trading
from nautilus_trader.live.node import TradingNode
node = TradingNode(config=...)
node.run()  # same strategy, no code changes
```

## Build Instructions (Worktrunk)

Use **git worktrees** to build the frontend and backend in parallel.

### Setup

```bash
# Clone once
git clone <repo-url> nautilus-trader-ui
cd nautilus-trader-ui

# Create worktrees for parallel development
git worktree add ../nautilus-trader-ui-backend backend
git worktree add ../nautilus-trader-ui-frontend frontend
```

### Backend worktree

```bash
cd ../nautilus-trader-ui-backend

# Create a new branch for backend work
git checkout -b feat/backend-api

# Install
pip install "nautilus_trader[polymarket,visualization]" fastapi uvicorn pandas

# Run
uvicorn api.main:app --reload --port 8000
```

Structure:
```
backend/
├── api/
│   ├── main.py              # FastAPI app
│   ├── routes/
│   │   ├── backtest.py      # POST /api/backtest/run, GET /api/backtest/{id}
│   │   ├── strategies.py    # GET /api/strategies, GET /api/strategies/{name}
│   │   ├── live.py          # GET /api/live/positions, orders, account
│   │   └── data.py          # GET /api/instruments, data coverage
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   └── services/
│       ├── backtest_service.py  # Orchestrates BacktestEngine
│       └── live_service.py      # Orchestrates TradingNode
├── requirements.txt
└── Dockerfile
```

### Frontend worktree

```bash
cd ../nautilus-trader-ui-frontend

# Create a new branch for frontend work
git checkout -b feat/frontend-ui

# Install
npm create vite@latest . -- --template react-ts
npm install @material/web recharts @tanstack/react-table zustand

# Run
npm run dev
```

Structure:
```
frontend/
├── src/
│   ├── App.tsx              # Root layout: TopAppBar + NavDrawer + Router
│   ├── routes/
│   │   ├── Dashboard.tsx    # Main dashboard: metric cards, charts, tables
│   │   ├── Backtest.tsx     # Backtest config form + results
│   │   ├── LiveMonitor.tsx  # Live positions, orders, account
│   │   ├── Strategies.tsx   # Strategy library browser
│   │   └── Settings.tsx     # API credentials, risk limits
│   ├── components/
│   │   ├── MetricCard.tsx   # Single metric display card
│   │   ├── DataTable.tsx    # Sortable, filterable table
│   │   ├── EquityChart.tsx  # Equity curve + drawdown
│   │   └── StatusBadge.tsx  # M3 badge for status
│   ├── api/
│   │   └── client.ts        # API client (fetch wrappers)
│   ├── stores/
│   │   └── trading.ts       # Zustand store
│   └── theme.css            # M3 CSS custom properties
├── index.html
├── vite.config.ts
└── Dockerfile
```

### Merge worktrees

```bash
# Backend worktree — push and PR
cd ../nautilus-trader-ui-backend
git add . && git commit -m "feat: backend API"
git push -u origin feat/backend-api
# Create PR → merge to main

# Frontend worktree — push and PR
cd ../nautilus-trader-ui-frontend
git add . && git commit -m "feat: frontend UI"
git push -u origin feat/frontend-ui
# Create PR → merge to main
```

## Priority Build Order

1. **Backend: API scaffolding** — FastAPI routes, strategy loader, backtest runner (raw engine wrapper)
2. **Frontend: Dashboard** — TopAppBar, NavDrawer, MetricCards, DataTable (static mock data first)
3. **Integration** — Wire frontend to backend, run real backtest
4. **Charts** — Equity curve, drawdown, monthly returns heatmap
5. **Live Monitor** — Positions, orders, account panels
6. **Strategy Library** — Browse, import, view source
7. **Deploy** — Dockerize, add to compose stack on server

## Server Info

| Field | Value |
|-------|-------|
| SSH | `ssh mykingdom` (user: `claw`, key: `~/.ssh/id_ed25519`) |
| Containers | `/home/claw/docker-containers/nautilustrader/` |
| Jupyter | `http://localhost:8888/lab?token=nt` (via SSH tunnel) |
| Redis | `localhost:6379` |
| PM Backtesting | cloned at `strategies/prediction-market-backtesting/` |

## Dev Server

```bash
# SSH tunnel for development:
ssh -L 8000:127.0.0.1:8000 -L 3000:127.0.0.1:3000 mykingdom
# Backend on :8000, Frontend on :3000
```

## Deployment

Add as services to the existing `docker-compose.yml` on the server:
```yaml
backend:
  build: ./backend
  ports: ["127.0.0.1:8000:8000"]

frontend:
  build: ./frontend
  ports: ["127.0.0.1:3000:3000"]
```

## Key Principles

1. **Data density over decoration** — no gradients, no illustrations, no decorative color
2. **Dark theme only** — no light mode
3. **M3 via `@material/web`** — use web components, not custom HTML controls
4. **Same code for backtest and live** — nautilus_trader strategies don't change between sim and prod
5. **Metric cards are compact** — no icons, just label + value + delta
6. **Semantic color for PnL only** — green positive, red negative
