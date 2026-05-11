import { useEffect, useState } from 'react';
import { useTradingStore } from '../stores/trading';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const ACCOUNTS = [
  { id: 'all', label: 'All Accounts', icon: '📋' },
  { id: 'virtual', label: 'Virtual / Paper', icon: '🛡️' },
  { id: 'polymarket', label: 'Polymarket', icon: '🔮' },
  { id: 'bybit', label: 'Bybit', icon: '📊' },
  { id: 'hyperliquid', label: 'Hyperliquid', icon: '⚡' },
];

// Mock account data keyed by account id
const MOCK_ACCOUNT_DATA: Record<string, {
  balance: { total: number; available: number; margin: number };
  positions: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
}> = {
  virtual: {
    balance: { total: 1245.50, available: 1180.00, margin: 5.26 },
    positions: [
      { account: 'Virtual', instrument_id: 'BTC-15M-UP.POLYMARKET', side: 'BUY', quantity: 5, entry_price: 0.45, current_price: 0.52, unrealized_pnl: 0.35 },
      { account: 'Virtual', instrument_id: 'ETH-1H-UP.POLYMARKET', side: 'BUY', quantity: 10, entry_price: 0.38, current_price: 0.36, unrealized_pnl: -0.20 },
    ],
    orders: [
      { account: 'Virtual', instrument_id: 'BTC-15M-UP.POLYMARKET', side: 'BUY', order_type: 'LIMIT', price: 0.42, quantity: 3, status: 'OPEN' },
    ],
  },
  polymarket: {
    balance: { total: 8500.00, available: 7200.00, margin: 15.29 },
    positions: [
      { account: 'Polymarket', instrument_id: 'SOL-1H-UP.POLYMARKET', side: 'BUY', quantity: 20, entry_price: 0.62, current_price: 0.71, unrealized_pnl: 1.80 },
    ],
    orders: [],
  },
  bybit: {
    balance: { total: 15200.00, available: 14800.00, margin: 2.63 },
    positions: [
      { account: 'Bybit', instrument_id: 'BTC-USDT.BYBIT', side: 'BUY', quantity: 0.1, entry_price: 61200, current_price: 61850, unrealized_pnl: 65.00 },
      { account: 'Bybit', instrument_id: 'ETH-USDT.BYBIT', side: 'SELL', quantity: 1.5, entry_price: 3450, current_price: 3410, unrealized_pnl: 60.00 },
    ],
    orders: [
      { account: 'Bybit', instrument_id: 'BTC-USDT.BYBIT', side: 'SELL', order_type: 'LIMIT', price: 62500, quantity: 0.05, status: 'OPEN' },
    ],
  },
  hyperliquid: {
    balance: { total: 3200.00, available: 3100.00, margin: 3.12 },
    positions: [
      { account: 'Hyperliquid', instrument_id: 'SOL-PERP.HL', side: 'LONG', quantity: 25, entry_price: 145.20, current_price: 148.80, unrealized_pnl: 90.00 },
    ],
    orders: [
      { account: 'Hyperliquid', instrument_id: 'SOL-PERP.HL', side: 'SHORT', order_type: 'LIMIT', price: 155.00, quantity: 10, status: 'OPEN' },
    ],
  },
};

function LiveMonitor() {
  const [selectedAccount, setSelectedAccount] = useState('all');
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
  const isAll = selectedAccount === 'all';

  // Compute display data based on selection
  const displayAccounts = isAll
    ? Object.keys(MOCK_ACCOUNT_DATA)
    : [selectedAccount];

  const displayPositions = isAll
    ? Object.values(MOCK_ACCOUNT_DATA).flatMap(a => a.positions)
    : (MOCK_ACCOUNT_DATA[selectedAccount]?.positions || positions || []);

  const displayOrders = isAll
    ? Object.values(MOCK_ACCOUNT_DATA).flatMap(a => a.orders)
    : (MOCK_ACCOUNT_DATA[selectedAccount]?.orders || orders || []);

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
    ...(isAll ? [{ key: 'account', label: 'Account', sortable: true, width: '90px' }] : []),
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
    ...(isAll ? [{ key: 'account', label: 'Account', sortable: true, width: '90px' }] : []),
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

      {/* Account Panel — single or all accounts */}
      {isAll ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {displayAccounts.map((accId) => {
            const data = MOCK_ACCOUNT_DATA[accId];
            const accInfo = ACCOUNTS.find(a => a.id === accId);
            if (!data) return null;
            return (
              <div key={accId} className="chart-container">
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  {accInfo?.icon} {accInfo?.label}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><span className="metric-label">Balance</span><div style={{ fontSize: '18px', fontWeight: 600 }}>${data.balance.total.toFixed(2)}</div></div>
                  <div><span className="metric-label">Available</span><div style={{ fontSize: '18px', fontWeight: 600 }}>${data.balance.available.toFixed(2)}</div></div>
                  <div><span className="metric-label">Margin</span><div style={{ fontSize: '18px', fontWeight: 600, color: data.balance.margin > 10 ? 'var(--semantic-danger)' : 'var(--semantic-success)' }}>{data.balance.margin}%</div></div>
                  <div><span className="metric-label">Positions</span><div style={{ fontSize: '18px', fontWeight: 600 }}>{data.positions.length}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : account ? (
        <div className="chart-container" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Account</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div><span className="metric-label">Total Balance</span><div style={{ fontSize: '20px', fontWeight: 600 }}>${account.total_balance.toFixed(2)}</div></div>
            <div><span className="metric-label">Available</span><div style={{ fontSize: '20px', fontWeight: 600 }}>${account.available_balance.toFixed(2)}</div></div>
            <div><span className="metric-label">In Use</span><div style={{ fontSize: '20px', fontWeight: 600 }}>${account.in_use.toFixed(2)}</div></div>
            <div><span className="metric-label" style={{ color: account.margin_usage_pct > 10 ? 'var(--semantic-danger)' : 'var(--semantic-success)' }}>Margin Usage</span>
              <div style={{ fontSize: '20px', fontWeight: 600, color: account.margin_usage_pct > 10 ? 'var(--semantic-danger)' : 'var(--semantic-success)' }}>{account.margin_usage_pct.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Positions</h2>
        <DataTable columns={posColumns as any} data={isAll ? (displayPositions as any[]) : (positions || [])} />
      </div>

      <div className="chart-container">
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px' }}>Orders</h2>
        <DataTable columns={orderColumns as any} data={isAll ? (displayOrders as any[]) : (orders || [])} />
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
