import { useState } from 'react';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, Users, Clock, GitBranch, Bell } from 'lucide-react';
import UserManagementTab from '../components/UserManagementTab';
import SLARulesTab from '../components/SLARulesTab';
import ApprovalPoliciesTab from '../components/ApprovalPoliciesTab';
import NotificationsTab from '../components/NotificationsTab';
import ChatbotAssistant from '../components/ChatbotAssistant';

export default function AdminConfigPage() {
  const { data: isAdmin, isLoading } = useIsCallerAdmin();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <ShieldAlert size={32} className="mx-auto mb-3 text-destructive" />
          <h2 className="font-semibold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-1">Admin configuration is only available to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Admin Configuration</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage users, SLA rules, approval policies, and notifications</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="users" className="gap-1.5 text-xs">
            <Users size={13} /> Users
          </TabsTrigger>
          <TabsTrigger value="sla" className="gap-1.5 text-xs">
            <Clock size={13} /> SLA Rules
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-1.5 text-xs">
            <GitBranch size={13} /> Approval Policies
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs">
            <Bell size={13} /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UserManagementTab />
        </TabsContent>
        <TabsContent value="sla" className="mt-4">
          <SLARulesTab />
        </TabsContent>
        <TabsContent value="policies" className="mt-4">
          <ApprovalPoliciesTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <NotificationsTab />
        </TabsContent>
      </Tabs>

      <ChatbotAssistant />
    </div>
  );
}
