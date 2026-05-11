import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './routes/Dashboard';
import Backtest from './routes/Backtest';
import LiveMonitor from './routes/LiveMonitor';
import Strategies from './routes/Strategies';
import Data from './routes/Data';
import Settings from './routes/Settings';
import '@material/web/all.js';
import './theme.css';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Backtest', path: '/backtest', icon: 'play_arrow' },
  { label: 'Live', path: '/live', icon: 'monitoring' },
  { label: 'Strategies', path: '/strategies', icon: 'menu_book' },
  { label: 'Data', path: '/data', icon: 'database' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
];

function NavDrawer() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <md-navigation-drawer open style={{ '--md-navigation-drawer-width': '256px' } as React.CSSProperties}>
      <div slot="header" style={{ padding: '16px', fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)' }}>
        Navigation
      </div>
      {NAV_ITEMS.map(item => (
        <md-list-item
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            cursor: 'pointer',
            background: location.pathname === item.path ? 'var(--md-sys-color-secondary-container)' : 'transparent',
            color: location.pathname === item.path ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            margin: '2px 8px',
          }}
        >
          <md-icon slot="start">{item.icon}</md-icon>
          <span slot="headline">{item.label}</span>
        </md-list-item>
      ))}
    </md-navigation-drawer>
  );
}

function AppLayout() {
  return (
    <div className="app-layout">
      <md-top-app-bar
        headline="NautilusTrader UI"
        style={{ '--md-top-app-bar-container-color': 'var(--md-sys-color-surface)', '--md-top-app-bar-container-elevation': '0' } as React.CSSProperties}
      >
        <md-icon slot="navigationIcon" style={{ cursor: 'pointer' }}>menu</md-icon>
        <div slot="trailingItems" style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingRight: '16px' }}>
          <span className="status-badge status-inactive">Offline</span>
        </div>
      </md-top-app-bar>
      <div className="app-content">
        <NavDrawer />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/backtest" element={<Backtest />} />
            <Route path="/live" element={<LiveMonitor />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/data" element={<Data />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;