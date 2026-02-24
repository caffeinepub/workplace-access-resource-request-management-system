import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { ApprovalStep } from '../backend';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
}

export default function ApprovalTimeline({ steps }: ApprovalTimelineProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No approval chain defined for this request.
      </div>
    );
  }

  const getIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} className="text-green-500" />;
      case 'rejected': return <XCircle size={16} className="text-red-500" />;
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      default: return <AlertCircle size={16} className="text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2",
              step.status === 'approved' && "border-green-500 bg-green-50",
              step.status === 'rejected' && "border-red-500 bg-red-50",
              step.status === 'pending' && "border-yellow-400 bg-yellow-50",
              !['approved', 'rejected', 'pending'].includes(step.status) && "border-border bg-muted"
            )}>
              {getIcon(step.status)}
            </div>
            {i < steps.length - 1 && (
              <div className="w-0.5 h-8 bg-border mt-1" />
            )}
          </div>
          <div className="pb-6 flex-1">
            <p className="text-sm font-medium text-foreground">{step.approverRole}</p>
            <p className={cn(
              "text-xs capitalize",
              step.status === 'approved' && "text-green-600",
              step.status === 'rejected' && "text-red-600",
              step.status === 'pending' && "text-yellow-600",
            )}>
              {step.status}
            </p>
            {step.approvedAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(Number(step.approvedAt) / 1_000_000), 'MMM d, yyyy HH:mm')}
              </p>
            )}
            {step.comments && (
              <p className="text-xs text-muted-foreground mt-1 italic">"{step.comments}"</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
