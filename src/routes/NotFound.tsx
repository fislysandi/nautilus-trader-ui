import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '72px', fontWeight: 600, color: 'var(--md-sys-color-primary)', marginBottom: '8px' }}>
        404
      </h1>
      <h2 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px', color: 'var(--md-sys-color-on-surface)' }}>
        Page not found
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '24px', maxWidth: '400px' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',
          border: 'none', borderRadius: '8px',
          padding: '10px 24px', fontSize: '14px',
          fontWeight: 500, cursor: 'pointer',
        }}
      >
        Go to Dashboard
      </button>
    </div>
  );
}

export default NotFound;