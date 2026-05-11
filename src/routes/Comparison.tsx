import { useState } from 'react';
import { useTradingStore, type BacktestRun } from '../stores/trading';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function Comparison() {
  const backtestRuns = useTradingStore((s) => s.backtestRuns);
  const completedRuns = Object.values(backtestRuns).filter((r) => r.results?.status === 'completed');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleRun = (runId: string) => {
    setSelectedIds((prev) =>
      prev.includes(runId) ? prev.filter((id) => id !== runId) : [...prev, runId]
    );
  };

  const selectedRuns = selectedIds
    .map((id) => backtestRuns[id])
    .filter((r): r is BacktestRun => r !== undefined);

  const metricNames = ['sharpe_ratio', 'total_pnl', 'win_rate', 'max_drawdown', 'total_trades'] as const;
  const metricLabels: Record<typeof metricNames[number], string> = {
    sharpe_ratio: 'Sharpe Ratio',
    total_pnl: 'Total PnL',
    win_rate: 'Win Rate',
    max_drawdown: 'Max Drawdown',
    total_trades: 'Total Trades',
  };

  const formatMetric = (name: string, val: unknown): string => {
    if (val == null) return '—';
    if (name === 'total_pnl') return `$${(val as number).toFixed(2)}`;
    if (name === 'win_rate') return `${((val as number) * 100).toFixed(1)}%`;
    if (name === 'max_drawdown') return `${((val as number) * 100).toFixed(1)}%`;
    if (name === 'total_trades') return String(val);
    return (val as number).toFixed(2);
  };

  const comparisonData = metricNames.map((m) => {
    const row: Record<string, string> = { metric: metricLabels[m] };
    selectedRuns.forEach((run) => {
      const val = run.results?.metrics?.[m as keyof typeof run.results.metrics];
      row[run.runId.slice(0, 8)] = formatMetric(m, val);
    });
    return row;
  });

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Comparison</h1>

      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Select Runs to Compare</h2>
        {completedRuns.length === 0 ? (
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '14px' }}>No completed backtests to compare.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {completedRuns.map((run) => (
              <button
                key={run.runId}
                onClick={() => toggleRun(run.runId)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: selectedIds.includes(run.runId) ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline)',
                  background: selectedIds.includes(run.runId) ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  color: selectedIds.includes(run.runId) ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer', fontSize: '12px', fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {run.runId.slice(0, 8)}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedRuns.length >= 2 && (
        <>
          <div className="chart-container" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Metrics</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Metric</th>
                  {selectedRuns.map((run) => (
                    <th key={run.runId} style={{ textAlign: 'right', padding: '8px 12px', fontFamily: '"JetBrains Mono", monospace' }}>
                      {run.runId.slice(0, 8)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.metric}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{row.metric}</td>
                    {selectedRuns.map((run) => (
                      <td key={run.runId} style={{ padding: '8px 12px', textAlign: 'right', fontFamily: '"JetBrains Mono", monospace' }}>
                        {row[run.runId.slice(0, 8)] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="chart-container">
            <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Equity Curves</h2>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" opacity={0.3} />
                <XAxis dataKey="timestamp" tick={{ fontSize: 11, fill: 'var(--md-sys-color-on-surface-variant)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--md-sys-color-on-surface-variant)' }} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--md-sys-color-surface-container-high)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: '8px', fontSize: '13px',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                />
                <Legend />
                {selectedRuns.map((run, idx) => (
                  <Area
                    key={run.runId}
                    data={run.results?.equity_curve || []}
                    type="monotone"
                    dataKey="value"
                    name={run.runId.slice(0, 8)}
                    stroke={['#5e6ad2', '#27a644', '#eab308', '#ef4444', '#78d2c6'][idx % 5]!}
                    fill="transparent"
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default Comparison;