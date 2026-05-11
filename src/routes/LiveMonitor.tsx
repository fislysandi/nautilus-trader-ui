import { useEffect, useState } from 'react';
import { useTradingStore } from '../stores/trading';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const ACCOUNTS = [
  { id: 'virtual', label: 'Virtual / Paper', icon: '🛡️' },
  { id: 'polymarket', label: 'Polymarket', icon: '🔮' },
  { id: 'bybit', label: 'Bybit', icon: '📊' },
  { id: 'hyperliquid', label: 'Hyperliquid', icon: '⚡' },
];

function LiveMonitor() {
  const [selectedAccount, setSelectedAccount] = useState('virtual');
  const {
    live,
    fetchLiveStatus, fetchLivePositions, fetchLiveOrders, fetchLiveAccount,
    startLive, stopLive, killLive,
  } = useTradingStore();

  useEffect(() => {
    const fetchAll = () => {
      fetchLiveStatus();
      fetchLivePositions();
      fetchLiveOrders();
      fetchLiveAccount();
    };
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveStatus, fetchLivePositions, fetchLiveOrders, fetchLiveAccount]);

  const { status, positions, orders, account } = live;
  const isRunning = status?.status === 'running';

  const handleKill = () => {
    if (window.confirm('KILL SWITCH: Cancel ALL orders and close ALL positions. Are you sure?')) {
      killLive();
    }
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const posColumns = [
    { key: 'instrument_id', label: 'Instrument', sortable: true },
    { key: 'side', label: 'Side', sortable: true },
    { key: 'quantity', label: 'Qty', sortable: true, numeric: true },
    { key: 'entry_price', label: 'Entry', sortable: true, numeric: true },
    { key: 'current_price', label: 'Current', sortable: true, numeric: true },
    { key: 'unrealized_pnl', label: 'Unrealized PnL', sortable: true, numeric: true, semantic: true,
      render: (val: unknown) => {
        const numVal = val as number;
        return (
          <span className={numVal >= 0 ? 'metric-positive' : 'metric-negative'}>
            ${numVal.toFixed(2)}
          </span>
        );
      },
    },
  ];

  const orderColumns = [
    { key: 'instrument_id', label: 'Instrument', sortable: true },
    { key: 'side', label: 'Side', sortable: true },
    { key: 'order_type', label: 'Type', sortable: true },
    { key: 'price', label: 'Price', sortable: true, numeric: true },
    { key: 'quantity', label: 'Qty', sortable: true, numeric: true },
    { key: 'status', label: 'Status', sortable: true },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 600 }}>Live Trading</h1>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            style={{
              padding: '6px 12px', fontSize: '13px',
              background: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface)',
              border: '1px solid var(--md-sys-color-outline)',
              borderRadius: 'var(--md-sys-shape-corner-extra-small)',
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}
          >
            {ACCOUNTS.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.icon} {acc.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <StatusBadge status={isRunning ? 'active' : 'inactive'} label={isRunning ? 'Running' : 'Stopped'} pulse={isRunning} />
          {isRunning ? (
            <button onClick={stopLive} style={btnSecondary}>⏹ Stop</button>
          ) : (
            <button onClick={startLive} style={btnPrimary}>▶ Start</button>
          )}
          <button onClick={handleKill} style={btnDanger}>☠ Kill</button>
        </div>
      </div>

      <div className="chart-container" style={{ marginBottom: '16px', display: 'flex', gap: '32px', alignItems: 'center' }}>
        <div>
          <span className="metric-label">Account</span>
          <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '2px' }}>
            {ACCOUNTS.find(a => a.id === selectedAccount)?.icon} {ACCOUNTS.find(a => a.id === selectedAccount)?.label}
          </div>
        </div>
        <div>
          <span className="metric-label">Uptime</span>
          <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '2px' }}>
            {isRunning && status?.uptime_seconds ? formatDuration(status.uptime_seconds) : '—'}
          </div>
        </div>
        <div>
          <span className="metric-label">Node Version</span>
          <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '2px' }}>
            {isRunning ? status?.node_version || '1.221.0' : '—'}
          </div>
        </div>
        <div>
          <span className="metric-label">Active Strategies</span>
          <div style={{ fontSize: '16px', fontWeight: 500, marginTop: '2px' }}>
            {isRunning ? status?.active_strategies ?? 0 : '—'}
          </div>
        </div>
      </div>

      {account && (
        <div className="chart-container" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Account</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div><span className="metric-label">Total Balance</span><div style={{ fontSize: '20px', fontWeight: 600 }}>${account.total_balance.toFixed(2)}</div></div>
            <div><span className="metric-label">Available</span><div style={{ fontSize: '20px', fontWeight: 600 }}>${account.available_balance.toFixed(2)}</div></div>
            <div><span className="metric-label">In Use</span><div style={{ fontSize: '20px', fontWeight: 600 }}>${account.in_use.toFixed(2)}</div></div>
            <div><span className="metric-label">Margin Usage</span><div style={{ fontSize: '20px', fontWeight: 600, color: account.margin_usage_pct > 10 ? 'var(--semantic-danger)' : 'var(--semantic-success)' }}>{account.margin_usage_pct.toFixed(1)}%</div></div>
          </div>
        </div>
      )}

      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Positions</h2>
        <DataTable columns={posColumns} data={positions || []} />
      </div>

      <div className="chart-container">
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Orders</h2>
        <DataTable columns={orderColumns} data={orders || []} />
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--md-sys-color-primary)',
  color: 'var(--md-sys-color-on-primary)',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--md-sys-color-primary)',
  border: '1px solid var(--md-sys-color-outline)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  background: 'var(--md-sys-color-error-container)',
  color: 'var(--md-sys-color-on-error)',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
};

export default LiveMonitor;
