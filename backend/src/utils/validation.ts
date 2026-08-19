// backend/src/utils/validation.ts
// Validation utilities using Zod

import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/); // E.164 format
export const colorHexSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
export const currencyCodeSchema = z.string().length(3).regex(/^[A-Z]{3}$/);
export const countryCodeSchema = z.string().length(2).regex(/^[A-Z]{2}$/);
export const languageCodeSchema = z.string().length(2).regex(/^[a-z]{2}$/);

// Asset tag validation
export const assetTagSchema = z.string()
  .min(1)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/, 'Asset tag must contain only uppercase letters, numbers, hyphens, and underscores');

// Serial number validation
export const serialNumberSchema = z.string().max(100).optional();

// Date validation
export const dateStringSchema = z.string().datetime({ offset: true });
export const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Sorting
export const sortSchema = z.object({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Filtering
export const filterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  category_id: z.string().uuid().optional(),
  site_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  custodian_user_id: z.string().uuid().optional(),
  custodian_group_id: z.string().uuid().optional(),
});

// Date range filter
export const dateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// Asset validation
export const assetCreateSchema = z.object({
  asset_tag: z.string().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/),
  serial_number: z.string().max(100).optional(),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  category_id: z.string().uuid().optional(),
  site_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  custodian_user_id: z.string().uuid().optional(),
  custodian_group_id: z.string().uuid().optional(),
  status: z.enum(['IN_STOCK', 'ASSIGNED', 'IN_REPAIR', 'ON_LOAN', 'RETIRED', 'DISPOSED']).default('IN_STOCK'),
  condition: z.string().max(50).default('Good'),
  purchase_date: z.string().datetime().optional(),
  purchase_cost: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  warranty_expires: z.string().datetime().optional(),
  vendor_id: z.string().uuid().optional(),
  custom_fields: z.record(z.unknown()).optional(),
});

export const assetUpdateSchema = z.object({
  asset_tag: z.string().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/).optional(),
  serial_number: z.string().max(100).optional().nullable(),
  make: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  site_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  custodian_user_id: z.string().uuid().optional().nullable(),
  custodian_group_id: z.string().uuid().optional().nullable(),
  status: z.enum(['IN_STOCK', 'ASSIGNED', 'IN_REPAIR', 'ON_LOAN', 'RETIRED', 'DISPOSED']).optional(),
  condition: z.string().max(50).optional().nullable(),
  purchase_date: z.string().datetime().optional().nullable(),
  purchase_cost: z.number().positive().optional().nullable(),
  currency: z.string().length(3).optional(),
  warranty_expires: z.string().datetime().optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  custom_fields: z.record(z.unknown()).optional(),
});

// User validation
export const userCreateSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().optional(),
  title: z.string().max(100).optional(),
  role: z.enum(['IT_ASSET_MANAGER', 'FIELD_TECHNICIAN', 'EMPLOYEE', 'AUDITOR', 'READ_ONLY']),
  group_ids: z.array(z.string().uuid()).optional(),
  department_id: z.string().uuid().optional(),
});

export const userUpdateSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  role: z.enum(['IT_ASSET_MANAGER', 'FIELD_TECHNICIAN', 'EMPLOYEE', 'AUDITOR', 'READ_ONLY']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  timezone: z.string().optional(),
  date_format: z.string().optional(),
  time_format: z.string().optional(),
  language: z.string().optional(),
  department_id: z.string().uuid().optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
  group_ids: z.array(z.string().uuid()).optional(),
});

// Site validation
export const siteCreateSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().length(2).default('US'),
  postal_code: z.string().max(20).optional(),
  timezone: z.string().default('UTC'),
  description: z.string().optional(),
});

export const siteUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().length(2).optional(),
  postal_code: z.string().max(20).optional().nullable(),
  timezone: z.string().optional(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

// Location validation
export const locationCreateSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional(),
});

export const locationUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
});

// Category validation
export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
  parent_id: z.string().uuid().optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
});

// Department validation
export const departmentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
  description: z.string().optional(),
  cost_center: z.string().max(50).optional(),
  manager_id: z.string().uuid().optional(),
});

export const departmentUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  cost_center: z.string().max(50).optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
});

// Custom field validation
export const customFieldCreateSchema = z.object({
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  type: z.enum(['text', 'number', 'date', 'boolean', 'select', 'multiselect', 'url', 'email', 'currency']),
  entity_type: z.enum(['asset', 'user', 'site', 'location', 'category', 'department']),
  category_id: z.string().uuid().optional(),
  options: z.array(z.string()).optional(),
  validation: z.record(z.unknown()).optional(),
  is_required: z.boolean().default(false),
  is_filterable: z.boolean().default(true),
  is_searchable: z.boolean().default(true),
  display_order: z.number().int().nonnegative().default(0),
});

export const customFieldUpdateSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  options: z.array(z.string()).optional(),
  validation: z.record(z.unknown()).optional(),
  is_required: z.boolean().optional(),
  is_filterable: z.boolean().optional(),
  is_searchable: z.boolean().optional(),
  display_order: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

// Maintenance validation
export const maintenanceCreateSchema = z.object({
  asset_id: z.string().uuid(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSPECTION']),
  priority: z.number().int().min(1).max(4).default(3),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  problem_description: z.string().optional(),
  technician_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_rule: z.string().optional(),
  condition_before: z.string().optional(),
  tasks: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    order: z.number().int().nonnegative().optional(),
  })).optional(),
  parts: z.array(z.object({
    part_name: z.string().min(1),
    part_number: z.string().optional(),
    quantity: z.number().int().positive().default(1),
    unit_cost: z.number().nonnegative().optional(),
    source: z.string().optional(),
  })).optional(),
});

export const maintenanceUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  problem_description: z.string().optional().nullable(),
  root_cause: z.string().optional().nullable(),
  resolution: z.string().optional().nullable(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSPECTION']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.number().int().min(1).max(4).optional(),
  technician_id: z.string().uuid().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  condition_before: z.string().optional().nullable(),
  condition_after: z.string().optional().nullable(),
  labor_hours: z.number().nonnegative().optional().nullable(),
  labor_rate: z.number().nonnegative().optional().nullable(),
  parts_cost: z.number().nonnegative().optional().nullable(),
  downtime_hours: z.number().nonnegative().optional().nullable(),
});

export const maintenanceCompleteSchema = z.object({
  condition_after: z.enum(['SERVICEABLE', 'NEEDS_REPLACEMENT', 'RETIRE']),
  resolution: z.string().min(1),
  labor_hours: z.number().nonnegative().optional(),
  parts_cost: z.number().nonnegative().optional(),
  downtime_hours: z.number().nonnegative().optional(),
});

// Audit validation
export const auditCreateSchema = z.object({
  name: z.string().min(1).max(200),
  scope_type: z.enum(['site', 'location', 'department', 'category', 'custom']),
  scope_id: z.string().uuid().optional(),
  scope_name: z.string().optional(),
  start_at: z.string().datetime().optional(),
  due_at: z.string().datetime().optional(),
  timezone: z.string().default('UTC'),
  lead_auditor_id: z.string().uuid().optional(),
  auditor_ids: z.array(z.string().uuid()).optional(),
  require_signature: z.boolean().default(false),
  require_photo: z.boolean().default(false),
  offline_enabled: z.boolean().default(true),
});

export const auditScanSchema = z.object({
  asset_tag: z.string().min(1),
  location_id: z.string().uuid().optional(),
  status: z.enum(['FOUND', 'MISSING', 'MISMATCHED', 'DAMAGED']).default('FOUND'),
  notes: z.string().optional(),
  photo_base64: z.string().optional(),
});

export const auditReconcileSchema = z.object({
  action: z.enum(['confirm_match', 'update_location', 'mark_missing', 'mark_damaged', 'ignore']),
  location_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// Report validation
export const reportCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.literal('custom'),
  query: z.object({
    resource: z.string(),
    fields: z.array(z.string()),
    filters: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.unknown(),
    })).optional(),
    group_by: z.array(z.string()).optional(),
    order_by: z.array(z.object({
      field: z.string(),
      direction: z.enum(['asc', 'desc']),
    })).optional(),
    limit: z.number().int().positive().optional(),
  }),
  visualization: z.object({
    type: z.enum(['table', 'bar', 'line', 'pie', 'area', 'number', 'pivot']),
    config: z.unknown().optional(),
  }).optional(),
});

export const reportScheduleSchema = z.object({
  cron: z.string(),
  timezone: z.string().default('UTC'),
  format: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })),
  enabled: z.boolean().default(true),
});

// Webhook validation
export const webhookCreateSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.enum([
    'asset.created', 'asset.updated', 'asset.deleted',
    'asset.checked_out', 'asset.checked_in',
    'maintenance.started', 'maintenance.completed', 'maintenance.overdue',
    'audit.session_started', 'audit.session_completed', 'audit.discrepancy_found',
    'user.invited', 'user.activated', 'user.role_changed',
    'contract.expiring', 'contract.renewed',
    'warranty.expiring', 'warranty.expired',
    'agent.online', 'agent.offline',
  ])).min(1),
  secret: z.string().optional(),
  retry_policy: z.object({
    max_attempts: z.number().int().positive().max(10).default(5),
    backoff_type: z.enum(['fixed', 'exponential']).default('exponential'),
    delay_ms: z.number().int().positive().default(5000),
    timeout_ms: z.number().int().positive().default(30000),
  }).optional(),
});

export const webhookUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.enum([
    'asset.created', 'asset.updated', 'asset.deleted',
    'asset.checked_out', 'asset.checked_in',
    'maintenance.started', 'maintenance.completed', 'maintenance.overdue',
    'audit.session_started', 'audit.session_completed', 'audit.discrepancy_found',
    'user.invited', 'user.activated', 'user.role_changed',
    'contract.expiring', 'contract.renewed',
    'warranty.expiring', 'warranty.expired',
    'agent.online', 'agent.offline',
  ])).optional(),
  secret: z.string().optional(),
  is_active: z.boolean().optional(),
  retry_policy: z.object({
    max_attempts: z.number().int().positive().max(10).default(5),
    backoff_type: z.enum(['fixed', 'exponential']).default('exponential'),
    delay_ms: z.number().int().positive().default(5000),
    timeout_ms: z.number().int().positive().default(30000),
  }).optional(),
});

// Notification validation
export const notificationPreferencesSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  in_app: z.boolean().optional(),
  push: z.boolean().optional(),
  channels: z.record(z.boolean()).optional(),
});

export const testNotificationSchema = z.object({
  channel: z.enum(['EMAIL', 'SMS', 'IN_APP', 'WEBHOOK']),
  type: z.string(),
  recipient: z.string().optional(),
});

// Settings validation
export const settingsSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  scope: z.enum(['tenant', 'user', 'system']).default('tenant'),
  description: z.string().optional(),
});

export const tenantSettingsSchema = z.object({
  asset_tag_prefix: z.string().max(10).optional(),
  asset_tag_format: z.string().optional(),
  password_min_length: z.number().int().min(8).max(64).optional(),
  password_require_upper: z.boolean().optional(),
  password_require_lower: z.boolean().optional(),
  password_require_number: z.boolean().optional(),
  password_require_symbol: z.boolean().optional(),
  password_max_age_days: z.number().int().positive().optional(),
  password_history_count: z.number().int().nonnegative().optional(),
  mfa_required_for_admins: z.boolean().optional(),
  mfa_required_for_all: z.boolean().optional(),
  mfa_methods: z.array(z.enum(['totp', 'passkey', 'sms'])).optional(),
  session_absolute_timeout_minutes: z.number().int().positive().optional(),
  session_idle_timeout_minutes: z.number().int().positive().optional(),
  concurrent_sessions: z.number().int().positive().optional(),
  ip_allowlist_enabled: z.boolean().optional(),
  ip_allowlist_cidrs: z.array(z.string()).optional(),
  sso_enabled: z.boolean().optional(),
  sso_provider: z.enum(['azure-ad', 'okta', 'google', 'custom']).optional(),
  sso_entity_id: z.string().optional(),
  sso_sso_url: z.string().optional(),
  sso_slo_url: z.string().optional(),
  sso_certificate: z.string().optional(),
  sso_attribute_mapping: z.unknown().optional(),
  sso_jit_provisioning: z.boolean().optional(),
  audit_log_retention_days: z.number().int().positive().optional(),
  asset_history_retention_days: z.number().int().positive().optional(),
  deleted_user_retention_days: z.number().int().positive().optional(),
  export_retention_days: z.number().int().positive().optional(),
  backup_retention_days: z.number().int().positive().optional(),
});

// Export all schemas
export const validationSchemas = {
  uuid: uuidSchema,
  email: emailSchema,
  url: urlSchema,
  phone: phoneSchema,
  colorHex: colorHexSchema,
  currencyCode: currencyCodeSchema,
  countryCode: countryCodeSchema,
  languageCode: languageCodeSchema,
  assetTag: assetTagSchema,
  serialNumber: serialNumberSchema,
  dateString: dateStringSchema,
  dateOnly: dateOnlySchema,
  pagination: paginationSchema,
  sort: sortSchema,
  filter: filterSchema,
  dateRange: dateRangeSchema,
  assetCreate: assetCreateSchema,
  assetUpdate: assetUpdateSchema,
  userCreate: userCreateSchema,
  userUpdate: userUpdateSchema,
  siteCreate: siteCreateSchema,
  siteUpdate: siteUpdateSchema,
  locationCreate: locationCreateSchema,
  locationUpdate: locationUpdateSchema,
  categoryCreate: categoryCreateSchema,
  categoryUpdate: categoryUpdateSchema,
  departmentCreate: departmentCreateSchema,
  departmentUpdate: departmentUpdateSchema,
  customFieldCreate: customFieldCreateSchema,
  customFieldUpdate: customFieldUpdateSchema,
  maintenanceCreate: maintenanceCreateSchema,
  maintenanceUpdate: maintenanceUpdateSchema,
  maintenanceComplete: maintenanceCompleteSchema,
  auditCreate: auditCreateSchema,
  auditScan: auditScanSchema,
  auditReconcile: auditReconcileSchema,
  reportCreate: reportCreateSchema,
  reportSchedule: reportScheduleSchema,
  webhookCreate: webhookCreateSchema,
  webhookUpdate: webhookUpdateSchema,
  notificationPreferences: notificationPreferencesSchema,
  testNotification: testNotificationSchema,
  settings: settingsSchema,
  tenantSettings: tenantSettingsSchema,
};