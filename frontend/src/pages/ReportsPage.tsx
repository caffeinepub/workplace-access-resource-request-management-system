import { useMemo, useState } from 'react';
import { useListAllRequests, useListAuditLogs, useIsCallerAdmin } from '../hooks/useQueries';
import { RequestStatus } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { Download, Printer, BarChart3, ShieldAlert, Search } from 'lucide-react';
import { format, subDays, isAfter, isBefore, parseISO } from 'date-fns';
import { exportToCSV } from '../utils/exportUtils';

const DEPARTMENTS = ['All', 'Engineering', 'Finance', 'Marketing', 'HR', 'Operations', 'IT', 'Legal', 'Sales'];
const REQUEST_TYPES = ['All', 'System Access', 'Physical Access', 'Equipment', 'Software Licenses'];

export default function ReportsPage() {
  const { data: requests = [], isLoading: reqLoading } = useListAllRequests();
  const { data: auditLogs = [], isLoading: logLoading } = useListAuditLogs();
  const { data: isAdmin } = useIsCallerAdmin();

  const [dateRange, setDateRange] = useState('30');
  const [deptFilter, setDeptFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PAGE_SIZE = 10;

  const filteredRequests = useMemo(() => {
    const cutoff = subDays(new Date(), parseInt(dateRange));
    return requests.filter(r => {
      const createdAt = new Date(Number(r.createdAt) / 1_000_000);
      if (isAfter(cutoff, createdAt)) return false;
      if (typeFilter !== 'All' && r.requestType !== typeFilter) return false;
      return true;
    });
  }, [requests, dateRange, typeFilter]);

  // Volume over time (daily)
  const volumeData = useMemo(() => {
    const days = parseInt(dateRange);
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM d');
      buckets[d] = 0;
    }
    filteredRequests.forEach(r => {
      const d = format(new Date(Number(r.createdAt) / 1_000_000), 'MMM d');
      if (d in buckets) buckets[d]++;
    });
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }, [filteredRequests, dateRange]);

  // Approval rate
  const approvalData = useMemo(() => {
    const approved = filteredRequests.filter(r => r.status === RequestStatus.approved || r.status === RequestStatus.completed).length;
    const rejected = filteredRequests.filter(r => r.status === RequestStatus.rejected).length;
    const pending = filteredRequests.filter(r => r.status === RequestStatus.pending).length;
    return [
      { name: 'Approved', value: approved, fill: '#10b981' },
      { name: 'Rejected', value: rejected, fill: '#ef4444' },
      { name: 'Pending', value: pending, fill: '#d97706' },
    ].filter(d => d.value > 0);
  }, [filteredRequests]);

  // SLA compliance by type
  const slaData = useMemo(() => {
    const byType: Record<string, { total: number; onTime: number }> = {};
    filteredRequests.forEach(r => {
      if (!byType[r.requestType]) byType[r.requestType] = { total: 0, onTime: 0 };
      byType[r.requestType].total++;
      if (!r.slaDeadline || r.status === RequestStatus.completed) {
        byType[r.requestType].onTime++;
      }
    });
    return Object.entries(byType).map(([name, { total, onTime }]) => ({
      name,
      compliance: total > 0 ? Math.round((onTime / total) * 100) : 100,
    }));
  }, [filteredRequests]);

  // Department breakdown (simulated since we don't have dept on requests)
  const deptData = useMemo(() => {
    const types = ['System Access', 'Physical Access', 'Equipment', 'Software Licenses'];
    return types.map(type => {
      const typeReqs = filteredRequests.filter(r => r.requestType === type);
      const completed = typeReqs.filter(r => r.status === RequestStatus.completed).length;
      return {
        type,
        total: typeReqs.length,
        completed,
        slaCompliance: typeReqs.length > 0 ? Math.round((completed / typeReqs.length) * 100) : 0,
      };
    });
  }, [filteredRequests]);

  // Audit log filtering
  const filteredLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(l =>
      l.action.toLowerCase().includes(q) ||
      l.requestId.toString().includes(q) ||
      (l.notes && l.notes.toLowerCase().includes(q))
    );
  }, [auditLogs, auditSearch]);

  const paginatedLogs = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PAGE_SIZE;
    return filteredLogs.slice(start, start + AUDIT_PAGE_SIZE);
  }, [filteredLogs, auditPage]);

  const totalAuditPages = Math.ceil(filteredLogs.length / AUDIT_PAGE_SIZE);

  const handleExportCSV = () => {
    exportToCSV(filteredRequests, `accessflow-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <ShieldAlert size={32} className="mx-auto mb-3 text-destructive" />
          <h2 className="font-semibold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-1">Reports are only available to administrators.</p>
        </div>
      </div>
    );
  }

  if (reqLoading || logLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 print:p-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 size={20} className="text-teal-500" />
            Reports & Export
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Analytics and compliance reporting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
            <Printer size={14} /> Print PDF
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold">AccessFlow — Management Report</h1>
        <p className="text-sm text-gray-500">Generated: {format(new Date(), 'MMMM d, yyyy HH:mm')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-card rounded-xl border border-border p-4 print:hidden">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REQUEST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground self-center">
          Showing {filteredRequests.length} of {requests.length} requests
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: filteredRequests.length, color: 'text-teal-600' },
          { label: 'Approved', value: filteredRequests.filter(r => r.status === RequestStatus.approved || r.status === RequestStatus.completed).length, color: 'text-green-600' },
          { label: 'Rejected', value: filteredRequests.filter(r => r.status === RequestStatus.rejected).length, color: 'text-red-600' },
          { label: 'Pending', value: filteredRequests.filter(r => r.status === RequestStatus.pending).length, color: 'text-yellow-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volume over time */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Request Volume Over Time</h3>
          <ChartContainer config={{}} className="h-48">
            <LineChart data={volumeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Approval rate */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Approval Rate</h3>
          {approvalData.length > 0 ? (
            <ChartContainer config={{}} className="h-48">
              <PieChart>
                <Pie data={approvalData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {approvalData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </div>
      </div>

      {/* SLA Compliance */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-sm text-foreground mb-4">SLA Compliance by Request Type</h3>
        {slaData.length > 0 ? (
          <ChartContainer config={{}} className="h-40">
            <BarChart data={slaData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="compliance" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data</div>
        )}
      </div>

      {/* Department breakdown */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Request Type Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Request Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Completed</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">SLA Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deptData.map(row => (
                <tr key={row.type} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium text-xs">{row.type}</td>
                  <td className="px-5 py-3 text-xs">{row.total}</td>
                  <td className="px-5 py-3 text-xs">{row.completed}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5 max-w-24">
                        <div
                          className="h-1.5 rounded-full bg-teal-500"
                          style={{ width: `${row.slaCompliance}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{row.slaCompliance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Audit Trail</h3>
          <div className="relative w-56">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={auditSearch}
              onChange={e => { setAuditSearch(e.target.value); setAuditPage(1); }}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Log ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Request</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Action</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Actor</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Timestamp</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-xs">No audit logs found</td>
                </tr>
              ) : (
                paginatedLogs.map(log => (
                  <tr key={log.id.toString()} className="hover:bg-muted/30">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">#{log.id.toString()}</td>
                    <td className="px-5 py-3 font-mono text-xs">#{log.requestId.toString()}</td>
                    <td className="px-5 py-3 text-xs font-medium capitalize">{log.action}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{log.actorId.toString().slice(0, 12)}...</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {format(new Date(Number(log.timestamp) / 1_000_000), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{log.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalAuditPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {auditPage} of {totalAuditPages} ({filteredLogs.length} entries)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={auditPage === 1} onClick={() => setAuditPage(p => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={auditPage === totalAuditPages} onClick={() => setAuditPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
