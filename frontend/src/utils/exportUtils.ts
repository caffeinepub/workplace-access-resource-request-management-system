import { Request, RequestStatus } from '../backend';
import { format } from 'date-fns';

export function exportToCSV(requests: Request[], filename: string): void {
  const headers = [
    'ID', 'Type', 'Category', 'Status', 'Priority', 'Risk Level',
    'Cost ($)', 'Justification', 'Created At', 'SLA Deadline', 'Employee ID'
  ];

  const rows = requests.map(r => [
    r.id.toString(),
    r.requestType,
    r.category,
    r.status,
    r.priority,
    r.riskLevel,
    r.cost.toFixed(2),
    `"${r.justification.replace(/"/g, '""')}"`,
    format(new Date(Number(r.createdAt) / 1_000_000), 'yyyy-MM-dd HH:mm'),
    r.slaDeadline ? format(new Date(Number(r.slaDeadline) / 1_000_000), 'yyyy-MM-dd HH:mm') : '',
    r.employeeId.toString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generatePrintSummary(requests: Request[]): string {
  const total = requests.length;
  const approved = requests.filter(r => r.status === RequestStatus.approved || r.status === RequestStatus.completed).length;
  const rejected = requests.filter(r => r.status === RequestStatus.rejected).length;
  const pending = requests.filter(r => r.status === RequestStatus.pending).length;

  return `
    AccessFlow Management Report
    Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}
    
    Summary:
    - Total Requests: ${total}
    - Approved/Completed: ${approved}
    - Rejected: ${rejected}
    - Pending: ${pending}
    - Approval Rate: ${total > 0 ? Math.round((approved / total) * 100) : 0}%
  `;
}
