import { useState, useEffect, useRef } from 'react';
import { useTradingStore } from '../stores/trading';
import type { StrategyParam, SweepResult } from '../api/client';
import { runSweep, getSweepResults, getBacktestStatus } from '../api/client';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import EquityChart from '../components/EquityChart';
import SweepResults from './SweepResults';
import LogTerminal from '../components/LogTerminal';

type ViewState = 'config' | 'running' | 'results';

function Backtest() {
  const {
    strategies,
    fetchStrategies,
    runBacktest,
    pollBacktestUntilComplete,
    backtestRuns,
  } = useTradingStore();

  const [view, setView] = useState<ViewState>('config');
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [strategyParams, setStrategyParams] = useState<StrategyParam[]>([]);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [paramsLoading, setParamsLoading] = useState(false);
  const [instrument, setInstrument] = useState('BTC-15M-UP.POLYMARKET');
  const [capital, setCapital] = useState('10000');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-06-01');

  const [sweepMode, setSweepMode] = useState(false);
  const [sweepParam, setSweepParam] = useState('');
  const [sweepMin, setSweepMin] = useState('0');
  const [sweepMax, setSweepMax] = useState('10');
  const [sweepStep, setSweepStep] = useState('1');
  const [sweepResults, setSweepResults] = useState<SweepResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  useEffect(() => {
    if (!selectedStrategy) {
      setStrategyParams([]);
      return;
    }
    setParamsLoading(true);
    import('../api/client').then(async (api) => {
      try {
        const params = await api.getStrategyParams(selectedStrategy);
        setStrategyParams(params);
        const defaults: Record<string, string> = {};
        params.forEach((p) => {
          defaults[p.name] = String(p.default ?? '');
        });
        setParamValues(defaults);
      } catch {
        setStrategyParams([]);
      } finally {
        setParamsLoading(false);
      }
    });
  }, [selectedStrategy]);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!selectedStrategy) errors.strategy = 'Select a strategy';
    if (!startDate) errors.startDate = 'Start date is required';
    if (!endDate) errors.endDate = 'End date is required';
    if (startDate && endDate && startDate > endDate) errors.dates = 'Start must be before end';
    if (!capital || isNaN(Number(capital)) || Number(capital) <= 0) errors.capital = 'Enter a positive number';
    if (!instrument) errors.instrument = 'Select an instrument';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleRun = async () => {
    if (!validateForm()) return;
    setError(null);
    setView('running');
    setProgress(0);
    setLogs([]);

    try {
      const runId = await runBacktest({
        strategy_name: selectedStrategy,
        instrument_id: instrument,
        start_date: startDate,
        end_date: endDate,
        initial_capital: capital,
        params: Object.fromEntries(
          Object.entries(paramValues).map(([k, v]) => {
            const num = Number(v);
            return [k, isNaN(num) ? v : num];
          })
        ),
      });
      setCurrentRunId(runId);

      const logInterval = setInterval(async () => {
        try {
          const status = await getBacktestStatus(runId, logs.length);
          const newLogs = status.logs;
          if (newLogs && newLogs.length > 0) {
            setLogs(prev => [...prev, ...newLogs]);
          }
        } catch { /* ignore poll errors */ }
      }, 500);

      try {
        await pollBacktestUntilComplete(runId, setProgress);
        setView('results');
      } finally {
        clearInterval(logInterval);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backtest failed');
      setView('config');
    }
  };

  const handleRunSweep = async () => {
    if (!sweepParam) { setFormErrors({ sweep: 'Select a parameter to sweep' }); return; }
    if (!validateForm()) return;
    setError(null);
    setView('running');
    setProgress(0);
    setSweepResults([]);

    try {
      const min = parseFloat(sweepMin);
      const max = parseFloat(sweepMax);
      const step = parseFloat(sweepStep);
      const values: number[] = [];
      const steps = Math.round((max - min) / step);
      for (let i = 0; i <= steps; i++) {
        values.push(Math.round((min + i * step) * 1000) / 1000);
      }

      const response = await runSweep({
        strategy_name: selectedStrategy,
        instrument_id: instrument,
        start_date: startDate,
        end_date: endDate,
        initial_capital: capital,
        param_name: sweepParam,
        param_values: values,
        fixed_params: Object.fromEntries(
          Object.entries(paramValues).map(([k, v]) => [
            k,
            isNaN(Number(v)) ? v : Number(v),
          ])
        ),
      });

      const id = response.sweep_id;

      const poll = setInterval(async () => {
        try {
          const sweepData = await getSweepResults(id);
          if (sweepData.results && sweepData.results.length > 0) {
            setSweepResults(sweepData.results);
            setView('results');
            clearInterval(poll);
          } else if (sweepData.status === 'completed') {
            setSweepResults(sweepData.results);
            setView('results');
            clearInterval(poll);
          }
        } catch {
          void 0;
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sweep failed');
      setView('config');
    }
  };

  const currentRun = currentRunId ? backtestRuns[currentRunId] : null;
  const results = currentRun?.results;

  if (view === 'config') {
    return (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>New Backtest</h1>
        <div className="chart-container" style={{ maxWidth: '640px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label className="metric-label" style={{ marginBottom: '4px', display: 'block' }}>Strategy</label>
            <select
              style={inputStyle}
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
            >
              <option value="">Select a strategy...</option>
              {strategies.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            {formErrors.strategy && <p style={{ color: 'var(--semantic-danger)', fontSize: '12px', marginTop: '2px' }}>{formErrors.strategy}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label className="metric-label" style={{ marginBottom: '4px', display: 'block' }}>Instrument</label>
              <select style={inputStyle} value={instrument} onChange={(e) => setInstrument(e.target.value)}>
                <option>BTC-15M-UP.POLYMARKET</option>
              </select>
            </div>
            <div>
              <label className="metric-label" style={{ marginBottom: '4px', display: 'block' }}>Initial Capital</label>
              <input type="text" value={capital} onChange={(e) => setCapital(e.target.value)} style={inputStyle} />
              {formErrors.capital && <p style={{ color: 'var(--semantic-danger)', fontSize: '12px', marginTop: '2px' }}>{formErrors.capital}</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label className="metric-label" style={{ marginBottom: '4px', display: 'block' }}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="metric-label" style={{ marginBottom: '4px', display: 'block' }}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          {formErrors.dates && <p style={{ color: 'var(--semantic-danger)', fontSize: '12px', marginTop: '2px' }}>{formErrors.dates}</p>}

          {paramsLoading && (
            <div style={{ marginBottom: '16px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '13px' }}>
              Loading parameters...
            </div>
          )}

          {!paramsLoading && strategyParams.length > 0 && (
            <>
              {sweepMode ? (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <label
                      className="metric-label"
                      style={{ display: 'block', marginBottom: '4px' }}
                    >
                      Parameter to Sweep
                    </label>
                    <select
                      style={inputStyle}
                      value={sweepParam}
                      onChange={(e) => setSweepParam(e.target.value)}
                    >
                      <option value="">Select...</option>
                      {strategyParams.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.type})
                        </option>
                      ))}
                    </select>
                    {formErrors.sweep && <p style={{ color: 'var(--semantic-danger)', fontSize: '12px', marginTop: '2px' }}>{formErrors.sweep}</p>}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <label
                        className="metric-label"
                        style={{ display: 'block', marginBottom: '4px' }}
                      >
                        Min
                      </label>
                      <input
                        type="number"
                        value={sweepMin}
                        onChange={(e) => setSweepMin(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        className="metric-label"
                        style={{ display: 'block', marginBottom: '4px' }}
                      >
                        Max
                      </label>
                      <input
                        type="number"
                        value={sweepMax}
                        onChange={(e) => setSweepMax(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label
                        className="metric-label"
                        style={{ display: 'block', marginBottom: '4px' }}
                      >
                        Step
                      </label>
                      <input
                        type="number"
                        value={sweepStep}
                        onChange={(e) => setSweepStep(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <label
                    className="metric-label"
                    style={{ marginBottom: '8px', display: 'block' }}
                  >
                    Parameters
                  </label>
                  {strategyParams.map((p) => (
                    <div key={p.name} style={{ marginBottom: '8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '2px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--md-sys-color-on-surface-variant)',
                          }}
                        >
                          {p.name}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--md-sys-color-outline)',
                          }}
                        >
                          {p.type}
                        </span>
                      </div>
                      <input
                        type={
                          ['int', 'float'].includes(p.type) ? 'number' : 'text'
                        }
                        step={p.type === 'float' ? 'any' : '1'}
                        value={paramValues[p.name] ?? String(p.default ?? '')}
                        style={inputStyle}
                        onChange={(e) =>
                          setParamValues((prev) => ({
                            ...prev,
                            [p.name]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {sweepMode ? (
              <button onClick={handleRunSweep} style={btnPrimary}>▶ Run Sweep</button>
            ) : (
              <button onClick={handleRun} style={btnPrimary}>▶ Run Backtest</button>
            )}
            <button onClick={() => setSweepMode(!sweepMode)} style={btnSecondary}>
              {sweepMode ? 'Single Mode' : 'Sweep Mode'}
            </button>
          </div>

          {error && (
            <p style={{ marginTop: '12px', color: 'var(--semantic-danger)', fontSize: '14px' }}>{error}</p>
          )}
        </div>
      </div>
    );
  }

  if (view === 'running') {
    return (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>
          {sweepParam ? 'Running Sweep...' : 'Running Backtest...'}
        </h1>
        <div className="chart-container" style={{ maxWidth: '640px' }}>
          <p style={{ marginBottom: '16px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            {sweepParam
              ? `Sweeping ${sweepParam} on ${selectedStrategy}`
              : `Running ${selectedStrategy} on BTC-15M-UP.POLYMARKET`}
          </p>
          <div style={{ height: '4px', background: 'var(--md-sys-color-surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--md-sys-color-primary)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            {progress}% complete
          </p>
          <div style={{ marginTop: '16px' }}>
            <LogTerminal logs={logs} height="250px" />
          </div>
        </div>
      </div>
    );
  }

  const m = results?.metrics;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600 }}>
          {sweepResults.length > 0
            ? `Sweep Results — ${selectedStrategy}`
            : `Backtest Results — ${selectedStrategy}`}
        </h1>
        <button
          onClick={() => {
            setView('config');
            setSweepResults([]);
          }}
          style={btnSecondary}
        >
          ← New Backtest
        </button>
      </div>

      {sweepResults.length > 0 ? (
        <div className="chart-container">
          <SweepResults paramName={sweepParam} results={sweepResults} />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <MetricCard label="Sharpe Ratio" value={m?.sharpe_ratio?.toFixed(2) ?? '—'} />
            <MetricCard label="Total PnL" value={m?.total_pnl != null ? `$${m.total_pnl.toFixed(2)}` : '—'} />
            <MetricCard label="Win Rate" value={m?.win_rate != null ? `${(m.win_rate * 100).toFixed(1)}%` : '—'} />
            <MetricCard label="Max Drawdown" value={m?.max_drawdown != null ? `${(m.max_drawdown * 100).toFixed(1)}%` : '—'} />
          </div>

          <div className="chart-container" style={{ marginBottom: '24px' }}>
            <EquityChart data={results?.equity_curve || []} title="Equity Curve" height={320} />
          </div>

          {logs.length > 0 && (
            <div className="chart-container" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', cursor: 'pointer' }}
                  onClick={() => setShowLogs(!showLogs)}>
                {showLogs ? '▼' : '▶'} Execution Logs ({logs.length} lines)
              </h3>
              {showLogs && <LogTerminal logs={logs} height="300px" />}
            </div>
          )}

          <div className="chart-container">
            <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Trades</h2>
            <DataTable
              columns={[
                { key: 'entry_time', label: 'Entry', sortable: true },
                { key: 'side', label: 'Side', sortable: true },
                { key: 'size', label: 'Size', sortable: true, numeric: true },
                { key: 'entry_price', label: 'Entry', sortable: true, numeric: true },
                { key: 'exit_price', label: 'Exit', sortable: true, numeric: true },
                { key: 'pnl', label: 'PnL', sortable: true, numeric: true, semantic: true,
                  render: (val: unknown) => {
                    const numVal = val as number;
                    return (
                      <span className={numVal >= 0 ? 'metric-positive' : 'metric-negative'}>
                        {numVal >= 0 ? '+' : ''}${numVal.toFixed(2)}
                      </span>
                    );
                  },
                },
              ]}
              data={currentRun?.trades || []}
            />
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--md-sys-color-surface-container-highest)',
  color: 'var(--md-sys-color-on-surface)',
  border: '1px solid var(--md-sys-color-outline)',
  borderRadius: 'var(--md-sys-shape-corner-extra-small)',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
};

const btnPrimary: React.CSSProperties = {
  background: 'var(--md-sys-color-primary)',
  color: 'var(--md-sys-color-on-primary)',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
};

const btnSecondary: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--md-sys-color-primary)',
  border: '1px solid var(--md-sys-color-outline)',
  borderRadius: '8px',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
};

export default Backtest;
