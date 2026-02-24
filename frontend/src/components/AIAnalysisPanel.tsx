import { AlertTriangle, CheckCircle, Info, Lightbulb, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface AIAnalysisPanelProps {
  requestType: string;
  category: string;
  justification: string;
  riskLevel: string;
  cost: number;
}

interface AnalysisResult {
  type: 'warning' | 'info' | 'success' | 'suggestion';
  message: string;
}

function analyzeRequest(params: AIAnalysisPanelProps): {
  results: AnalysisResult[];
  suggestedAccessLevel: string;
  approvalChain: string[];
  estimatedTime: string;
} {
  const results: AnalysisResult[] = [];
  const { requestType, category, riskLevel, cost, justification } = params;

  // Check justification length
  if (justification.length < 20) {
    results.push({ type: 'warning', message: 'Justification is too brief. Please provide more detail to avoid delays.' });
  } else {
    results.push({ type: 'success', message: 'Justification looks complete and detailed.' });
  }

  // Risk-based warnings
  if (riskLevel === 'high') {
    results.push({ type: 'warning', message: 'High-risk requests require Manager + IT Security + Compliance approval.' });
    results.push({ type: 'info', message: 'Estimated approval time: 3–5 business days for high-risk access.' });
  } else if (riskLevel === 'medium') {
    results.push({ type: 'info', message: 'Medium-risk requests require Manager approval.' });
  } else {
    results.push({ type: 'success', message: 'Low-risk request may qualify for auto-approval.' });
  }

  // Cost-based
  if (cost > 1000) {
    results.push({ type: 'warning', message: `Cost exceeds $1,000 — Finance approval required (BR-03).` });
  }

  // Category-specific
  if (requestType === 'System Access' && category.toLowerCase().includes('admin')) {
    results.push({ type: 'warning', message: 'Warning: Admin-level access detected. Verify this is necessary for your role.' });
  }

  if (requestType === 'Software Licenses' && riskLevel === 'low') {
    results.push({ type: 'suggestion', message: 'Based on your request, read-only access may be sufficient. Consider requesting limited access first.' });
  }

  // Approval chain
  const approvalChain: string[] = ['Direct Manager'];
  if (riskLevel === 'high') {
    approvalChain.push('IT Security');
    approvalChain.push('Compliance Officer');
  }
  if (cost > 1000) {
    approvalChain.push('Finance Admin');
  }

  // Suggested access level
  let suggestedAccessLevel = 'Standard Access';
  if (requestType === 'System Access') {
    suggestedAccessLevel = riskLevel === 'high' ? 'Full Access (Requires Justification)' : 'Read-Only Access (Recommended)';
  } else if (requestType === 'Equipment') {
    suggestedAccessLevel = 'Standard Equipment Allocation';
  }

  // Estimated time
  const estimatedTime = riskLevel === 'high' ? '3–5 business days' : riskLevel === 'medium' ? '1–2 business days' : '< 4 hours (auto-approval eligible)';

  return { results, suggestedAccessLevel, approvalChain, estimatedTime };
}

export default function AIAnalysisPanel(props: AIAnalysisPanelProps) {
  const { results, suggestedAccessLevel, approvalChain, estimatedTime } = analyzeRequest(props);

  const iconMap = {
    warning: <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />,
    info: <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />,
    suggestion: <Lightbulb size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />,
  };

  const bgMap = {
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    suggestion: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
          <Lightbulb size={13} className="text-teal-600" />
        </div>
        <h3 className="font-semibold text-sm text-foreground">AI Pre-Submission Analysis</h3>
        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">Powered by AccessFlow AI</span>
      </div>

      {/* Analysis results */}
      <div className="space-y-2">
        {results.map((result, i) => (
          <div key={i} className={cn('flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs', bgMap[result.type])}>
            {iconMap[result.type]}
            <span>{result.message}</span>
          </div>
        ))}
      </div>

      {/* Suggested access level */}
      <div className="bg-muted rounded-lg p-3 space-y-1">
        <p className="text-xs font-semibold text-foreground">Suggested Access Level</p>
        <p className="text-sm text-foreground">{suggestedAccessLevel}</p>
      </div>

      {/* Approval chain */}
      <div className="bg-muted rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Users size={13} className="text-muted-foreground" />
          <p className="text-xs font-semibold text-foreground">Recommended Approval Chain</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {approvalChain.map((role, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-medium">{role}</span>
              {i < approvalChain.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Estimated time */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle size={13} className="text-teal-500" />
        <span>Estimated completion: <strong className="text-foreground">{estimatedTime}</strong></span>
      </div>
    </div>
  );
}
