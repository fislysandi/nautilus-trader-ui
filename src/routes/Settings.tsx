import { useState } from 'react';

function Settings() {
  const [capital, setCapital] = useState('10000');
  const [commission, setCommission] = useState('0');
  const [dataPath, setDataPath] = useState('./data');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('nt_capital', capital);
    localStorage.setItem('nt_commission', commission);
    localStorage.setItem('nt_data_path', dataPath);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px' }}>Settings</h1>

      <div className="chart-container" style={{ maxWidth: '520px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label className="metric-label" style={{ display: 'block', marginBottom: '4px' }}>Default Capital</label>
          <input type="text" value={capital} onChange={(e) => setCapital(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="metric-label" style={{ display: 'block', marginBottom: '4px' }}>Commission Model</label>
          <select value={commission} onChange={(e) => setCommission(e.target.value)} style={inputStyle}>
            <option value="0">No commission</option>
            <option value="0.001">0.1% per trade</option>
            <option value="0.002">0.2% per trade</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="metric-label" style={{ display: 'block', marginBottom: '4px' }}>Data Path</label>
          <input type="text" value={dataPath} onChange={(e) => setDataPath(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="metric-label" style={{ display: 'block', marginBottom: '4px' }}>API Key</label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter API key" style={inputStyle} />
        </div>

        <button onClick={handleSave} style={btnPrimary}>
          {saved ? 'Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  background: 'var(--md-sys-color-surface-container-highest)',
  color: 'var(--md-sys-color-on-surface)',
  border: '1px solid var(--md-sys-color-outline)',
  borderRadius: 'var(--md-sys-shape-corner-extra-small)',
  fontSize: '14px', fontFamily: 'Inter, sans-serif',
};

const btnPrimary: React.CSSProperties = {
  background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)',
  border: 'none', borderRadius: '8px', padding: '10px 24px',
  fontSize: '14px', fontWeight: 500, cursor: 'pointer',
};

export default Settings;