import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Monitor, Key, Building2, Package, ChevronRight, ChevronLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RequestTypeCard from '../components/RequestTypeCard';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import ChatbotAssistant from '../components/ChatbotAssistant';
import { useCreateRequest } from '../hooks/useQueries';
import type { RiskLevel } from '../hooks/useQueries';
import { Priority } from '../backend';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const REQUEST_TYPES = [
  {
    id: 'System Access',
    icon: <Key size={20} />,
    title: 'System Access',
    description: 'ERP, CRM, Email groups, and other enterprise systems',
  },
  {
    id: 'Physical Access',
    icon: <Building2 size={20} />,
    title: 'Physical Access',
    description: 'Office entry, restricted areas, and building access',
  },
  {
    id: 'Equipment',
    icon: <Monitor size={20} />,
    title: 'Equipment',
    description: 'Laptop, monitor, ID card, and hardware devices',
  },
  {
    id: 'Software Licenses',
    icon: <Package size={20} />,
    title: 'Software Licenses',
    description: 'Software tools, applications, and license allocations',
  },
];

const CATEGORIES: Record<string, string[]> = {
  'System Access': ['ERP', 'CRM', 'Email Groups', 'VPN', 'Admin Console', 'Database Access'],
  'Physical Access': ['Office Entry', 'Server Room', 'Restricted Floor', 'Data Center', 'Parking'],
  'Equipment': ['Laptop', 'Monitor', 'ID Card', 'Mobile Device', 'Keyboard/Mouse', 'Docking Station'],
  'Software Licenses': ['Microsoft Office', 'Adobe Suite', 'Slack', 'Zoom', 'GitHub', 'Jira', 'Other'],
};

const STEPS = ['Select Type', 'Request Details', 'AI Review'];

export default function CreateRequestPage() {
  const [step, setStep] = useState(0);
  const [requestType, setRequestType] = useState('');
  const [category, setCategory] = useState('');
  const [justification, setJustification] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.medium);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('low');
  const [cost, setCost] = useState('0');

  const navigate = useNavigate();
  const { mutateAsync: createRequest, isPending } = useCreateRequest();

  // Pre-fill from chatbot via URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const cat = params.get('category');
    const pri = params.get('priority');
    const reason = params.get('reason');
    const risk = params.get('riskLevel');

    if (type && REQUEST_TYPES.find(t => t.id === type)) {
      setRequestType(type);
      setStep(1);
    }
    if (cat) setCategory(cat);
    if (pri && Object.values(Priority).includes(pri as Priority)) setPriority(pri as Priority);
    if (reason) setJustification(reason);
    if (risk && ['low', 'medium', 'high'].includes(risk)) setRiskLevel(risk as RiskLevel);
  }, []);

  const handleSubmit = async () => {
    if (!requestType || !category || !justification.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      const id = await createRequest({
        requestType,
        category,
        justification: justification.trim(),
        riskLevel,
        priority,
        cost: parseFloat(cost) || 0,
      });
      toast.success(`Request #${id.toString()} submitted successfully!`);
      navigate({ to: '/requests/$requestId', params: { requestId: id.toString() } });
    } catch {
      toast.error('Failed to submit request. Please try again.');
    }
  };

  const canProceedStep1 = requestType !== '';
  const canProceedStep2 = category !== '' && justification.trim().length >= 10;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">New Access Request</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Complete the form below to submit your request</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                i < step && 'bg-teal-500 border-teal-500 text-white',
                i === step && 'bg-primary border-primary text-primary-foreground',
                i > step && 'bg-background border-border text-muted-foreground'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={cn(
                'text-[11px] font-medium whitespace-nowrap',
                i === step && 'text-primary',
                i < step && 'text-teal-600',
                i > step && 'text-muted-foreground'
              )}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 mb-4',
                i < step ? 'bg-teal-500' : 'bg-border'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Type */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground">Select Request Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REQUEST_TYPES.map(type => (
              <RequestTypeCard
                key={type.id}
                icon={type.icon}
                title={type.title}
                description={type.description}
                selected={requestType === type.id}
                onClick={() => setRequestType(type.id)}
              />
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white gap-2"
              disabled={!canProceedStep1}
              onClick={() => setStep(1)}
            >
              Continue <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Request Details */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="font-semibold text-foreground">Request Details</h2>

          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(CATEGORIES[requestType] || []).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Justification */}
            <div className="space-y-1.5">
              <Label htmlFor="justification">Business Justification <span className="text-destructive">*</span></Label>
              <Textarea
                id="justification"
                placeholder="Explain why you need this access/resource and how it relates to your work..."
                value={justification}
                onChange={e => setJustification(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{justification.length} characters (minimum 10)</p>
            </div>

            {/* Priority & Risk */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Priority.low}>Low</SelectItem>
                    <SelectItem value={Priority.medium}>Medium</SelectItem>
                    <SelectItem value={Priority.high}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="risk">Risk Level</Label>
                <Select value={riskLevel} onValueChange={v => setRiskLevel(v as RiskLevel)}>
                  <SelectTrigger id="risk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost */}
            <div className="space-y-1.5">
              <Label htmlFor="cost">Estimated Cost (USD)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="0.00"
              />
              {parseFloat(cost) > 1000 && (
                <p className="text-xs text-orange-600">⚠ Cost exceeds $1,000 — Finance approval required</p>
              )}
            </div>

            {/* Document attachment (non-functional) */}
            <div className="space-y-1.5">
              <Label>Supporting Documents (optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
                <p>Drag & drop files here or click to browse</p>
                <p className="text-xs mt-1">PDF, DOC, PNG up to 10MB (demo — not functional)</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
              <ChevronLeft size={16} /> Back
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white gap-2"
              disabled={!canProceedStep2}
              onClick={() => setStep(2)}
            >
              Review with AI <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: AI Review */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="font-semibold text-foreground">AI Pre-Submission Analysis</h2>

          {/* Summary */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Request Summary</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{requestType}</span>
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{category}</span>
              <span className="text-muted-foreground">Priority:</span>
              <span className="font-medium capitalize">{priority}</span>
              <span className="text-muted-foreground">Risk Level:</span>
              <span className="font-medium capitalize">{riskLevel}</span>
              <span className="text-muted-foreground">Cost:</span>
              <span className="font-medium">${parseFloat(cost).toFixed(2)}</span>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-card rounded-xl border border-border p-5">
            <AIAnalysisPanel
              requestType={requestType}
              category={category}
              justification={justification}
              riskLevel={riskLevel}
              cost={parseFloat(cost) || 0}
            />
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ChevronLeft size={16} /> Back
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white gap-2"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Confirm & Submit
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <ChatbotAssistant />
    </div>
  );
}
