type Status = 'active' | 'inactive' | 'error';

interface StatusBadgeProps {
  status: Status;
  label?: string;
  pulse?: boolean;
}

const defaultLabels: Record<Status, string> = {
  active: 'Active',
  inactive: 'Inactive',
  error: 'Error',
};

export default function StatusBadge({ status, label, pulse }: StatusBadgeProps) {
  const displayLabel = label ?? defaultLabels[status];
  const isActive = status === 'active';

  return (
    <span className={`status-badge status-${status}`}>
      <span
        style={{
          display: 'inline-block',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          marginRight: '6px',
          backgroundColor: 'currentColor',
          ...(isActive && pulse
            ? {
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }
            : {}),
        }}
      />
      {displayLabel}
    </span>
  );
}