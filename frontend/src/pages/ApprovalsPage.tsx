import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useListAllRequests, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import StatusBadge, { RiskBadge } from '../components/StatusBadge';
import ApprovalActionButtons from '../components/ApprovalActionButtons';
import ChatbotAssistant from '../components/ChatbotAssistant';
import { RequestStatus } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckSquare, Search, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function ApprovalsPage() {
  const { data: requests = [], isLoading } = useListAllRequests();
  const { data: isAdmin } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  // For approvals page, show pending requests (admins see all, users see their own)
  const filteredRequests = useMemo(() => {
    let list = requests;

    if (!isAdmin && identity) {
      list = list.filter(r => r.employeeId.toString() === identity.getPrincipal().toString());
    }

    if (statusFilter !== 'all') {
      list = list.filter(r => r.status === statusFilter);
    }

    if (riskFilter !== 'all') {
      list = list.filter(r => r.riskLevel === riskFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.requestType.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.id.toString().includes(q)
      );
    }

    return [...list].sort((a, b) => Number(b.createdAt - a.createdAt));
  }, [requests, isAdmin, identity, statusFilter, riskFilter, search]);

  const pendingCount = requests.filter(r => r.status === RequestStatus.pending).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare size={20} className="text-teal-500" />
            {isAdmin ? 'All Requests' : 'My Requests'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-card rounded-xl border border-border p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value={RequestStatus.pending}>Pending</SelectItem>
            <SelectItem value={RequestStatus.approved}>Approved</SelectItem>
            <SelectItem value={RequestStatus.rejected}>Rejected</SelectItem>
            <SelectItem value={RequestStatus.inProgress}>In Progress</SelectItem>
            <SelectItem value={RequestStatus.completed}>Completed</SelectItem>
            <SelectItem value={RequestStatus.moreInfoRequested}>More Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Auto-approval notice */}
      <div className="flex items-start gap-2 px-4 py-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800">
        <Filter size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>Auto-approval active:</strong> Low-risk software license requests are automatically approved (BR-04).
          High-risk requests require Manager + IT Security + Compliance approval (BR-02).
        </span>
      </div>

      {/* Requests list */}
      {filteredRequests.length === 0 ? (
        <div className="bg-card rounded-xl border border-border py-16 text-center text-muted-foreground">
          <CheckSquare size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No requests found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => (
            <div key={req.id.toString()} className="bg-card rounded-xl border border-border p-4 hover:shadow-card-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">#{req.id.toString()}</span>
                    <span className="font-semibold text-sm text-foreground">{req.requestType}</span>
                    <span className="text-muted-foreground text-xs">—</span>
                    <span className="text-xs text-muted-foreground">{req.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.justification}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <StatusBadge status={req.status} />
                    <RiskBadge risk={req.riskLevel} />
                    <span className="text-xs text-muted-foreground">
                      ${req.cost.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(Number(req.createdAt) / 1_000_000), 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs capitalize text-muted-foreground">
                      Priority: <strong className="text-foreground">{req.priority}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => navigate({ to: '/requests/$requestId', params: { requestId: req.id.toString() } })}
                  >
                    <Eye size={12} /> View
                  </Button>
                  {isAdmin && req.status === RequestStatus.pending && (
                    <ApprovalActionButtons requestId={req.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ChatbotAssistant />
    </div>
  );
}
