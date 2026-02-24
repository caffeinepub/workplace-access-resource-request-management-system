import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Request, AuditLog, Notification, User, SlaRule, ApprovalPolicy, UserProfile, UserRole, Priority } from '../backend';

// RiskLevel is used in createRequest but not exported as an enum from backend.d.ts
// Define it locally to match the backend's variant type
export type RiskLevel = 'low' | 'medium' | 'high';

// ── User Profile ──────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Role ──────────────────────────────────────────────────────────────────────

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserRole>({
    queryKey: ['callerUserRole', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 30_000,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 30_000,
  });
}

// ── Requests ──────────────────────────────────────────────────────────────────

export function useListAllRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Request[]>({
    queryKey: ['allRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllRequests();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetRequestsByUser() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Request[]>({
    queryKey: ['myRequests', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getRequestsByUser(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetRequest(requestId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Request>({
    queryKey: ['request', requestId?.toString()],
    queryFn: async () => {
      if (!actor || requestId === null) throw new Error('Not available');
      return actor.getRequest(requestId);
    },
    enabled: !!actor && !actorFetching && !!identity && requestId !== null,
  });
}

export function useCreateRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      requestType: string;
      category: string;
      justification: string;
      riskLevel: RiskLevel;
      priority: Priority;
      cost: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createRequest(
        params.requestType,
        params.category,
        params.justification,
        params.riskLevel as any,
        params.priority,
        params.cost
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
}

export function useApproveRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: bigint; comments: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveRequest(requestId, comments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      queryClient.invalidateQueries({ queryKey: ['request'] });
    },
  });
}

export function useRejectRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: bigint; comments: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectRequest(requestId, comments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      queryClient.invalidateQueries({ queryKey: ['request'] });
    },
  });
}

export function useRequestMoreInfo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: bigint; comments: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestMoreInfo(requestId, comments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      queryClient.invalidateQueries({ queryKey: ['request'] });
    },
  });
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export function useGetAuditLogsForRequest(requestId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AuditLog[]>({
    queryKey: ['auditLogs', requestId?.toString()],
    queryFn: async () => {
      if (!actor || requestId === null) return [];
      return actor.getAuditLogsForRequest(requestId);
    },
    enabled: !!actor && !actorFetching && !!identity && requestId !== null,
  });
}

export function useListAuditLogs() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AuditLog[]>({
    queryKey: ['allAuditLogs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAuditLogs();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Notification[]>({
    queryKey: ['notifications', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getNotifications(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 30_000,
  });
}

export function useGetUnreadNotificationCount() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<bigint>({
    queryKey: ['unreadNotifications', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return BigInt(0);
      return actor.getUnreadNotificationCount(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationAsRead() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: bigint) => {
      if (!actor || !identity) throw new Error('Not available');
      return actor.markNotificationAsRead(identity.getPrincipal(), notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function useListUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.assignUserRole(Principal.fromText(userId), role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useSetManagerDelegate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, delegate }: { userId: string; delegate: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      const delegatePrincipal = delegate ? Principal.fromText(delegate) : null;
      return actor.setManagerDelegate(Principal.fromText(userId), delegatePrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// ── SLA Rules ─────────────────────────────────────────────────────────────────

export function useListSlaRules() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SlaRule[]>({
    queryKey: ['slaRules'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSlaRules();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useSetSlaRule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category, deadlineHours }: { category: string; deadlineHours: number }) => {
      if (!actor) throw new Error('Actor not available');
      const deadlineNanos = BigInt(deadlineHours) * BigInt(3_600_000_000_000);
      return actor.setSlaRule(category, deadlineNanos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaRules'] });
    },
  });
}

// ── Approval Policies ─────────────────────────────────────────────────────────

export function useListApprovalPolicies() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ApprovalPolicy[]>({
    queryKey: ['approvalPolicies'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovalPolicies();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useAddApprovalPolicy() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestType, riskLevel, requiredRoles }: { requestType: string; riskLevel: string; requiredRoles: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addApprovalPolicy(requestType, riskLevel, requiredRoles);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalPolicies'] });
    },
  });
}

// ── Notification Preferences ──────────────────────────────────────────────────

export function useSetNotificationPreference() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, inAppEnabled }: { userId: string; inAppEnabled: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.setNotificationPreference(Principal.fromText(userId), inAppEnabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    },
  });
}
