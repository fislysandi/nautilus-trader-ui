import { useEffect, useRef } from 'react';

interface LogTerminalProps {
  logs: string[];
  height?: string;
}

function LogTerminal({ logs, height = '200px' }: LogTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="log-terminal" ref={terminalRef} style={{
      background: '#000000',
      borderRadius: '8px',
      padding: '12px',
      height,
      overflowY: 'auto',
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      lineHeight: '1.6',
    }}>
      {logs.length === 0 ? (
        <span style={{ color: '#666' }}>Waiting for logs...</span>
      ) : (
        logs.map((line, i) => {
          let color = '#c4c6d0';
          if (line.includes('ERROR') || line.includes('error') || line.includes('Error')) color = '#ef4444';
          else if (line.includes('WARNING') || line.includes('warning')) color = '#eab308';
          else if (line.includes('complete') || line.includes('SUCCESS')) color = '#27a644';
          else if (line.includes('→') || line.includes('running') || line.includes('Running')) color = '#5e6ad2';

          return (
            <div key={i} style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {line}
            </div>
          );
        })
      )}
    </div>
  );
}

export default LogTerminal;
