import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Clock } from 'lucide-react';

interface SLACountdownProps {
  deadline: bigint | undefined;
  compact?: boolean;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return 'Overdue';
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

export default function SLACountdown({ deadline, compact = false }: SLACountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const deadlineMs = Number(deadline) / 1_000_000;

    const update = () => {
      setRemaining(deadlineMs - Date.now());
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) {
    return <span className="text-muted-foreground text-xs">No SLA set</span>;
  }

  const isOverdue = remaining !== null && remaining <= 0;
  const isWarning = remaining !== null && remaining > 0 && remaining < 4 * 3_600_000;

  if (compact) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isOverdue && "text-red-600",
        isWarning && "text-orange-500",
        !isOverdue && !isWarning && "text-muted-foreground"
      )}>
        <Clock size={11} />
        {remaining !== null ? formatDuration(remaining) : '...'}
      </span>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
      isOverdue && "bg-red-50 text-red-700 border border-red-200",
      isWarning && "bg-orange-50 text-orange-700 border border-orange-200",
      !isOverdue && !isWarning && "bg-muted text-muted-foreground"
    )}>
      <Clock size={14} />
      <span>SLA: {remaining !== null ? formatDuration(remaining) : 'Calculating...'}</span>
    </div>
  );
}
