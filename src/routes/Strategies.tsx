import { useState, useEffect, useRef } from 'react';
import { useTradingStore } from '../stores/trading';
import * as api from '../api/client';

function Strategies() {
  const { strategies, fetchStrategies } = useTradingStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [params, setParams] = useState<api.StrategyParam[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  useEffect(() => {
    if (selected) {
      api.getStrategyParams(selected).then(setParams).catch(() => setParams([]));
      api.getStrategySource(selected).then(r => setSource(r.source)).catch(() => setSource(null));
    }
  }, [selected]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await api.importStrategy(file);
      await fetchStrategies();
    } catch {
      alert('Import failed: not a valid strategy file');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px', height: 'calc(100vh - 120px)' }}>
      <div className="chart-container" style={{ overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500 }}>Strategies</h2>
          <button onClick={() => fileRef.current?.click()} style={smallBtn}>+ Import</button>
          <input ref={fileRef} type="file" accept=".py" style={{ display: 'none' }} onChange={handleImport} />
        </div>
        {strategies.map((s) => (
          <div
            key={s.name}
            onClick={() => setSelected(s.name)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '4px',
              background: selected === s.name ? 'var(--md-sys-color-secondary-container)' : 'transparent',
              color: selected === s.name ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)',
            }}
          >
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{s.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
              {s.backtest_count} backtest{s.backtest_count !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
        {strategies.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', padding: '16px 0', textAlign: 'center' }}>
            No strategies found
          </p>
        )}
      </div>

      <div className="chart-container" style={{ overflow: 'auto' }}>
        {!selected ? (
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', paddingTop: '48px' }}>
            Select a strategy to view details
          </p>
        ) : (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>{selected}</h2>

            <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Parameters</h3>
            {params.length > 0 ? (
              <table className="data-table" style={{ marginBottom: '20px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px' }}>Type</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: '12px' }}>Default</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((p) => (
                    <tr key={p.name}>
                      <td style={{ padding: '8px 12px', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px' }}>{p.name}</td>
                      <td style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>{p.type}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px' }}>{String(p.default ?? '—')}</td>
                      <td style={{ padding: '8px 12px', fontSize: '13px' }}>{p.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--md-sys-color-outline)', marginBottom: '16px' }}>No parameters</p>
            )}

            <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Source Code</h3>
            {source ? (
              <pre style={{
                background: 'var(--md-sys-color-surface-container)',
                borderRadius: '8px',
                padding: '16px',
                overflow: 'auto',
                fontSize: '12px',
                lineHeight: '1.6',
                fontFamily: '"JetBrains Mono", monospace',
                maxHeight: '400px',
                color: 'var(--md-sys-color-on-surface)',
              }}>
                {source}
              </pre>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--md-sys-color-outline)' }}>Loading...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const smallBtn: React.CSSProperties = {
  background: 'var(--md-sys-color-primary)',
  color: 'var(--md-sys-color-on-primary)',
  border: 'none',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
};

export default Strategies;