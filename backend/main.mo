import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);
  include MixinAuthorization(accessControlState);

  // ── User Approval Extension ──────────────────────────────────────────────

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  // ── User Profile (required by instructions) ──────────────────────────────

  public type UserProfile = {
    name : Text;
    department : Text;
    managerDelegate : ?Principal;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ── Domain types ──────────────────────────────────────────────────────────

  type User = {
    id : Principal;
    name : Text;
    role : AccessControl.UserRole;
    department : Text;
    managerDelegate : ?Principal;
  };

  type RequestStatus = {
    #pending;
    #approved;
    #rejected;
    #inProgress;
    #completed;
    #moreInfoRequested;
  };

  type RiskLevel = {
    #low;
    #medium;
    #high;
  };

  type Priority = {
    #low;
    #medium;
    #high;
  };

  type ApprovalStep = {
    approverRole : Text;
    status : Text;
    approvedAt : ?Time.Time;
    comments : ?Text;
  };

  type Request = {
    id : Nat;
    employeeId : Principal;
    requestType : Text;
    category : Text;
    justification : Text;
    status : RequestStatus;
    riskLevel : RiskLevel;
    priority : Priority;
    createdAt : Time.Time;
    slaDeadline : ?Time.Time;
    estimatedCompletion : ?Time.Time;
    approvalChain : [ApprovalStep];
    currentApprover : ?Principal;
    cost : Float;
  };

  type AuditLog = {
    id : Nat;
    requestId : Nat;
    actorId : Principal;
    action : Text;
    timestamp : Time.Time;
    notes : ?Text;
  };

  type Notification = {
    id : Nat;
    userId : Principal;
    message : Text;
    read : Bool;
    createdAt : Time.Time;
  };

  // SLA rule: maps category text to deadline duration in nanoseconds
  type SlaRule = {
    category : Text;
    deadlineNanos : Int;
  };

  // Approval chain policy
  type ApprovalPolicy = {
    requestType : Text;
    riskLevel : Text;
    requiredRoles : [Text];
  };

  // Notification preference
  type NotificationPreference = {
    userId : Principal;
    inAppEnabled : Bool;
  };

  // ── State ─────────────────────────────────────────────────────────────────

  let users = Map.empty<Principal, User>();
  let requests = Map.empty<Nat, Request>();
  let auditLogs = Map.empty<Nat, AuditLog>();
  let notifications = Map.empty<Principal, List.List<Notification>>();
  let slaRules = Map.empty<Text, SlaRule>();
  let approvalPolicies = Map.empty<Nat, ApprovalPolicy>();
  let notificationPreferences = Map.empty<Principal, NotificationPreference>();

  var nextRequestId = 1;
  var nextAuditLogId = 1;
  var nextNotificationId = 1;
  var nextPolicyId = 1;

  // ── Internal helpers ──────────────────────────────────────────────────────

  func addNotificationForUser(userId : Principal, message : Text) {
    let notif : Notification = {
      id = nextNotificationId;
      userId;
      message;
      read = false;
      createdAt = Time.now();
    };
    let existing = switch (notifications.get(userId)) {
      case (?list) { list };
      case (null) { List.empty<Notification>() };
    };
    existing.add(notif);
    notifications.add(userId, existing);
    nextNotificationId += 1;
  };

  func appendAuditLog(requestId : Nat, actorId : Principal, action : Text, notes : ?Text) {
    let log : AuditLog = {
      id = nextAuditLogId;
      requestId;
      actorId;
      action;
      timestamp = Time.now();
      notes;
    };
    auditLogs.add(nextAuditLogId, log);
    nextAuditLogId += 1;
  };

  // ── User Management (Admin only) ──────────────────────────────────────────

  /// Add or update a user record. Admin-only.
  public shared ({ caller }) func addUser(
    userId : Principal,
    name : Text,
    role : AccessControl.UserRole,
    department : Text,
    managerDelegate : ?Principal,
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can manage users");
    };
    let user : User = {
      id = userId;
      name;
      role;
      department;
      managerDelegate;
    };
    users.add(userId, user);
    // Also assign the role in the access-control system
    AccessControl.assignRole(accessControlState, caller, userId, role);
  };

  /// Get a specific user. Admins can fetch any user; regular users can only fetch themselves.
  public query ({ caller }) func getUser(userId : Principal) : async User {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own user record");
    };
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };
  };

  /// List all users. Admin-only (used in Admin Configuration page).
  public query ({ caller }) func listUsers() : async [User] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    users.values().toArray();
  };

  /// Assign a role to a user. Admin-only (delegates to access-control which also guards).
  public shared ({ caller }) func assignUserRole(userId : Principal, role : AccessControl.UserRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign roles");
    };
    AccessControl.assignRole(accessControlState, caller, userId, role);
    // Update stored user record if present
    switch (users.get(userId)) {
      case (?user) {
        users.add(userId, { user with role });
      };
      case (null) {};
    };
  };

  /// Set manager delegate for a user. Admin-only.
  public shared ({ caller }) func setManagerDelegate(userId : Principal, delegate : ?Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set manager delegates");
    };
    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        users.add(userId, { user with managerDelegate = delegate });
      };
    };
  };

  // ── Request Management ────────────────────────────────────────────────────

  /// Create a new request. Requires at least #user role.
  public shared ({ caller }) func createRequest(
    requestType : Text,
    category : Text,
    justification : Text,
    riskLevel : RiskLevel,
    priority : Priority,
    cost : Float,
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create requests");
    };
    let reqId = nextRequestId;
    let request : Request = {
      id = reqId;
      employeeId = caller;
      requestType;
      category;
      justification;
      status = #pending;
      riskLevel;
      priority;
      createdAt = Time.now();
      slaDeadline = null;
      estimatedCompletion = null;
      approvalChain = [];
      currentApprover = null;
      cost;
    };
    requests.add(reqId, request);
    nextRequestId += 1;
    appendAuditLog(reqId, caller, "created", null);
    addNotificationForUser(caller, "Your request #" # reqId.toText() # " has been submitted successfully.");
    reqId;
  };

  /// Get requests belonging to a specific user.
  /// Users can only fetch their own requests; admins can fetch any user's requests.
  public query ({ caller }) func getRequestsByUser(userId : Principal) : async [Request] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own requests");
    };
    requests.values().toArray().filter(func(r : Request) : Bool { r.employeeId == userId });
  };

  /// List all requests. Requires at least #user role (managers/admins use this for the approvals screen).
  public query ({ caller }) func listAllRequests() : async [Request] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can list requests");
    };
    requests.values().toArray();
  };

  /// Get a single request by id. Requires #user role; non-admins can only view their own.
  public query ({ caller }) func getRequest(requestId : Nat) : async Request {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view requests");
    };
    switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?req) {
        if (req.employeeId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own requests");
        };
        req;
      };
    };
  };

  /// Approve a request. Requires #user role (managers / IT admins / finance admins are users with elevated roles).
  public shared ({ caller }) func approveRequest(requestId : Nat, comments : ?Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can approve requests");
    };
    switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?req) {
        let updated : Request = { req with status = #approved };
        requests.add(requestId, updated);
        appendAuditLog(requestId, caller, "approved", comments);
        addNotificationForUser(req.employeeId, "Your request #" # requestId.toText() # " has been approved.");
      };
    };
  };

  /// Reject a request. Requires #user role.
  public shared ({ caller }) func rejectRequest(requestId : Nat, comments : ?Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can reject requests");
    };
    switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?req) {
        let updated : Request = { req with status = #rejected };
        requests.add(requestId, updated);
        appendAuditLog(requestId, caller, "rejected", comments);
        addNotificationForUser(req.employeeId, "Your request #" # requestId.toText() # " has been rejected.");
      };
    };
  };

  /// Request more information for a request. Requires #user role.
  public shared ({ caller }) func requestMoreInfo(requestId : Nat, comments : ?Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can request more info");
    };
    switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?req) {
        let updated : Request = { req with status = #moreInfoRequested };
        requests.add(requestId, updated);
        appendAuditLog(requestId, caller, "moreInfoRequested", comments);
        addNotificationForUser(req.employeeId, "More information has been requested for your request #" # requestId.toText() # ".");
      };
    };
  };

  // ── Audit Logs ────────────────────────────────────────────────────────────

  /// Manually add an audit log entry. Admin-only.
  public shared ({ caller }) func addAuditLog(requestId : Nat, action : Text, notes : ?Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can manually add audit log entries");
    };
    appendAuditLog(requestId, caller, action, notes);
  };

  /// List all audit logs. Admin-only (used in Reports & Export page).
  public query ({ caller }) func listAuditLogs() : async [AuditLog] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view audit logs");
    };
    auditLogs.values().toArray();
  };

  /// Get audit logs for a specific request. Requires #user role; non-admins can only view logs for their own requests.
  public query ({ caller }) func getAuditLogsForRequest(requestId : Nat) : async [AuditLog] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view audit logs");
    };
    // Non-admins may only view logs for their own requests
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (requests.get(requestId)) {
        case (null) { Runtime.trap("Request not found") };
        case (?req) {
          if (req.employeeId != caller) {
            Runtime.trap("Unauthorized: Can only view audit logs for your own requests");
          };
        };
      };
    };
    auditLogs.values().toArray().filter(func(l : AuditLog) : Bool { l.requestId == requestId });
  };

  // ── Notifications ─────────────────────────────────────────────────────────

  /// Get notifications for a user. Users can only fetch their own; admins can fetch any.
  public query ({ caller }) func getNotifications(userId : Principal) : async [Notification] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own notifications");
    };
    let userNotifications = switch (notifications.get(userId)) {
      case (null) { List.empty<Notification>() };
      case (?notifs) { notifs };
    };
    userNotifications.toArray();
  };

  /// Mark a notification as read. Users can only mark their own notifications.
  public shared ({ caller }) func markNotificationAsRead(userId : Principal, notificationId : Nat) : async () {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only mark your own notifications as read");
    };
    let userNotifications = switch (notifications.get(userId)) {
      case (null) { List.empty<Notification>() };
      case (?notifs) { notifs };
    };
    let updated = List.empty<Notification>();
    userNotifications.values().forEach(func(notif : Notification) {
      if (notif.id == notificationId) {
        updated.add({ notif with read = true });
      } else {
        updated.add(notif);
      };
    });
    notifications.add(userId, updated);
  };

  /// Get unread notification count. Users can only query their own count; admins can query any.
  public query ({ caller }) func getUnreadNotificationCount(userId : Principal) : async Nat {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own notification count");
    };
    let userNotifications = switch (notifications.get(userId)) {
      case (null) { List.empty<Notification>() };
      case (?notifs) { notifs };
    };
    var count = 0;
    userNotifications.forEach(func(n : Notification) { if (not n.read) { count += 1 } });
    count;
  };

  // ── SLA Rules (Admin only) ────────────────────────────────────────────────

  /// Set an SLA rule for a request category. Admin-only.
  public shared ({ caller }) func setSlaRule(category : Text, deadlineNanos : Int) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can configure SLA rules");
    };
    slaRules.add(category, { category; deadlineNanos });
  };

  /// List all SLA rules. Admin-only.
  public query ({ caller }) func listSlaRules() : async [SlaRule] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view SLA rules");
    };
    slaRules.values().toArray();
  };

  // ── Approval Chain Policies (Admin only) ─────────────────────────────────

  /// Add an approval chain policy. Admin-only.
  public shared ({ caller }) func addApprovalPolicy(requestType : Text, riskLevel : Text, requiredRoles : [Text]) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can configure approval policies");
    };
    let policyId = nextPolicyId;
    approvalPolicies.add(policyId, { requestType; riskLevel; requiredRoles });
    nextPolicyId += 1;
    policyId;
  };

  /// List all approval chain policies. Admin-only.
  public query ({ caller }) func listApprovalPolicies() : async [ApprovalPolicy] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view approval policies");
    };
    approvalPolicies.values().toArray();
  };

  // ── Notification Preferences (Admin or self) ──────────────────────────────

  /// Set notification preferences for a user. Users can set their own; admins can set any.
  public shared ({ caller }) func setNotificationPreference(userId : Principal, inAppEnabled : Bool) : async () {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only set your own notification preferences");
    };
    notificationPreferences.add(userId, { userId; inAppEnabled });
  };

  /// Get notification preferences for a user. Users can get their own; admins can get any.
  public query ({ caller }) func getNotificationPreference(userId : Principal) : async ?NotificationPreference {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own notification preferences");
    };
    notificationPreferences.get(userId);
  };
};

