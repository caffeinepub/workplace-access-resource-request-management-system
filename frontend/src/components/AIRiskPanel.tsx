import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { Request } from '../backend';
import { cn } from '../lib/utils';

interface AIRiskPanelProps {
  request: Request;
  allRequests?: Request[];
}

interface RiskFlag {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

function generateRiskFlags(request: Request, allRequests: Request[]): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Check for duplicate/similar requests
  const similar = allRequests.filter(r =>
    r.id !== request.id &&
    r.employeeId.toString() === request.employeeId.toString() &&
    r.requestType === request.requestType &&
    r.status !== 'rejected'
  );
  if (similar.length > 0) {
    flags.push({
      severity: 'high',
      message: `Warning: This user already has ${similar.length} active ${request.requestType} request(s). Review for duplicate allocation.`
    });
  }

  // High-risk system access
  if (request.requestType === 'System Access' && request.riskLevel === 'high') {
    flags.push({
      severity: 'high',
      message: 'High-risk system access detected. Requires IT Security and Compliance review.'
    });
  }

  // Cost threshold
  if (request.cost > 1000) {
    flags.push({
      severity: 'medium',
      message: `Cost ($${request.cost.toFixed(2)}) exceeds $1,000 threshold — Finance approval required (BR-03).`
    });
  }

  // Admin access check
  if (request.category.toLowerCase().includes('admin')) {
    flags.push({
      severity: 'high',
      message: 'Admin-level access requested. Verify principle of least privilege is applied.'
    });
  }

  if (flags.length === 0) {
    flags.push({
      severity: 'low',
      message: 'No compliance risks detected. Request appears to follow standard access policies.'
    });
  }

  return flags;
}

export default function AIRiskPanel({ request, allRequests = [] }: AIRiskPanelProps) {
  const flags = generateRiskFlags(request, allRequests);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert size={15} className="text-orange-500" />
        <h3 className="text-sm font-semibold">AI Risk & Compliance Flags</h3>
      </div>
      {flags.map((flag, i) => (
        <div key={i} className={cn(
          "flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs",
          flag.severity === 'high' && "bg-red-50 border-red-200 text-red-800",
          flag.severity === 'medium' && "bg-orange-50 border-orange-200 text-orange-800",
          flag.severity === 'low' && "bg-green-50 border-green-200 text-green-800",
        )}>
          {flag.severity === 'high' ? (
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-red-500" />
          ) : flag.severity === 'medium' ? (
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-orange-500" />
          ) : (
            <Info size={13} className="flex-shrink-0 mt-0.5 text-green-500" />
          )}
          <span>{flag.message}</span>
        </div>
      ))}
    </div>
  );
}
