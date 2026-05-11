import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SweepResult } from '../api/client';

interface SweepResultsProps {
  paramName: string;
  results: SweepResult[];
}

function SweepResults({ paramName, results }: SweepResultsProps) {
  const chartData = results.map((r) => ({
    param: String(r.param_value),
    sharpe: r.metrics.sharpe_ratio ?? 0,
    pnl: r.metrics.total_pnl ?? 0,
    winRate: r.metrics.win_rate ?? 0,
  }));

  return (
    <div>
      <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>
        Sweep: {paramName}
      </h2>

      <div style={{ marginBottom: '16px' }}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--md-sys-color-outline-variant)"
              opacity={0.3}
            />
            <XAxis
              dataKey="param"
              tick={{
                fontSize: 11,
                fill: 'var(--md-sys-color-on-surface-variant)',
              }}
            />
            <YAxis
              tick={{
                fontSize: 11,
                fill: 'var(--md-sys-color-on-surface-variant)',
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--md-sys-color-surface-container-high)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--md-sys-color-on-surface)',
              }}
            />
            <Bar
              dataKey="sharpe"
              fill="var(--md-sys-color-primary)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>
              {paramName}
            </th>
            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Sharpe</th>
            <th style={{ textAlign: 'right', padding: '8px 12px' }}>PnL</th>
            <th style={{ textAlign: 'right', padding: '8px 12px' }}>
              Win Rate
            </th>
            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Max DD</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={String(r.param_value)}>
              <td
                style={{
                  padding: '8px 12px',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {String(r.param_value)}
              </td>
              <td className="numeric">
                {r.metrics.sharpe_ratio?.toFixed(2) ?? '—'}
              </td>
              <td className="numeric">
                <span
                  className={
                    r.metrics.total_pnl != null && r.metrics.total_pnl >= 0
                      ? 'metric-positive'
                      : 'metric-negative'
                  }
                >
                  {r.metrics.total_pnl != null
                    ? `$${r.metrics.total_pnl.toFixed(2)}`
                    : '—'}
                </span>
              </td>
              <td className="numeric">
                {r.metrics.win_rate != null
                  ? `${(r.metrics.win_rate * 100).toFixed(1)}%`
                  : '—'}
              </td>
              <td className="numeric">
                {r.metrics.max_drawdown != null
                  ? `${(r.metrics.max_drawdown * 100).toFixed(1)}%`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SweepResults;
