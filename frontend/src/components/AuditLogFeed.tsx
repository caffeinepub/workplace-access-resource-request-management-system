import { useGetAuditLogsForRequest } from '../hooks/useQueries';
import { format } from 'date-fns';
import { Activity, CheckCircle, XCircle, Info, Plus, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditLogFeedProps {
  requestId: bigint;
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  created: { icon: <Plus size={13} />, label: 'Request Created', color: 'text-blue-500' },
  approved: { icon: <CheckCircle size={13} />, label: 'Approved', color: 'text-green-500' },
  rejected: { icon: <XCircle size={13} />, label: 'Rejected', color: 'text-red-500' },
  moreInfoRequested: { icon: <MessageSquare size={13} />, label: 'More Info Requested', color: 'text-purple-500' },
};

export default function AuditLogFeed({ requestId }: AuditLogFeedProps) {
  const { data: logs = [], isLoading } = useGetAuditLogsForRequest(requestId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        <Activity size={20} className="mx-auto mb-2 opacity-30" />
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {[...logs].reverse().map((log, i) => {
        const config = ACTION_CONFIG[log.action] || {
          icon: <Activity size={13} />,
          label: log.action,
          color: 'text-muted-foreground'
        };

        return (
          <div key={log.id.toString()} className="flex gap-3 pb-4">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full bg-muted flex items-center justify-center ${config.color}`}>
                {config.icon}
              </div>
              {i < logs.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{config.label}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(Number(log.timestamp) / 1_000_000), 'MMM d, HH:mm')}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                by {log.actorId.toString().slice(0, 12)}...
              </p>
              {log.notes && (
                <p className="text-xs text-foreground/70 mt-1 italic">"{log.notes}"</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
