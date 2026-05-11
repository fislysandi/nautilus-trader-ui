import { useState } from 'react';

interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'password' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  description?: string;
}

interface SettingSubsection {
  title: string;
  description?: string;
  fields: SettingField[];
}

interface SettingSection {
  title: string;
  description?: string;
  fields?: SettingField[];
  subsections?: SettingSubsection[];
}

const SETTINGS_DATA: SettingSection[] = [
  {
    title: 'Backtest Defaults',
    description: 'Default parameters for new backtest runs',
    fields: [
      {
        key: 'capital', label: 'Initial Capital', type: 'text',
        placeholder: '10000', description: 'Default starting capital',
      },
      {
        key: 'commission', label: 'Commission Model', type: 'select',
        options: [
          { value: '0', label: 'No commission' },
          { value: '0.001', label: '0.1% per trade' },
          { value: '0.002', label: '0.2% per trade' },
        ],
        description: 'Trading fees applied per fill',
      },
      {
        key: 'slippage', label: 'Slippage Model', type: 'select',
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
        key: 'dataPath', label: 'Data Directory', type: 'text',
        placeholder: './data', description: 'Path to market data files',
      },
      {
        key: 'strategiesPath', label: 'Strategies Directory', type: 'text',
        placeholder: './strategies', description: 'Directory containing .py strategies',
      },
    ],
  },
  {
    title: 'Exchanges',
    description: 'Exchange API credentials and trading configuration',
    subsections: [
      {
        title: 'Polymarket',
        description: 'Polymarket prediction market exchange',
        fields: [
          {
            key: 'polymarketKey', label: 'API Key', type: 'password',
            placeholder: 'Enter API key', description: 'Polymarket API key',
          },
          {
            key: 'polymarketSecret', label: 'Secret', type: 'password',
            placeholder: 'Enter secret', description: 'Private key for signing',
          },
        ],
      },
      {
        title: 'Bybit',
        description: 'Bybit cryptocurrency derivatives exchange',
        fields: [
          {
            key: 'bybitApiKey', label: 'API Key', type: 'password',
            placeholder: 'Enter Bybit API key', description: 'API key with trading permissions',
          },
          {
            key: 'bybitSecret', label: 'Secret', type: 'password',
            placeholder: 'Enter Bybit secret', description: 'API secret for request signing',
          },
          {
            key: 'bybitEnvironment', label: 'Environment', type: 'select',
            options: [
              { value: 'MAINNET', label: 'Mainnet (Production)' },
              { value: 'TESTNET', label: 'Testnet (Paper Trading)' },
              { value: 'DEMO', label: 'Demo' },
            ],
            description: 'Bybit environment',
          },
          {
            key: 'bybitProductType', label: 'Product Type', type: 'select',
            options: [
              { value: 'LINEAR', label: 'Linear (USDT Perpetuals)' },
              { value: 'SPOT', label: 'Spot' },
              { value: 'INVERSE', label: 'Inverse (Coin-M)' },
              { value: 'OPTION', label: 'Options' },
            ],
            description: 'Derivatives product type',
          },
          {
            key: 'bybitLeverage', label: 'Max Leverage', type: 'number',
            placeholder: '10', description: 'Maximum leverage for futures',
          },
        ],
      },
      {
        title: 'Hyperliquid',
        description: 'Hyperliquid spot and perpetuals DEX',
        fields: [
          {
            key: 'hyperliquidWallet', label: 'Wallet Address', type: 'text',
            placeholder: '0x...', description: 'EVM wallet address for Hyperliquid',
          },
          {
            key: 'hyperliquidPrivateKey', label: 'Private Key', type: 'password',
            placeholder: 'Enter private key', description: 'Wallet private key for signing',
          },
          {
            key: 'hyperliquidTestnet', label: 'Network', type: 'select',
            options: [
              { value: 'mainnet', label: 'Mainnet' },
              { value: 'testnet', label: 'Testnet (Sepolia)' },
            ],
            description: 'Hyperliquid network',
          },
        ],
      },
    ],
  },
  {
    title: 'Risk Limits',
    description: 'Global risk management parameters',
    fields: [
      {
        key: 'maxPositionSize', label: 'Max Position Size (USD)', type: 'number',
        placeholder: '1000', description: 'Maximum USD value per position',
      },
      {
        key: 'maxDrawdown', label: 'Max Drawdown %', type: 'number',
        placeholder: '20', description: 'Auto-stop if drawdown exceeds this',
      },
      {
        key: 'maxLeverage', label: 'Global Max Leverage', type: 'number',
        placeholder: '10', description: 'Global leverage limit across all exchanges',
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
    for (const section of SETTINGS_DATA) {
      if (section.fields) {
        for (const field of section.fields) {
          initial[field.key] = loadSetting(field.key) || field.placeholder || '';
        }
      }
      if (section.subsections) {
        for (const sub of section.subsections) {
          for (const field of sub.fields) {
            initial[field.key] = loadSetting(field.key) || field.placeholder || '';
          }
        }
      }
    }
    return initial;
  });

  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [activeSub, setActiveSub] = useState(0);

  const handleSectionClick = (i: number) => {
    setActiveSection(i);
    setActiveSub(0);
  };

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

  const section = SETTINGS_DATA[activeSection]!;
  const fields = section.subsections
    ? section.subsections[activeSub]!.fields
    : section.fields || [];

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
          <p style={{ fontSize: '11px', color: 'var(--md-sys-color-outline)', margin: '0 0 4px' }}>
            {field.description}
          </p>
        )}
        {field.type === 'select' ? (
          <select value={values[field.key] || ''} onChange={(e) => handleChange(field.key, e.target.value)} style={sharedStyle}>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input type={field.type} value={values[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder} style={sharedStyle} />
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      <div className="chart-container" style={{ width: '200px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
          Settings
        </h2>
        {SETTINGS_DATA.map((sec, i) => (
          <div key={sec.title} style={{ marginBottom: sec.subsections ? '8px' : '2px' }}>
            <div
              onClick={() => handleSectionClick(i)}
              style={{
                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                background: i === activeSection ? 'var(--md-sys-color-secondary-container)' : 'transparent',
                color: i === activeSection ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
                fontSize: '13px', fontWeight: i === activeSection ? 500 : 400,
              }}
            >
              {sec.title}
            </div>
            {sec.subsections && i === activeSection && (
              <div style={{ marginLeft: '8px', marginTop: '4px' }}>
                {sec.subsections.map((sub, j) => (
                  <div
                    key={sub.title}
                    onClick={() => setActiveSub(j)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '1px',
                      background: j === activeSub ? 'var(--md-sys-color-primary-container)' : 'transparent',
                      color: j === activeSub ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-outline)',
                      fontSize: '12px',
                    }}
                  >
                    {sub.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
              {section.subsections ? section.subsections[activeSub]!.title : section.title}
            </h1>
            {section.subsections
              ? <p style={{ fontSize: '12px', color: 'var(--md-sys-color-outline)', margin: '2px 0 0' }}>{section.title}</p>
              : section.description && <p style={{ fontSize: '12px', color: 'var(--md-sys-color-outline)', margin: '2px 0 0' }}>{section.description}</p>
            }
          </div>
          <button onClick={handleSave} style={btnPrimary}>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {section.subsections && section.subsections[activeSub]!.description && (
          <p style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px' }}>
            {section.subsections[activeSub]!.description}
          </p>
        )}

        <div className="chart-container">
          {fields.map(renderField)}
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