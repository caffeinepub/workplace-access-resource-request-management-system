import { useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useListAllRequests, useIsCallerAdmin, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import SLACountdown from '../components/SLACountdown';
import ChatbotAssistant from '../components/ChatbotAssistant';
import { RequestStatus } from '../backend';
import {
  ClipboardList, Clock, CheckCircle, AlertTriangle, PlusCircle, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  [RequestStatus.pending]: '#d97706',
  [RequestStatus.approved]: '#3b82f6',
  [RequestStatus.completed]: '#10b981',
  [RequestStatus.rejected]: '#ef4444',
  [RequestStatus.inProgress]: '#f97316',
  [RequestStatus.moreInfoRequested]: '#8b5cf6',
};

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const { data: requests = [], isLoading } = useListAllRequests();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: profile } = useGetCallerUserProfile();
  const navigate = useNavigate();

  const myRequests = useMemo(() => {
    if (!identity) return requests;
    if (isAdmin) return requests;
    return requests.filter(r => r.employeeId.toString() === identity.getPrincipal().toString());
  }, [requests, identity, isAdmin]);

  const kpis = useMemo(() => {
    const total = myRequests.length;
    const pending = myRequests.filter(r => r.status === RequestStatus.pending).length;
    const completed = myRequests.filter(r => r.status === RequestStatus.completed).length;
    const now = BigInt(Date.now()) * BigInt(1_000_000);
    const slaBreaches = myRequests.filter(r => r.slaDeadline && r.slaDeadline < now && r.status !== RequestStatus.completed).length;
    return { total, pending, completed, slaBreaches };
  }, [myRequests]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    myRequests.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace(/([A-Z])/g, ' $1').trim(),
      value: count,
      fill: STATUS_COLORS[status] || '#94a3b8',
    }));
  }, [myRequests]);

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    myRequests.forEach(r => {
      counts[r.requestType] = (counts[r.requestType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [myRequests]);

  const recentRequests = useMemo(() =>
    [...myRequests]
      .sort((a, b) => Number(b.createdAt - a.createdAt))
      .slice(0, 8),
    [myRequests]
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Welcome back, {profile?.name || 'User'} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAdmin ? 'Administrator Dashboard' : 'Employee Dashboard'} — {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link to="/create-request">
          <Button className="bg-teal-500 hover:bg-teal-600 text-white gap-2">
            <PlusCircle size={16} />
            New Request
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Requests"
          value={kpis.total}
          icon={<ClipboardList size={18} />}
          accent="teal"
        />
        <KPICard
          label="Pending Approvals"
          value={kpis.pending}
          icon={<Clock size={18} />}
          accent="blue"
        />
        <KPICard
          label="Completed"
          value={kpis.completed}
          icon={<CheckCircle size={18} />}
          accent="green"
        />
        <KPICard
          label="SLA Breaches"
          value={kpis.slaBreaches}
          icon={<AlertTriangle size={18} />}
          accent={kpis.slaBreaches > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Charts */}
      {myRequests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status donut */}
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <h3 className="font-semibold text-sm text-foreground mb-4">Requests by Status</h3>
            {statusChartData.length > 0 ? (
              <ChartContainer config={{}} className="h-48">
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>

          {/* Category bar */}
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <h3 className="font-semibold text-sm text-foreground mb-4">Requests by Category</h3>
            {categoryChartData.length > 0 ? (
              <ChartContainer config={{}} className="h-48">
                <BarChart data={categoryChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>
        </div>
      )}

      {/* Recent Requests Table */}
      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Recent Requests</h3>
          <Link to="/approvals" className="text-xs text-teal-600 hover:underline font-medium">
            View all →
          </Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <ClipboardList size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No requests yet.</p>
            <Link to="/create-request">
              <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                <PlusCircle size={14} />
                Create your first request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Submitted</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">SLA</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentRequests.map((req) => (
                  <tr key={req.id.toString()} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">#{req.id.toString()}</td>
                    <td className="px-5 py-3 font-medium text-xs">{req.requestType}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{req.category}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {format(new Date(Number(req.createdAt) / 1_000_000), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3">
                      <SLACountdown deadline={req.slaDeadline} compact />
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => navigate({ to: '/requests/$requestId', params: { requestId: req.id.toString() } })}
                      >
                        <Eye size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ChatbotAssistant />
    </div>
  );
}
