import { useState } from 'react';
import { useListApprovalPolicies, useAddApprovalPolicy } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { GitBranch, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const REQUEST_TYPES = ['System Access', 'Physical Access', 'Equipment', 'Software Licenses'];
const RISK_LEVELS = ['low', 'medium', 'high'];
const AVAILABLE_ROLES = ['Manager', 'IT Security', 'Finance Admin', 'Compliance Officer', 'HR Admin'];

export default function ApprovalPoliciesTab() {
  const { data: policies = [], isLoading } = useListApprovalPolicies();
  const { mutateAsync: addPolicy, isPending } = useAddApprovalPolicy();

  const [newType, setNewType] = useState('');
  const [newRisk, setNewRisk] = useState('');
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState('');

  const handleAddRole = () => {
    if (roleInput && !newRoles.includes(roleInput)) {
      setNewRoles(prev => [...prev, roleInput]);
      setRoleInput('');
    }
  };

  const handleRemoveRole = (role: string) => {
    setNewRoles(prev => prev.filter(r => r !== role));
  };

  const handleAddPolicy = async () => {
    if (!newType || !newRisk || newRoles.length === 0) {
      toast.error('Please fill in all fields and add at least one role');
      return;
    }
    try {
      await addPolicy({ requestType: newType, riskLevel: newRisk, requiredRoles: newRoles });
      toast.success('Approval policy added');
      setNewType('');
      setNewRisk('');
      setNewRoles([]);
    } catch {
      toast.error('Failed to add policy');
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Existing policies */}
      {policies.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Existing Policies</h3>
          </div>
          <div className="divide-y divide-border">
            {policies.map((policy, i) => (
              <div key={i} className="px-5 py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{policy.requestType}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                      style={{
                        background: policy.riskLevel === 'high' ? '#fee2e2' : policy.riskLevel === 'medium' ? '#fef3c7' : '#d1fae5',
                        color: policy.riskLevel === 'high' ? '#991b1b' : policy.riskLevel === 'medium' ? '#92400e' : '#065f46',
                      }}>
                      {policy.riskLevel} risk
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {policy.requiredRoles.map((role, j) => (
                      <span key={j} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <GitBranch size={14} className="text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border py-8 text-center text-muted-foreground">
          <GitBranch size={24} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">No approval policies configured yet.</p>
        </div>
      )}

      {/* Add new policy */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Add Approval Policy</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Request Type</label>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Risk Level</label>
            <Select value={newRisk} onValueChange={setNewRisk}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select risk" />
              </SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Required Approver Roles</label>
          <div className="flex gap-2">
            <Select value={roleInput} onValueChange={setRoleInput}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9" onClick={handleAddRole}>
              <Plus size={14} />
            </Button>
          </div>
          {newRoles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {newRoles.map(role => (
                <span key={role} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                  {role}
                  <button onClick={() => handleRemoveRole(role)} className="hover:text-destructive">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <Button
          className="w-full bg-teal-500 hover:bg-teal-600 text-white gap-2"
          onClick={handleAddPolicy}
          disabled={isPending}
        >
          <Plus size={14} /> Add Policy
        </Button>
      </div>
    </div>
  );
}
