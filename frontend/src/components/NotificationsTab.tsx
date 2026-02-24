import { useState } from 'react';
import { useListUsers, useSetNotificationPreference } from '../hooks/useQueries';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsTab() {
  const { data: users = [], isLoading } = useListUsers();
  const { mutateAsync: setPreference, isPending } = useSetNotificationPreference();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});

  const handleToggle = async (userId: string, enabled: boolean) => {
    setPreferences(prev => ({ ...prev, [userId]: enabled }));
    try {
      await setPreference({ userId, inAppEnabled: enabled });
      toast.success(`Notifications ${enabled ? 'enabled' : 'disabled'} for user`);
    } catch {
      // Revert on error
      setPreferences(prev => ({ ...prev, [userId]: !enabled }));
      toast.error('Failed to update notification preference');
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;
  }

  if (users.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border py-12 text-center text-muted-foreground">
        <Bell size={32} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">No users to configure notifications for.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">In-App Notification Preferences</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Toggle in-app notifications per user</p>
      </div>
      <div className="divide-y divide-border">
        {users.map(user => {
          const userId = user.id.toString();
          const enabled = preferences[userId] ?? true;

          return (
            <div key={userId} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30">
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.department} — {user.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{enabled ? 'Enabled' : 'Disabled'}</span>
                <Switch
                  checked={enabled}
                  onCheckedChange={v => handleToggle(userId, v)}
                  disabled={isPending}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
