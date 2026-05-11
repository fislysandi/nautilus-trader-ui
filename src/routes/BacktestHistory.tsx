import { useState, useMemo } from 'react';
import { useTradingStore } from '../stores/trading';
import MetricCard from '../components/MetricCard';

function BacktestHistory() {
  const backtestRuns = useTradingStore((s) => s.backtestRuns);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);

  const runs = useMemo(() => Object.values(backtestRuns), [backtestRuns]);

  const filtered = useMemo(() => {
    if (!searchQuery) return runs;
    const q = searchQuery.toLowerCase();
    return runs.filter((r) => {
      const config = r.config;
      return (
        config.strategy_name?.toLowerCase().includes(q) ||
        config.instrument_id?.toLowerCase().includes(q) ||
        r.runId.toLowerCase().includes(q) ||
        r.results?.metrics.sharpe_ratio?.toFixed(2).includes(q)
      );
    });
  }, [runs, searchQuery]);

  const toggleExpand = (runId: string) => {
    setExpandedRun(expandedRun === runId ? null : runId);
  };

  const toggleSelect = (runId: string) => {
    setSelectedRuns((prev) =>
      prev.includes(runId) ? prev.filter((id) => id !== runId) : [...prev, runId]
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600 }}>Backtest History</h1>
        <input
          type="text"
          placeholder="Search by strategy, instrument, run ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '320px', padding: '8px 12px',
            background: 'var(--md-sys-color-surface-container-highest)',
            color: 'var(--md-sys-color-on-surface)',
            border: '1px solid var(--md-sys-color-outline)',
            borderRadius: '8px', fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="chart-container" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {runs.length === 0
              ? 'No backtest runs yet. Run a backtest to see history here.'
              : 'No runs match your search.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((run) => {
            const m = run.results?.metrics;
            const isExpanded = expandedRun === run.runId;
            return (
              <div key={run.runId} className="chart-container" style={{ padding: '12px 16px' }}>
                <div
                  onClick={() => toggleExpand(run.runId)}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRuns.includes(run.runId)}
                      onChange={() => toggleSelect(run.runId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '14px' }}>
                        {run.config.strategy_name || 'Unknown Strategy'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {run.runId.slice(0, 8)} · {run.config.instrument_id}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>Sharpe</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{m?.sharpe_ratio?.toFixed(2) ?? '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>PnL</div>
                      <div className={m?.total_pnl != null && m.total_pnl >= 0 ? 'metric-positive' : 'metric-negative'}
                           style={{ fontSize: '14px', fontWeight: 500 }}>
                        {m?.total_pnl != null ? `$${m.total_pnl.toFixed(2)}` : '—'}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {run.results?.status === 'completed' ? '✅' : run.status?.status === 'failed' ? '❌' : '⏳'}
                    </span>
                  </div>
                </div>

                {isExpanded && run.results && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
                      <MetricCard label="Sharpe" value={m?.sharpe_ratio?.toFixed(2) ?? '—'} />
                      <MetricCard label="PnL" value={m?.total_pnl != null ? `$${m.total_pnl.toFixed(2)}` : '—'} />
                      <MetricCard label="Win Rate" value={m?.win_rate != null ? `${(m.win_rate * 100).toFixed(1)}%` : '—'} />
                      <MetricCard label="Max DD" value={m?.max_drawdown != null ? `${(m.max_drawdown * 100).toFixed(1)}%` : '—'} />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      <strong>Config:</strong> {JSON.stringify(run.config, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedRuns.length >= 2 && (
        <div style={{
          position: 'sticky', bottom: '0', marginTop: '16px',
          background: 'var(--md-sys-color-surface-container)',
          borderRadius: '12px', padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '14px' }}>
            {selectedRuns.length} runs selected
          </span>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              selectedRuns.forEach((id) => params.append('ids', id));
              window.location.href = `/compare?${params.toString()}`;
            }}
            style={{
              background: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              border: 'none', borderRadius: '8px', padding: '8px 16px',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Compare Selected
          </button>
        </div>
      )}
    </div>
  );
}

export default BacktestHistory;
