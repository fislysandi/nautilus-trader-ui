import { useEffect } from 'react';
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
  const fetchStrategies = useTradingStore((s) => s.fetchStrategies);
  const fetchInstruments = useTradingStore((s) => s.fetchInstruments);
  const backtestRuns = useTradingStore((s) => s.backtestRuns);
  const strategies = useTradingStore((s) => s.strategies);
  const strategiesLoading = useTradingStore((s) => s.strategiesLoading);
  const instruments = useTradingStore((s) => s.instruments);

  useEffect(() => {
    fetchStrategies();
    fetchInstruments();
  }, [fetchStrategies, fetchInstruments]);

  const completedRuns = Object.values(backtestRuns).filter(
    (r) => r.results?.status === 'completed'
  );
  const latestRun = completedRuns[completedRuns.length - 1];

  if (strategiesLoading) {
    return (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Dashboard</h1>
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
      </div>
    );
  }

  if (!latestRun) {
    return (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Dashboard</h1>
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
      </div>
    );
  }

  const { metrics, equity_curve } = latestRun.results!;

  const metricCards = [
    { label: 'Sharpe Ratio', value: metrics.sharpe_ratio?.toFixed(2) ?? '—' },
    { label: 'Total PnL', value: metrics.total_pnl != null ? `$${metrics.total_pnl.toFixed(2)}` : '—' },
    { label: 'Win Rate', value: metrics.win_rate != null ? `${(metrics.win_rate * 100).toFixed(1)}%` : '—' },
    { label: 'Max Drawdown', value: metrics.max_drawdown != null ? `${(metrics.max_drawdown * 100).toFixed(1)}%` : '—' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Dashboard</h1>

      <div className="dashboard-metrics" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
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
        <DataTable columns={tradeColumns} data={latestRun.trades || []} />
      </div>

      <style>{`
        @media (max-width: 1280px) {
          .dashboard-metrics { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
