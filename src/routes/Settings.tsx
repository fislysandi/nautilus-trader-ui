import { useState } from 'react';

interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'password' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  description?: string;
}

interface SettingSection {
  title: string;
  description?: string;
  fields: SettingField[];
}

const SETTINGS_SECTIONS: SettingSection[] = [
  {
    title: 'Backtest Defaults',
    description: 'Default parameters for new backtest runs',
    fields: [
      {
        key: 'capital',
        label: 'Initial Capital',
        type: 'text',
        placeholder: '10000',
        description: 'Default starting capital for backtests',
      },
      {
        key: 'commission',
        label: 'Commission Model',
        type: 'select',
        options: [
          { value: '0', label: 'No commission' },
          { value: '0.001', label: '0.1% per trade' },
          { value: '0.002', label: '0.2% per trade' },
        ],
        description: 'Trading fees applied per fill',
      },
      {
        key: 'slippage',
        label: 'Slippage Model',
        type: 'select',
        options: [
          { value: '0', label: 'No slippage' },
          { value: '0.001', label: '0.1% slippage' },
          { value: '0.005', label: '0.5% slippage' },
        ],
        description: 'Simulated price impact per order',
      },
    ],
  },
  {
    title: 'Data Sources',
    description: 'Market data and strategy file paths',
    fields: [
      {
        key: 'dataPath',
        label: 'Data Directory',
        type: 'text',
        placeholder: './data',
        description: 'Path to market data files (Parquet, CSV)',
      },
      {
        key: 'strategiesPath',
        label: 'Strategies Directory',
        type: 'text',
        placeholder: './strategies',
        description: 'Directory containing strategy .py files',
      },
    ],
  },
  {
    title: 'Live Trading',
    description: 'Exchange API credentials and risk limits',
    fields: [
      {
        key: 'polymarketKey',
        label: 'Polymarket API Key',
        type: 'password',
        placeholder: 'Enter your API key',
        description: 'API key for Polymarket data and execution',
      },
      {
        key: 'polymarketSecret',
        label: 'Polymarket Secret',
        type: 'password',
        placeholder: 'Enter your secret key',
        description: 'Private key for order signing',
      },
      {
        key: 'maxPositionSize',
        label: 'Max Position Size',
        type: 'number',
        placeholder: '1000',
        description: 'Maximum USD value per position',
      },
      {
        key: 'maxDrawdown',
        label: 'Max Drawdown %',
        type: 'number',
        placeholder: '20',
        description: 'Auto-stop trading if drawdown exceeds this %',
      },
    ],
  },
];

const STORAGE_PREFIX = 'nt_';

function loadSetting(key: string): string {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`) || '';
  } catch {
    return '';
  }
}

function saveSetting(key: string, value: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
  } catch {
    /* localStorage full — persist silently */
  }
}

function Settings() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const section of SETTINGS_SECTIONS) {
      for (const field of section.fields) {
        initial[field.key] = loadSetting(field.key) || field.placeholder || '';
      }
    }
    return initial;
  });
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    for (const [key, value] of Object.entries(values)) {
      saveSetting(key, value);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const renderField = (field: SettingField) => {
    const sharedStyle: React.CSSProperties = {
      width: '100%', padding: '8px 12px',
      background: 'var(--md-sys-color-surface-container-highest)',
      color: 'var(--md-sys-color-on-surface)',
      border: '1px solid var(--md-sys-color-outline)',
      borderRadius: 'var(--md-sys-shape-corner-extra-small)',
      fontSize: '14px', fontFamily: 'Inter, sans-serif',
    };

    return (
      <div key={field.key} style={{ marginBottom: '16px' }}>
        <label className="metric-label" style={{ display: 'block', marginBottom: '2px' }}>
          {field.label}
        </label>
        {field.description && (
          <p style={{ fontSize: '11px', color: 'var(--md-sys-color-outline)', marginBottom: '4px', marginTop: 0 }}>
            {field.description}
          </p>
        )}
        {field.type === 'select' ? (
          <select
            value={values[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            style={sharedStyle}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            value={values[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            style={sharedStyle}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      {/* Section nav */}
      <div className="chart-container" style={{ width: '200px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
          Sections
        </h2>
        {SETTINGS_SECTIONS.map((section, i) => (
          <div
            key={section.title}
            onClick={() => setActiveSection(i)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '2px',
              background: i === activeSection ? 'var(--md-sys-color-secondary-container)' : 'transparent',
              color: i === activeSection ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
              fontSize: '13px',
              fontWeight: i === activeSection ? 500 : 400,
            }}
          >
            {section.title}
          </div>
        ))}
      </div>

      {/* Settings form */}
      <div style={{ flex: 1, maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
            {SETTINGS_SECTIONS[activeSection].title}
          </h1>
          <button onClick={handleSave} style={btnPrimary}>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {SETTINGS_SECTIONS[activeSection].description && (
          <p style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '20px', marginTop: 0 }}>
            {SETTINGS_SECTIONS[activeSection].description}
          </p>
        )}

        <div className="chart-container">
          {SETTINGS_SECTIONS[activeSection].fields.map(renderField)}
        </div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)',
  border: 'none', borderRadius: '8px', padding: '10px 24px',
  fontSize: '14px', fontWeight: 500, cursor: 'pointer',
};

export default Settings;