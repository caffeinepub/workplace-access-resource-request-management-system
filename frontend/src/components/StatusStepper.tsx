import { Check } from 'lucide-react';
import { RequestStatus } from '../backend';
import { cn } from '../lib/utils';

const STEPS = [
  { key: RequestStatus.pending, label: 'Submitted' },
  { key: 'underReview', label: 'Under Review' },
  { key: RequestStatus.approved, label: 'Approved' },
  { key: RequestStatus.inProgress, label: 'In Fulfillment' },
  { key: RequestStatus.completed, label: 'Completed' },
];

function getStepIndex(status: RequestStatus): number {
  switch (status) {
    case RequestStatus.pending: return 0;
    case RequestStatus.approved: return 2;
    case RequestStatus.inProgress: return 3;
    case RequestStatus.completed: return 4;
    case RequestStatus.rejected: return -1;
    case RequestStatus.moreInfoRequested: return 1;
    default: return 0;
  }
}

interface StatusStepperProps {
  status: RequestStatus;
}

export default function StatusStepper({ status }: StatusStepperProps) {
  const currentIndex = getStepIndex(status);
  const isRejected = status === RequestStatus.rejected;

  if (isRejected) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-600 font-medium text-sm">🔴 Request Rejected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                isCompleted && "bg-teal-500 border-teal-500 text-white",
                isCurrent && "bg-primary border-primary text-primary-foreground",
                isFuture && "bg-background border-border text-muted-foreground"
              )}>
                {isCompleted ? <Check size={12} /> : i + 1}
              </div>
              <span className={cn(
                "text-[10px] font-medium text-center leading-tight max-w-[60px]",
                isCurrent && "text-primary",
                isCompleted && "text-teal-600",
                isFuture && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-1 mb-4",
                i < currentIndex ? "bg-teal-500" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
