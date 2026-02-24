import { cn } from '../lib/utils';
import { RequestStatus } from '../backend';

interface StatusBadgeProps {
  status: RequestStatus | string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  [RequestStatus.pending]: {
    label: '🟡 Submitted',
    className: 'status-pending',
    dot: 'bg-yellow-500',
  },
  [RequestStatus.approved]: {
    label: '🔵 Approved',
    className: 'status-approved',
    dot: 'bg-blue-500',
  },
  [RequestStatus.completed]: {
    label: '✅ Completed',
    className: 'status-completed',
    dot: 'bg-green-500',
  },
  [RequestStatus.rejected]: {
    label: '🔴 Rejected',
    className: 'status-rejected',
    dot: 'bg-red-500',
  },
  [RequestStatus.inProgress]: {
    label: '🟢 In Fulfillment',
    className: 'status-inprogress',
    dot: 'bg-orange-500',
  },
  [RequestStatus.moreInfoRequested]: {
    label: '🔵 More Info Needed',
    className: 'status-moreinfo',
    dot: 'bg-purple-500',
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  const config: Record<string, { label: string; className: string }> = {
    low: { label: 'Low Risk', className: 'bg-green-100 text-green-700' },
    medium: { label: 'Medium Risk', className: 'bg-yellow-100 text-yellow-700' },
    high: { label: 'High Risk', className: 'bg-red-100 text-red-700' },
  };
  const c = config[risk] || config.medium;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', c.className)}>
      {c.label}
    </span>
  );
}
