import { useState } from 'react';
import { useListUsers, useAssignUserRole, useSetManagerDelegate } from '../hooks/useQueries';
import { UserRole } from '../backend';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagementTab() {
  const { data: users = [], isLoading } = useListUsers();
  const { mutateAsync: assignRole, isPending: assigningRole } = useAssignUserRole();
  const { mutateAsync: setDelegate, isPending: settingDelegate } = useSetManagerDelegate();

  const [editingRoles, setEditingRoles] = useState<Record<string, UserRole>>({});

  const handleRoleChange = (userId: string, role: UserRole) => {
    setEditingRoles(prev => ({ ...prev, [userId]: role }));
  };

  const handleSaveRole = async (userId: string) => {
    const role = editingRoles[userId];
    if (!role) return;
    try {
      await assignRole({ userId, role });
      toast.success('Role updated successfully');
      setEditingRoles(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch {
      toast.error('Failed to update role');
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  }

  if (users.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border py-12 text-center text-muted-foreground">
        <Users size={32} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">No users registered yet.</p>
        <p className="text-xs mt-1">Users appear here after they log in and set up their profile.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">User Management</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Assign roles and manager delegates</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Department</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Principal</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(user => {
              const userId = user.id.toString();
              const currentRole = editingRoles[userId] ?? user.role;
              const isDirty = editingRoles[userId] !== undefined;

              return (
                <tr key={userId} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium text-xs">{user.name}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{user.department}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{userId.slice(0, 16)}...</td>
                  <td className="px-5 py-3">
                    <Select
                      value={currentRole}
                      onValueChange={v => handleRoleChange(userId, v as UserRole)}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.guest}>Guest</SelectItem>
                        <SelectItem value={UserRole.user}>User</SelectItem>
                        <SelectItem value={UserRole.admin}>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-5 py-3">
                    {isDirty && (
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1 bg-teal-500 hover:bg-teal-600 text-white"
                        onClick={() => handleSaveRole(userId)}
                        disabled={assigningRole}
                      >
                        <Save size={11} /> Save
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
