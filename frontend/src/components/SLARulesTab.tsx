import { useState } from 'react';
import { useListSlaRules, useSetSlaRule } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_CATEGORIES = ['System Access', 'Physical Access', 'Equipment', 'Software Licenses'];

export default function SLARulesTab() {
  const { data: rules = [], isLoading } = useListSlaRules();
  const { mutateAsync: setSlaRule, isPending } = useSetSlaRule();

  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState('');
  const [newHours, setNewHours] = useState('');

  const getRuleHours = (category: string): string => {
    const rule = rules.find(r => r.category === category);
    if (rule) return (Number(rule.deadlineNanos) / 3_600_000_000_000).toString();
    return '';
  };

  const handleSave = async (category: string) => {
    const hours = parseFloat(editValues[category] || getRuleHours(category));
    if (!hours || hours <= 0) {
      toast.error('Please enter a valid number of hours');
      return;
    }
    try {
      await setSlaRule({ category, deadlineHours: hours });
      toast.success(`SLA rule for "${category}" saved`);
      setEditValues(prev => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
    } catch {
      toast.error('Failed to save SLA rule');
    }
  };

  const handleAddNew = async () => {
    if (!newCategory.trim() || !newHours) {
      toast.error('Please fill in both category and hours');
      return;
    }
    try {
      await setSlaRule({ category: newCategory.trim(), deadlineHours: parseFloat(newHours) });
      toast.success(`SLA rule for "${newCategory}" added`);
      setNewCategory('');
      setNewHours('');
    } catch {
      toast.error('Failed to add SLA rule');
    }
  };

  const allCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...rules.map(r => r.category),
  ]));

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">SLA Rules</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Configure deadline hours per request category</p>
        </div>
        <div className="divide-y divide-border">
          {allCategories.map(category => {
            const currentVal = editValues[category] ?? getRuleHours(category);
            const isDirty = editValues[category] !== undefined;

            return (
              <div key={category} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-teal-500" />
                  <span className="text-sm font-medium">{category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Hours"
                    value={currentVal}
                    onChange={e => setEditValues(prev => ({ ...prev, [category]: e.target.value }))}
                    className="w-24 h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">hours</span>
                  {isDirty && (
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1 bg-teal-500 hover:bg-teal-600 text-white"
                      onClick={() => handleSave(category)}
                      disabled={isPending}
                    >
                      <Save size={11} /> Save
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add new */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Add Custom SLA Rule</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Category name"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="flex-1 h-9 text-sm"
          />
          <Input
            type="number"
            placeholder="Hours"
            value={newHours}
            onChange={e => setNewHours(e.target.value)}
            className="w-24 h-9 text-sm"
          />
          <Button
            className="h-9 gap-1.5 bg-teal-500 hover:bg-teal-600 text-white"
            onClick={handleAddNew}
            disabled={isPending}
          >
            <Plus size={14} /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
