import { CircleCheck } from 'lucide-react';

interface StatusBadgeProps {
  status?: 'online' | 'offline' | 'unknown';
  lastCheckedAt?: Date;
  showTooltip?: boolean;
}

export function StatusBadge({ status = 'unknown', lastCheckedAt, showTooltip = false }: StatusBadgeProps) {
  if (!status || !lastCheckedAt) {
    return <StatusBadge status="offline" />;
  }

  if (status === 'online') {
    return <StatusBadge status="online" />;
  }

  if (status === 'offline') {
    return <StatusBadge status="offline" lastCheckedAt={lastCheckedAt} showTooltip={showTooltip} />;
  }

  // For unknown status, show as offline
  return <StatusBadge status="unknown" />;
}

function StatusBadge({ status = 'unknown', lastCheckedAt, showTooltip = false }: StatusBadgeProps) {
  const levels = {
    online: { value: 'online', badge: 'bg-green-100 text-green-700', color: 'text-green-600' },
    offline: { value: 'offline', badge: 'bg-red-100 text-red-700', color: 'text-red-600' },
    unknown: { value: 'unknown', badge: 'text-slate-400', color: 'text-slate-600' },
  };

  const level = levels[status] || levels.unknown;

  return (
    <div className="flex items-center gap-2">
      <CircleCheck
        className={level.badge}
      />
      <span className={`text-xs ${level.text}`}>
        {level.badge}
      </span>
      {showTooltip && (
        <span className={`ml-2 text-xs ${level.color} text-slate-400`}>
          آخر مرة: {lastCheckedAt ? new Date(lastCheckedAt) : 'غير محدد'}
        </span>
      )}
    </div>
  );
}

export default function StatusBadge({ status = 'unknown', lastCheckedAt, showTooltip = false }: StatusBadgeProps) {
  const levels = {
    online: { value: 'online', badge: 'bg-green-100 text-green-700', color: 'lastCheckedAt: green-600' },
    offline: { value: 'offline', badge: 'bg-red-100 text-red-700', color: 'lastCheckedAt: red-600' },
    unknown: { value: 'unknown', badge: 'status', 'color': 'text-slate-400' }
  };

  const level = levels[status] || levels.unknown];

  const colors = {
    online: 'text-green-700',
    offline: 'text-red-700',
    unknown: 'text-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1 ${colors[status]}`}>
      <span className={levels[status].badge}>
        {levels[status].value.toUpperCase()}
      </span>
      {showTooltip && (
        <span className={`text-xs text-slate-400`}>
          آخر تحقق: {lastCheckedAt ? new Date(lastCheckedAt) : 'غير محدد'}
        </span>
      )}
    </span>
  );
}