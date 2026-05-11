import { useMemo } from 'react';

interface MonthlyReturnPoint {
  year: number;
  month: number;
  return_pct: number;
}

interface MonthlyReturnsHeatmapProps {
  data: MonthlyReturnPoint[];
  loading?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColor(value: number): string {
  if (value === 0) return 'var(--md-sys-color-surface-container-high)';
  if (value > 0) {
    const intensity = Math.min(value / 20, 1);
    const r = Math.round(39 * (1 - intensity));
    const g = Math.round(166 * (1 - intensity * 0.3)) + Math.round(166 * intensity);
    const b = Math.round(68 * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const intensity = Math.min(Math.abs(value) / 20, 1);
    const r = Math.round(239 * (0.3 + intensity * 0.7));
    const g = Math.round(68 * (1 - intensity * 0.5));
    const b = Math.round(68 * (1 - intensity * 0.5));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function formatPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export default function MonthlyReturnsHeatmap({
  data,
  loading = false,
}: MonthlyReturnsHeatmapProps) {
  const { grid, years } = useMemo((): { grid: Map<string, number>; years: number[] } => {
    if (!data.length) return { grid: new Map(), years: [] };

    const gridMap = new Map<string, number>();
    const yearSet = new Set<number>();

    for (const d of data) {
      gridMap.set(`${d.year}-${d.month}`, d.return_pct);
      yearSet.add(d.year);
    }

    const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
    return { grid: gridMap, years: sortedYears };
  }, [data]);

  if (loading) {
    return (
      <div className="chart-container">
        <div
          style={{
            height: '200px',
            background: 'var(--md-sys-color-surface-container)',
            borderRadius: '8px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="chart-container">
        <div
          style={{
            height: '200px',
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '56px repeat(12, 1fr)',
          gap: '2px',
          fontSize: '11px',
        }}
      >
        <div />
        {MONTHS.map((m) => (
          <div
            key={m}
            style={{
              textAlign: 'center',
              color: 'var(--md-sys-color-on-surface-variant)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              padding: '4px 0',
            }}
          >
            {m}
          </div>
        ))}

        {/* Data rows */}
        {years.map((year) => (
          <div
            key={year}
            style={{
              display: 'contents',
            }}
          >
            <div
              style={{
                color: 'var(--md-sys-color-on-surface-variant)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                paddingRight: '8px',
              }}
            >
              {year}
            </div>
            {MONTHS.map((_, monthIdx) => {
              const value = grid.get(`${year}-${monthIdx + 1}`) ?? 0;
              const isDataPoint = grid.has(`${year}-${monthIdx + 1}`);
              return (
                <div
                  key={`${year}-${monthIdx + 1}`}
                  style={{
                    background: getColor(value),
                    borderRadius: '4px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: value !== 0
                      ? value > 0
                        ? 'var(--md-sys-color-on-surface)'
                        : 'var(--md-sys-color-on-surface)'
                      : 'var(--md-sys-color-on-surface-variant)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    fontWeight: isDataPoint && value !== 0 ? 500 : 400,
                    cursor: isDataPoint ? 'default' : 'default',
                  }}
                  title={isDataPoint ? formatPct(value) : 'No data'}
                >
                  {isDataPoint ? formatPct(value) : '—'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}