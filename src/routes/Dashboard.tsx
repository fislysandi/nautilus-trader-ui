import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradingStore } from '../stores/trading';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import EquityChart from '../components/EquityChart';

const tradeColumns = [
  { key: 'entry_time', label: 'Entry', sortable: true },
  { key: 'side', label: 'Side', sortable: true },
  { key: 'size', label: 'Size', sortable: true, numeric: true },
  { key: 'entry_price', label: 'Entry', sortable: true, numeric: true },
  { key: 'exit_price', label: 'Exit', sortable: true, numeric: true },
  { key: 'pnl', label: 'PnL', sortable: true, numeric: true,
    render: (val: unknown) => {
      const numVal = val as number;
      return (
        <span className={numVal >= 0 ? 'metric-positive' : 'metric-negative'}>
          {numVal >= 0 ? '+' : ''}${numVal.toFixed(2)}
        </span>
      );
    },
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const fetchStrategies = useTradingStore((s) => s.fetchStrategies);
  const fetchInstruments = useTradingStore((s) => s.fetchInstruments);
  const backtestRuns = useTradingStore((s) => s.backtestRuns);
  const strategies = useTradingStore((s) => s.strategies);
  const strategiesLoading = useTradingStore((s) => s.strategiesLoading);
  const instruments = useTradingStore((s) => s.instruments);
  const cancelBacktest = useTradingStore((s) => s.cancelBacktest);

  useEffect(() => {
    fetchStrategies();
    fetchInstruments();
  }, [fetchStrategies, fetchInstruments]);

  const completedRuns = Object.values(backtestRuns).filter(
    (r) => r.results?.status === 'completed'
  );
  const latestRun = completedRuns[completedRuns.length - 1];

  const fetchBacktestStatus = useTradingStore((s) => s.fetchBacktestStatus);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const runningRuns = Object.values(backtestRuns).filter(
    (r) => r.status?.status === 'pending' || r.status?.status === 'running'
  );

  const pollRunning = useCallback(() => {
    runningRuns.forEach((r) => fetchBacktestStatus(r.runId));
  }, [runningRuns, fetchBacktestStatus]);

  useEffect(() => {
    if (runningRuns.length > 0) {
      pollRef.current = setInterval(pollRunning, 2000);
      return () => clearInterval(pollRef.current);
    }
  }, [runningRuns.length, pollRunning]);

  const { metrics, equity_curve } = latestRun?.results ?? { metrics: null, equity_curve: null };

  const metricCards = latestRun ? [
    { label: 'Sharpe Ratio', value: metrics?.sharpe_ratio?.toFixed(2) ?? '—' },
    { label: 'Total PnL', value: metrics?.total_pnl != null ? `$${metrics.total_pnl.toFixed(2)}` : '—' },
    { label: 'Win Rate', value: metrics?.win_rate != null ? `${(metrics.win_rate * 100).toFixed(1)}%` : '—' },
    { label: 'Max Drawdown', value: metrics?.max_drawdown != null ? `${(metrics.max_drawdown * 100).toFixed(1)}%` : '—' },
  ] : [];

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Dashboard</h1>

      {/* Running Backtests */}
      {runningRuns.length > 0 && (
        <div className="chart-container" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>
            Running Backtests ({runningRuns.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {runningRuns.map((run) => (
              <div key={run.runId}
                onClick={() => navigate(`/backtest/${run.runId}`)}
                style={{
                  background: 'var(--md-sys-color-surface-container)',
                  borderRadius: '8px', padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--md-sys-color-surface-container-high)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--md-sys-color-surface-container)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>
                      {run.config.strategy_name || 'Strategy'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginLeft: '8px' }}>
                      {run.config.instrument_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="status-badge status-active" style={{ fontSize: '11px' }}>
                      {run.status?.status === 'running' ? 'Running' : 'Queued'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelBacktest(run.runId); }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--semantic-danger, #ef4444)',
                        color: 'var(--semantic-danger, #ef4444)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <div style={{ height: '4px', background: 'var(--md-sys-color-surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(run.status?.progress ?? 0) * 100}%`,
                    background: 'var(--md-sys-color-primary)',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {run.runId.slice(0, 8)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {Math.round((run.status?.progress ?? 0) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Results */}
      {latestRun ? (
        <>
          <div className="dashboard-metrics" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px', marginBottom: '24px',
          }}>
            {metricCards.map((m) => (
              <MetricCard key={m.label} label={m.label} value={m.value} />
            ))}
          </div>

          <div className="chart-container" style={{ marginBottom: '24px' }}>
            <EquityChart data={equity_curve || []} title="Equity Curve" height={320} />
          </div>

          <div className="chart-container">
            <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Trades</h2>
            <DataTable columns={tradeColumns} data={latestRun?.trades || []} />
          </div>
        </>
      ) : strategiesLoading ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <MetricCard label="Sharpe Ratio" value="" loading />
            <MetricCard label="Total PnL" value="" loading />
            <MetricCard label="Win Rate" value="" loading />
            <MetricCard label="Max Drawdown" value="" loading />
          </div>
          <div className="chart-container" style={{ marginBottom: '24px' }}>
            <EquityChart data={[]} title="Equity Curve" height={320} loading />
          </div>
          <div className="chart-container">
            <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Trades</h2>
            <DataTable columns={tradeColumns} data={[]} loading />
          </div>
        </>
      ) : (
        <div className="chart-container" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '16px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            No backtest results yet. Go to <strong>Backtest</strong> to run your first strategy.
          </p>
          {strategies.length > 0 && (
            <p style={{ fontSize: '14px', color: 'var(--md-sys-color-outline)', marginTop: '8px' }}>
              {strategies.length} strateg{strategies.length === 1 ? 'y' : 'ies'} available
            </p>
          )}
          {instruments.length > 0 && (
            <p style={{ fontSize: '14px', color: 'var(--md-sys-color-outline)', marginTop: '4px' }}>
              {instruments.length} instrument{instruments.length === 1 ? '' : 's'} ready
            </p>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 1280px) {
          .dashboard-metrics { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
