import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';

interface EquityChartPoint {
  timestamp: string;
  value: number;
}

interface EquityChartProps {
  data: EquityChartPoint[];
  title?: string;
  height?: number;
  color?: string;
  loading?: boolean;
  showGrid?: boolean;
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function getCSSVar(varName: string): string {
  if (typeof window === 'undefined') return '#5e6ad2';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim() || '#5e6ad2';
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
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
          {formatDate(label as string)}
        </div>
        <div style={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 600, fontSize: '14px' }}>
          {formatValue(payload[0].value as number)}
        </div>
      </div>
    );
  }
  return null;
}

export default function EquityChart({
  data,
  title,
  height = 300,
  loading,
  showGrid = true,
}: EquityChartProps) {
  const strokeColor = useMemo(() => getCSSVar('--md-sys-color-primary'), []);

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

  if (data.length === 0) {
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
      {title && (
        <div
          style={{
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--md-sys-color-outline-variant)' }}
            tickLine={{ stroke: 'var(--md-sys-color-outline-variant)' }}
          />
          <YAxis
            tickFormatter={(v: number) => `$${v.toLocaleString()}`}
            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--md-sys-color-outline-variant)' }}
            tickLine={{ stroke: 'var(--md-sys-color-outline-variant)' }}
            width={80}
          />
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--md-sys-color-outline-variant)"
              opacity={0.3}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#equityGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}