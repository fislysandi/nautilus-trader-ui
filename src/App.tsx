import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './routes/Dashboard';
import Backtest from './routes/Backtest';
import BacktestHistory from './routes/BacktestHistory';
import Comparison from './routes/Comparison';
import LiveMonitor from './routes/LiveMonitor';
import Strategies from './routes/Strategies';
import Data from './routes/Data';
import Settings from './routes/Settings';
import NotFound from './routes/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/list/list-item.js';
import '@material/web/labs/navigationdrawer/navigation-drawer.js';
import './theme.css';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Backtest', path: '/backtest', icon: 'play_arrow' },
  { label: 'History', path: '/history', icon: 'history' },
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
      <header className="top-app-bar">
        <md-icon-button className="menu-button">
          <md-icon>menu</md-icon>
        </md-icon-button>
        <span className="top-app-bar-headline">NautilusTrader UI</span>
        <div className="top-app-bar-trailing">
          <span className="status-badge status-inactive">Offline</span>
        </div>
      </header>
      <div className="app-content">
        <NavDrawer />
        <main className="main-content">
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/backtest" element={<Backtest />} />
            <Route path="/history" element={<BacktestHistory />} />
            <Route path="/compare" element={<Comparison />} />
            <Route path="/live" element={<LiveMonitor />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/data" element={<Data />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
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