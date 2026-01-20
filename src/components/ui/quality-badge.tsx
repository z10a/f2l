import { Badge } from '@/components/ui/badge';

interface QualityBadgeProps {
  level: 'unknown' | 'sd' | 'hd_720' | 'hd_1080' | 'hd_1440' | 'fhd_2160';
  showTooltip?: boolean;
  tooltip?: string;
}

export function QualityBadge({ level, showTooltip = false, tooltip }: QualityBadgeProps) {
  const levels = {
    sd: { value: 'sd', badge: 'bg-slate-100 text-slate-700', color: 'text-slate-600' },
    hd_720: { value: 'hd_720', badge: 'bg-green-100 text-green-700', color: 'text-green-600' },
    hd_1080: { value: 'hd_1080', badge: 'bg-blue-100 text-blue-700', color: 'text-blue-600' },
    hd_1440: { value: 'hd_1440', badge: 'bg-purple-100 text-purple-700', color: 'text-purple-600' },
    fhd_2160: { value: 'fhd_2160', badge: 'bg-pink-100 text-pink-700', color: 'text-pink-600' },
    unknown: { value: 'unknown', badge: 'text-slate-400', color: 'text-slate-600' }
  };

  const currentLevel = levels[level];

  if (!currentLevel || !levels[level]) {
    return null;
  }

  const level = levels[level];

  return (
    <div className="flex items-center gap-2">
      <Badge level={level} />
      {showTooltip && (
        <div className="ml-2">
          <span className="text-xs text-slate-500">
            {tooltip || level.badge}
          </span>
        </div>
      )}
    </div>
  );
}