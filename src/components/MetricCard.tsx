interface Delta {
  value: string;
  isPositive: boolean;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: Delta;
  loading?: boolean;
}

export default function MetricCard({ label, value, delta, loading }: MetricCardProps) {
  if (loading) {
    return (
      <div className="metric-card">
        <div
          style={{
            background: 'var(--md-sys-color-surface-container)',
            borderRadius: '4px',
            height: '12px',
            width: '60%',
            marginBottom: '8px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            background: 'var(--md-sys-color-surface-container)',
            borderRadius: '4px',
            height: '32px',
            width: '80%',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
    );
  }

  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {delta && (
        <div className={delta.isPositive ? 'metric-positive' : 'metric-negative'}>
          {delta.value}
        </div>
      )}
    </div>
  );
}