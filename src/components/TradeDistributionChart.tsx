import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';

interface Trade {
  pnl: number | null;
}

interface TradeDistributionChartProps {
  trades: Trade[];
  height?: number;
  loading?: boolean;
}

interface Bin {
  label: string;
  count: number;
  isPositive: boolean;
}

function buildBins(trades: Trade[], bucketCount = 10): Bin[] {
  const pnls = trades
    .map((t) => t.pnl)
    .filter((p): p is number => p !== null && !isNaN(p));

  if (pnls.length === 0) return [];

  const min = Math.min(...pnls);
  const max = Math.max(...pnls);
  const range = max - min || 1;
  const bucketSize = range / bucketCount;

  const bins: Bin[] = Array.from({ length: bucketCount }, (_, i) => {
    const bucketMin = min + i * bucketSize;
    return {
      label: `$${bucketMin.toFixed(0)}`,
      count: 0,
      isPositive: bucketMin >= 0,
    };
  });

  for (const pnl of pnls) {
    const idx = Math.min(Math.floor((pnl - min) / bucketSize), bucketCount - 1);
    bins[idx].count++;
  }

  return bins;
}

function DistributionTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const count = payload[0].value as number;
    return (
      <div
        style={{
          background: 'var(--md-sys-color-surface-container-high)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '6px', fontSize: '11px' }}>
          {label}
        </div>
        <div style={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 600, fontSize: '14px' }}>
          {count} trade{count !== 1 ? 's' : ''}
        </div>
      </div>
    );
  }
  return null;
}

export default function TradeDistributionChart({
  trades,
  height = 300,
  loading = false,
}: TradeDistributionChartProps) {
  const bins = useMemo(() => buildBins(trades), [trades]);

  if (loading) {
    return (
      <div className="chart-container" style={{ height }}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '60%',
              background: 'var(--md-sys-color-surface-container)',
              borderRadius: '8px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    );
  }

  if (bins.length === 0) {
    return (
      <div className="chart-container" style={{ height }}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--md-sys-color-on-surface-variant)',
            fontSize: '14px',
          }}
        >
          No data
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={bins} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--md-sys-color-outline-variant)"
            opacity={0.3}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--md-sys-color-outline-variant)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<DistributionTooltip />} />
          <Bar
            dataKey="count"
            fill="var(--md-sys-color-primary)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}