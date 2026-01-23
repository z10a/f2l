import * as React from "react"

import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status?: "online" | "offline" | "unknown"
  lastCheckedAt?: Date
  showTooltip?: boolean
  className?: string
}

const STATUS_STYLES = {
  online: {
    label: "متصل",
    badge: "bg-green-100 text-green-700",
    text: "text-green-700",
  },
  offline: {
    label: "غير متصل",
    badge: "bg-red-100 text-red-700",
    text: "text-red-700",
  },
  unknown: {
    label: "غير معروف",
    badge: "bg-slate-100 text-slate-600",
    text: "text-slate-600",
  },
} as const

export function StatusBadge({
  status = "unknown",
  lastCheckedAt,
  showTooltip = false,
  className,
}: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.unknown

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", styles.badge)}>
        {styles.label}
      </span>
      {showTooltip && (
        <span className={cn("text-xs text-slate-500", styles.text)}>
          آخر تحقق: {lastCheckedAt ? new Date(lastCheckedAt).toLocaleString("ar") : "غير محدد"}
        </span>
      )}
    </span>
  )
}

export default StatusBadge
