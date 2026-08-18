// frontend/src/types/api.ts
// API types for Asset Maintenance Tool

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiError {
  error: string;
  code: string;
  details?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  timezone: string;
  currency: string;
  date_format: string;
  time_format: string;
  plan: string;
  max_assets: number;
  max_users: number;
  max_storage_gb: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  title?: string;
  avatar_url?: string;
  timezone: string;
  date_format: string;
  time_format: string;
  language: string;
  role: UserRole;
  status: UserStatus;
  mfa_enabled: boolean;
  last_login_at?: string;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'TENANT_ADMIN' 
  | 'IT_ASSET_MANAGER' 
  | 'FIELD_TECHNICIAN' 
  | 'EMPLOYEE' 
  | 'AUDITOR' 
  | 'READ_ONLY';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED';

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, any>;
  expires_at: string;
  created_at: string;
  last_used_at: string;
  revoked_at?: string;
}

export interface UserGroup {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface UserGroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  joined_at: string;
}

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  owner_id?: string;
  last_used_at?: string;
  expires_at?: string;
  revoked_at?: string;
  created_at: string;
}

export interface Site {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  timezone: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    locations: number;
    assets: number;
  };
}

export interface Location {
  id: string;
  tenant_id: string;
  site_id: string;
  site?: Site;
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
  parent?: Location;
  children?: Location[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    assets: number;
  };
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  parent?: Category;
  children?: Category[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    children: number;
    assets: number;
    custom_fields: number;
  };
}

export interface Department {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  cost_center?: string;
  manager_id?: string;
  manager?: User;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    assets: number;
    users: number;
  };
}

export interface CustomField {
  id: string;
  tenant_id: string;
  name: string;
  label: string;
  type: CustomFieldType;
  entity_type: string;
  category_id?: string;
  category?: Category;
  options?: string[];
  validation?: Record<string, any>;
  is_required: boolean;
  is_filterable: boolean;
  is_searchable: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CustomFieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'select' 
  | 'multiselect' 
  | 'url' 
  | 'email' 
  | 'currency';

export interface AssetCustomFieldValue {
  id: string;
  asset_id: string;
  custom_field_id: string;
  custom_field?: CustomField;
  value_text?: string;
  value_number?: number;
  value_boolean?: boolean;
  value_date?: string;
  value_json?: any;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  tenant_id: string;
  asset_tag: string;
  normalized_tag: string;
  serial_number?: string;
  qr_code_data?: string;
  barcode_data?: string;
  make?: string;
  model?: string;
  category_id?: string;
  category?: Category;
  site_id?: string;
  site?: Site;
  location_id?: string;
  location?: Location;
  department_id?: string;
  department?: Department;
  custodian_user_id?: string;
  custodian_user?: User;
  custodian_group_id?: string;
  custodian_group?: UserGroup;
  status: AssetStatus;
  condition?: string;
  purchase_date?: string;
  purchase_cost?: number;
  currency: string;
  warranty_expires?: string;
  vendor_id?: string;
  vendor?: Vendor;
  asset_tag_counter: number;
  created_by_id: string;
  created_by?: User;
  updated_by_id?: string;
  updated_by?: User;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  images?: AssetImage[];
  documents?: Document[];
  custom_fields?: AssetCustomFieldValue[];
  tags?: AssetTag[];
}

export type AssetStatus = 
  | 'IN_STOCK' 
  | 'ASSIGNED' 
  | 'IN_REPAIR' 
  | 'ON_LOAN' 
  | 'RETIRED' 
  | 'DISPOSED';

export interface AssetTag {
  id: string;
  asset_id: string;
  tag: string;
  created_at: string;
  created_by?: string;
}

export interface AssetImage {
  id: string;
  asset_id: string;
  url: string;
  filename: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  is_primary: boolean;
  caption?: string;
  created_at: string;
  created_by?: string;
}

export interface Document {
  id: string;
  asset_id?: string;
  tenant_id: string;
  filename: string;
  mime_type: string;
  size: number;
  url: string;
  sha256: string;
  title?: string;
  description?: string;
  tags: string[];
  uploaded_by: string;
  uploaded_at: string;
  scanned: boolean;
  scan_result?: string;
}

export interface Vendor {
  id: string;
  tenant_id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetEvent {
  id: string;
  asset_id: string;
  tenant_id: string;
  event_type: AssetEventType;
  description?: string;
  metadata?: Record<string, any>;
  performed_by_id: string;
  performed_by?: User;
  occurred_at: string;
  created_at: string;
}

export type AssetEventType = 
  | 'CHECK_OUT' 
  | 'CHECK_IN' 
  | 'MAINTENANCE_START' 
  | 'MAINTENANCE_COMPLETE' 
  | 'RESERVE' 
  | 'LEASE' 
  | 'LEASE_RETURN' 
  | 'MOVE' 
  | 'DISPOSE' 
  | 'RETIRE' 
  | 'TAG_CHANGE' 
  | 'CUSTODIAN_CHANGE' 
  | 'STATUS_CHANGE';

export interface MaintenanceWorkOrder {
  id: string;
  tenant_id: string;
  wo_number: string;
  asset_id: string;
  asset?: Asset;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: number;
  title: string;
  description?: string;
  problem_description?: string;
  root_cause?: string;
  resolution?: string;
  technician_id?: string;
  technician?: User;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
  due_date?: string;
  labor_hours?: number;
  labor_rate?: number;
  parts_cost?: number;
  total_cost?: number;
  downtime_hours?: number;
  condition_before?: string;
  condition_after?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  parent_wo_id?: string;
  parent_wo?: MaintenanceWorkOrder;
  child_wos?: MaintenanceWorkOrder[];
  created_by_id: string;
  created_by?: User;
  assigned_by_id?: string;
  assigned_by?: User;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  tasks?: MaintenanceTask[];
  parts?: MaintenancePart[];
  labor_entries?: MaintenanceLabor[];
  attachments?: MaintenanceAttachment[];
  notes?: MaintenanceNote[];
  history?: MaintenanceHistory[];
}

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION' | 'INSPECTION';

export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface MaintenanceTask {
  id: string;
  wo_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface MaintenancePart {
  id: string;
  wo_id: string;
  part_name: string;
  part_number?: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceLabor {
  id: string;
  wo_id: string;
  technician_id: string;
  technician?: User;
  date: string;
  hours: number;
  rate?: number;
  description?: string;
  created_at: string;
}

export interface MaintenanceAttachment {
  id: string;
  wo_id: string;
  url: string;
  filename: string;
  mime_type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
}

export interface MaintenanceNote {
  id: string;
  wo_id: string;
  author_id: string;
  author?: User;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceHistory {
  id: string;
  wo_id: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  changed_by_id: string;
  changed_by?: User;
  changed_at: string;
}

export interface Reservation {
  id: string;
  tenant_id: string;
  asset_id: string;
  asset?: Asset;
  requester_id: string;
  requester?: User;
  approver_id?: string;
  approver?: User;
  start_at: string;
  end_at: string;
  purpose?: string;
  status: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditSession {
  id: string;
  tenant_id: string;
  name: string;
  scope_type: string;
  scope_id?: string;
  scope_name?: string;
  status: AuditStatus;
  start_at?: string;
  end_at?: string;
  due_at?: string;
  timezone: string;
  total_assets: number;
  scanned_count: number;
  found_count: number;
  missing_count: number;
  mismatched_count: number;
  damaged_count: number;
  lead_auditor_id?: string;
  lead_auditor?: User;
  auditors?: User[];
  notify_assignees: boolean;
  require_signature: boolean;
  require_photo: boolean;
  offline_enabled: boolean;
  created_by_id: string;
  created_by?: User;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  items?: AuditSessionItem[];
  discrepancies?: AuditDiscrepancy[];
}

export type AuditStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface AuditSessionItem {
  id: string;
  session_id: string;
  asset_id: string;
  asset?: Asset;
  expected_location_id?: string;
  expected_location?: Location;
  scanned_location_id?: string;
  scanned_location?: Location;
  status: AuditItemStatus;
  scanned_at?: string;
  scanned_by_id?: string;
  scanned_by?: User;
  notes?: string;
  photo_url?: string;
  signature_url?: string;
  discrepancy_id?: string;
  discrepancy?: AuditDiscrepancy;
  created_at: string;
  updated_at: string;
}

export type AuditItemStatus = 'FOUND' | 'MISSING' | 'MISMATCHED' | 'DAMAGED';

export interface AuditDiscrepancy {
  id: string;
  session_id: string;
  asset_id: string;
  asset?: Asset;
  type: string;
  expected_location_id?: string;
  expected_location?: Location;
  found_location_id?: string;
  found_location?: Location;
  severity: string;
  status: string;
  suggested_match_id?: string;
  suggested_match?: Asset;
  resolution?: string;
  resolved_by_id?: string;
  resolved_by?: User;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  tenant_id: string;
  name: string;
  contract_number: string;
  type: string;
  status: ContractStatus;
  vendor_id?: string;
  vendor?: Vendor;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  value?: number;
  currency: string;
  billing_cycle?: string;
  auto_renew: boolean;
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  notice_period_days: number;
  terms?: string;
  sla_terms?: string;
  owner_id?: string;
  owner?: User;
  created_by_id: string;
  created_by?: User;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  assets?: Asset[];
  reminders?: ContractReminder[];
}

export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING_RENEWAL' | 'TERMINATED';

export interface ContractReminder {
  id: string;
  contract_id: string;
  type: string;
  trigger_at: string;
  sent_at?: string;
  recipient_ids: string[];
  channel: NotificationChannel;
  status: string;
  created_at: string;
}

export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'WEBHOOK' | 'SLACK' | 'TEAMS';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id?: string;
  user?: User;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channel: NotificationChannel;
  status: string;
  read_at?: string;
  related_type?: string;
  related_id?: string;
  created_at: string;
}

export interface Webhook {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  retry_policy?: Record<string, any>;
  timeout_ms: number;
  last_triggered?: string;
  last_status?: string;
  created_by_id: string;
  created_by?: User;
  created_at: string;
  updated_at: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhook_id: string;
  event: string;
  payload: Record<string, any>;
  status_code?: number;
  response_body?: string;
  latency_ms: number;
  attempt: number;
  error?: string;
  created_at: string;
}

export interface AgentEnrollment {
  id: string;
  tenant_id: string;
  asset_id?: string;
  asset?: Asset;
  enrollment_token: string;
  hostname?: string;
  os?: string;
  os_version?: string;
  agent_version?: string;
  status: string;
  last_seen?: string;
  last_ip?: string;
  enrolled_at: string;
  enrolled_by_id?: string;
  enrolled_by?: User;
  revoked_at?: string;
  revoked_by_id?: string;
  revoked_by?: User;
  sync_interval_seconds: number;
  data_categories: string[];
  privacy_mode: boolean;
  auto_update: boolean;
  heartbeats?: AgentHeartbeat[];
  software?: AgentSoftware[];
}

export interface AgentHeartbeat {
  id: string;
  enrollment_id: string;
  received_at: string;
  ip_address?: string;
  data?: Record<string, any>;
}

export interface AgentSoftware {
  id: string;
  enrollment_id: string;
  name: string;
  version?: string;
  publisher?: string;
  install_date?: string;
  install_path?: string;
  size?: number;
  usage_percent?: number;
  last_used?: string;
  category?: string;
  is_authorized: boolean;
  detected_at: string;
  last_seen: string;
}

export interface Setting {
  id: string;
  tenant_id: string;
  key: string;
  value: any;
  scope: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id?: string;
  user?: User;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  hash: string;
  previous_hash?: string;
  created_at: string;
}

export interface Report {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: string;
  query: Record<string, any>;
  visualization?: Record<string, any>;
  schedule?: Record<string, any>;
  created_by_id: string;
  created_by?: User;
  last_run?: string;
  last_run_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportSchedule {
  id: string;
  report_id: string;
  tenant_id: string;
  cron: string;
  timezone: string;
  format: string;
  recipients: Array<{ email: string; name?: string }>;
  enabled: boolean;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

// Query parameter types
export interface AssetFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  status?: string;
  category_id?: string;
  site_id?: string;
  location_id?: string;
  department_id?: string;
  custodian_user_id?: string;
  custodian_group_id?: string;
  warranty_expiring_days?: number;
  created_after?: string;
  created_before?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  group_id?: string;
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  status?: string;
  scope_type?: string;
  start_after?: string;
  start_before?: string;
}

export interface MaintenanceFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  technician_id?: string;
  asset_id?: string;
  priority?: number;
  overdue?: boolean;
}

export interface ContractFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  vendor_id?: string;
  expiring_within_days?: number;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  status?: 'UNREAD' | 'READ' | 'ARCHIVED';
  type?: string;
}

export interface WebhookFilters {
  page?: number;
  limit?: number;
  status?: string;
}

// Mutation input types
export interface CreateAssetInput {
  asset_tag: string;
  serial_number?: string;
  make?: string;
  model?: string;
  category_id?: string;
  site_id?: string;
  location_id?: string;
  department_id?: string;
  custodian_user_id?: string;
  custodian_group_id?: string;
  status?: AssetStatus;
  condition?: string;
  purchase_date?: string;
  purchase_cost?: number;
  currency?: string;
  warranty_expires?: string;
  vendor_id?: string;
  custom_fields?: Record<string, any>;
}

export interface UpdateAssetInput {
  asset_tag?: string;
  serial_number?: string | null;
  make?: string | null;
  model?: string | null;
  category_id?: string | null;
  site_id?: string | null;
  location_id?: string | null;
  department_id?: string | null;
  custodian_user_id?: string | null;
  custodian_group_id?: string | null;
  status?: AssetStatus;
  condition?: string | null;
  purchase_date?: string | null;
  purchase_cost?: number | null;
  currency?: string;
  warranty_expires?: string | null;
  vendor_id?: string | null;
  custom_fields?: Record<string, any>;
}

export interface CreateUserInput {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  title?: string;
  group_ids?: string[];
  department_id?: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  title?: string | null;
  role?: UserRole;
  status?: UserStatus;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  language?: string;
  department_id?: string | null;
  manager_id?: string | null;
  group_ids?: string[];
}

export interface CreateSiteInput {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  timezone?: string;
  description?: string;
}

export interface CreateLocationInput {
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
}

export interface CreateCategoryInput {
  name: string;
  code: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
  cost_center?: string;
  manager_id?: string;
}

export interface CreateMaintenanceInput {
  asset_id: string;
  type: MaintenanceType;
  priority?: number;
  title: string;
  description?: string;
  problem_description?: string;
  technician_id?: string;
  due_date?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  condition_before?: string;
  tasks?: Array<{ title: string; description?: string; order?: number }>;
  parts?: Array<{ part_name: string; part_number?: string; quantity?: number; unit_cost?: number; source?: string }>;
}

export interface CreateAuditInput {
  name: string;
  scope_type: 'site' | 'location' | 'department' | 'category' | 'custom';
  scope_id?: string;
  scope_name?: string;
  start_at?: string;
  due_at?: string;
  timezone?: string;
  lead_auditor_id?: string;
  auditor_ids?: string[];
  require_signature?: boolean;
  require_photo?: boolean;
  offline_enabled?: boolean;
}

export interface CreateContractInput {
  name: string;
  contract_number: string;
  type: string;
  status?: ContractStatus;
  vendor_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  value?: number;
  currency?: string;
  billing_cycle?: string;
  auto_renew?: boolean;
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  notice_period_days?: number;
  terms?: string;
  sla_terms?: string;
  owner_id?: string;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  retry_policy?: {
    max_attempts?: number;
    backoff_type?: 'fixed' | 'exponential';
    delay_ms?: number;
    timeout_ms?: number;
  };
}

export interface CreateAgentInput {
  asset_id?: string;
  hostname?: string;
  os?: 'windows' | 'macos' | 'linux';
  sync_interval_seconds?: number;
  data_categories?: string[];
  privacy_mode?: boolean;
  auto_update?: boolean;
}

export interface AuditScanInput {
  asset_tag: string;
  location_id?: string;
  status?: 'FOUND' | 'MISSING' | 'MISMATCHED' | 'DAMAGED';
  notes?: string;
  photo_base64?: string;
}

export interface AuditReconcileInput {
  action: 'confirm_match' | 'update_location' | 'mark_missing' | 'mark_damaged' | 'ignore';
  location_id?: string;
  notes?: string;
}

export interface BulkAssetOperationInput {
  action: 'delete' | 'update_status' | 'assign_custodian' | 'assign_location' | 'export';
  asset_ids: string[];
  data?: {
    status?: AssetStatus;
    custodian_user_id?: string;
    custodian_group_id?: string;
    site_id?: string;
    location_id?: string;
  };
}

export interface ImportPreviewInput {
  file: string; // base64
  format: 'csv' | 'json';
}

export interface ImportCommitInput {
  rows: Array<{
    asset_tag: string;
    make?: string;
    model?: string;
    serial_number?: string;
    category?: string;
    site?: string;
    location?: string;
    status?: string;
  }>;
  idempotency_key: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  tenant_name?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  language?: string;
}

export interface MfaSetupInput {
  method: 'totp' | 'passkey';
}

export interface MfaVerifyInput {
  code: string;
  backupCode?: string;
}