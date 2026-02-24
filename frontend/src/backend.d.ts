import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface SlaRule {
    category: string;
    deadlineNanos: bigint;
}
export interface AuditLog {
    id: bigint;
    action: string;
    requestId: bigint;
    actorId: Principal;
    notes?: string;
    timestamp: Time;
}
export interface User {
    id: Principal;
    name: string;
    role: UserRole;
    department: string;
    managerDelegate?: Principal;
}
export interface ApprovalStep {
    status: string;
    approvedAt?: Time;
    approverRole: string;
    comments?: string;
}
export interface Request {
    id: bigint;
    status: RequestStatus;
    justification: string;
    slaDeadline?: Time;
    cost: number;
    createdAt: Time;
    estimatedCompletion?: Time;
    currentApprover?: Principal;
    employeeId: Principal;
    category: string;
    priority: Priority;
    approvalChain: Array<ApprovalStep>;
    riskLevel: RiskLevel;
    requestType: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface NotificationPreference {
    userId: Principal;
    inAppEnabled: boolean;
}
export interface Notification {
    id: bigint;
    userId: Principal;
    createdAt: Time;
    read: boolean;
    message: string;
}
export interface ApprovalPolicy {
    requiredRoles: Array<string>;
    riskLevel: string;
    requestType: string;
}
export interface UserProfile {
    name: string;
    department: string;
    managerDelegate?: Principal;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum Priority {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum RequestStatus {
    pending = "pending",
    completed = "completed",
    approved = "approved",
    rejected = "rejected",
    moreInfoRequested = "moreInfoRequested",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Add an approval chain policy. Admin-only.
     */
    addApprovalPolicy(requestType: string, riskLevel: string, requiredRoles: Array<string>): Promise<bigint>;
    /**
     * / Manually add an audit log entry. Admin-only.
     */
    addAuditLog(requestId: bigint, action: string, notes: string | null): Promise<void>;
    /**
     * / Add or update a user record. Admin-only.
     */
    addUser(userId: Principal, name: string, role: UserRole, department: string, managerDelegate: Principal | null): Promise<void>;
    /**
     * / Approve a request. Requires #user role (managers / IT admins / finance admins are users with elevated roles).
     */
    approveRequest(requestId: bigint, comments: string | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Assign a role to a user. Admin-only (delegates to access-control which also guards).
     */
    assignUserRole(userId: Principal, role: UserRole): Promise<void>;
    /**
     * / Create a new request. Requires at least #user role.
     */
    createRequest(requestType: string, category: string, justification: string, riskLevel: RiskLevel, priority: Priority, cost: number): Promise<bigint>;
    /**
     * / Get audit logs for a specific request. Requires #user role; non-admins can only view logs for their own requests.
     */
    getAuditLogsForRequest(requestId: bigint): Promise<Array<AuditLog>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get notification preferences for a user. Users can get their own; admins can get any.
     */
    getNotificationPreference(userId: Principal): Promise<NotificationPreference | null>;
    /**
     * / Get notifications for a user. Users can only fetch their own; admins can fetch any.
     */
    getNotifications(userId: Principal): Promise<Array<Notification>>;
    /**
     * / Get a single request by id. Requires #user role; non-admins can only view their own.
     */
    getRequest(requestId: bigint): Promise<Request>;
    /**
     * / Get requests belonging to a specific user.
     * / Users can only fetch their own requests; admins can fetch any user's requests.
     */
    getRequestsByUser(userId: Principal): Promise<Array<Request>>;
    /**
     * / Get unread notification count. Users can only query their own count; admins can query any.
     */
    getUnreadNotificationCount(userId: Principal): Promise<bigint>;
    /**
     * / Get a specific user. Admins can fetch any user; regular users can only fetch themselves.
     */
    getUser(userId: Principal): Promise<User>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    /**
     * / List all requests. Requires at least #user role (managers/admins use this for the approvals screen).
     */
    listAllRequests(): Promise<Array<Request>>;
    /**
     * / List all approval chain policies. Admin-only.
     */
    listApprovalPolicies(): Promise<Array<ApprovalPolicy>>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    /**
     * / List all audit logs. Admin-only (used in Reports & Export page).
     */
    listAuditLogs(): Promise<Array<AuditLog>>;
    /**
     * / List all SLA rules. Admin-only.
     */
    listSlaRules(): Promise<Array<SlaRule>>;
    /**
     * / List all users. Admin-only (used in Admin Configuration page).
     */
    listUsers(): Promise<Array<User>>;
    /**
     * / Mark a notification as read. Users can only mark their own notifications.
     */
    markNotificationAsRead(userId: Principal, notificationId: bigint): Promise<void>;
    /**
     * / Reject a request. Requires #user role.
     */
    rejectRequest(requestId: bigint, comments: string | null): Promise<void>;
    requestApproval(): Promise<void>;
    /**
     * / Request more information for a request. Requires #user role.
     */
    requestMoreInfo(requestId: bigint, comments: string | null): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    /**
     * / Set manager delegate for a user. Admin-only.
     */
    setManagerDelegate(userId: Principal, delegate: Principal | null): Promise<void>;
    /**
     * / Set notification preferences for a user. Users can set their own; admins can set any.
     */
    setNotificationPreference(userId: Principal, inAppEnabled: boolean): Promise<void>;
    /**
     * / Set an SLA rule for a request category. Admin-only.
     */
    setSlaRule(category: string, deadlineNanos: bigint): Promise<void>;
}
