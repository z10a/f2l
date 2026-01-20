import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/status-badge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-0 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <div className={`text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-red-600 transition-colors ${className}`}>
      {children}
    </div>
    );
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <div className={`line-clamp-2 text-slate-600 dark:text-slate-400 ${className}`}>
      {children}
    </div>
    );
}

export function StatusBadge({ status, showTooltip = false }: { status?: 'online' | 'offline' | 'unknown', lastCheckedAt?: Date, showTooltip = false }) {
  if (!status || !lastCheckedAt) {
    return null;
  }

  const statusColor = {
    online: { badge: 'bg-green-100 text-green-700', color: 'text-green-600' },
    offline: { badge: 'bg-red-100 text-red-700', color: 'text-red-600' },
    unknown: { badge: 'text-slate-400', color: 'text-slate-600' }
  };
    
    const level = status || 'unknown';
    const color = statusColor[level];

    return (
    <div className="inline-flex items-center gap-2">
      <Badge level={level} />
      {showTooltip && (
        <span className="ml-2">
          {color === 'text-green-600' ? (
            lastCheckedAt ? new Date(lastCheckedAt) : 'غير محدد'}
          ) : (
            color === 'text-red-600' ? 'جاري يوض غير محدد'
          ) : (
            color === 'text-slate-400' ? 'غير معروف'
          )
          )}
        </span>
      )}
    </div>
  );
}

export { Card, CardHeader, CardContent, CardTitle, CardDescription, StatusBadge, Badge };
