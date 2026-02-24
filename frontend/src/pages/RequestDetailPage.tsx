import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Calendar, DollarSign, Tag, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge, { RiskBadge } from '../components/StatusBadge';
import StatusStepper from '../components/StatusStepper';
import SLACountdown from '../components/SLACountdown';
import ApprovalTimeline from '../components/ApprovalTimeline';
import AIRiskPanel from '../components/AIRiskPanel';
import AuditLogFeed from '../components/AuditLogFeed';
import ChatbotAssistant from '../components/ChatbotAssistant';
import { useGetRequest, useListAllRequests, useIsCallerAdmin } from '../hooks/useQueries';
import { RequestStatus } from '../backend';
import { format } from 'date-fns';

export default function RequestDetailPage() {
  const { requestId } = useParams({ from: '/requests/$requestId' });
  const navigate = useNavigate();
  const requestIdBigInt = BigInt(requestId);

  const { data: request, isLoading, error } = useGetRequest(requestIdBigInt);
  const { data: allRequests = [] } = useListAllRequests();
  const { data: isAdmin } = useIsCallerAdmin();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <AlertCircle size={20} className="text-destructive" />
          <div>
            <p className="font-semibold text-sm">Request not found</p>
            <p className="text-xs text-muted-foreground">This request may not exist or you may not have permission to view it.</p>
          </div>
        </div>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Request #{request.id.toString()}</h1>
          <p className="text-muted-foreground text-xs">{request.requestType} — {request.category}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={request.status} />
          <RiskBadge risk={request.riskLevel} />
        </div>
      </div>

      {/* Status Stepper */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Progress</h2>
        <StatusStepper status={request.status as RequestStatus} />
      </div>

      {/* Metadata + SLA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-card rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Request Details</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Tag size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium">{request.requestType}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{request.category}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="font-medium">{format(new Date(Number(request.createdAt) / 1_000_000), 'MMM d, yyyy HH:mm')}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <DollarSign size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Cost</p>
                <p className="font-medium">${request.cost.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Priority</p>
                <p className="font-medium capitalize">{request.priority}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <p className="font-medium capitalize">{request.riskLevel}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Justification</p>
            <p className="text-sm text-foreground bg-muted rounded-lg p-3 leading-relaxed">{request.justification}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* SLA */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">SLA Status</h2>
            <SLACountdown deadline={request.slaDeadline} />
            {request.estimatedCompletion && (
              <div className="mt-2 text-xs text-muted-foreground">
                Est. completion: {format(new Date(Number(request.estimatedCompletion) / 1_000_000), 'MMM d, yyyy')}
              </div>
            )}
          </div>

          {/* AI Risk */}
          <div className="bg-card rounded-xl border border-border p-4">
            <AIRiskPanel request={request} allRequests={allRequests} />
          </div>
        </div>
      </div>

      {/* Approval Chain */}
      {request.approvalChain && request.approvalChain.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Approval Chain</h2>
          <ApprovalTimeline steps={request.approvalChain} />
        </div>
      )}

      {/* Audit Log */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Activity Log</h2>
        <AuditLogFeed requestId={requestIdBigInt} />
      </div>

      <ChatbotAssistant />
    </div>
  );
}
