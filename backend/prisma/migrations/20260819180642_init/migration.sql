-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'IT_ASSET_MANAGER', 'FIELD_TECHNICIAN', 'EMPLOYEE', 'AUDITOR', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('IN_STOCK', 'ASSIGNED', 'IN_REPAIR', 'ON_LOAN', 'RETIRED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AssetEventType" AS ENUM ('CHECK_OUT', 'CHECK_IN', 'MAINTENANCE_START', 'MAINTENANCE_COMPLETE', 'RESERVE', 'LEASE', 'LEASE_RETURN', 'MOVE', 'DISPOSE', 'RETIRE', 'TAG_CHANGE', 'CUSTODIAN_CHANGE', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSPECTION');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "AuditItemStatus" AS ENUM ('FOUND', 'MISSING', 'MISMATCHED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'TERMINATED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP', 'WEBHOOK', 'SLACK', 'TEAMS');

-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM ('ASSET_CREATED', 'ASSET_UPDATED', 'ASSET_DELETED', 'ASSET_CHECKED_OUT', 'ASSET_CHECKED_IN', 'MAINTENANCE_STARTED', 'MAINTENANCE_COMPLETED', 'AUDIT_COMPLETED', 'WARRANTY_EXPIRING', 'AGENT_OFFLINE');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logo_url" TEXT,
    "primary_color" TEXT DEFAULT '#2563EB',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "date_format" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "time_format" TEXT NOT NULL DEFAULT '12h',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "max_assets" INTEGER NOT NULL DEFAULT 1000,
    "max_users" INTEGER NOT NULL DEFAULT 50,
    "max_storage_gb" INTEGER NOT NULL DEFAULT 10,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT,
    "avatar_url" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "date_format" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "time_format" TEXT NOT NULL DEFAULT '12h',
    "language" TEXT NOT NULL DEFAULT 'en',
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_login_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "invited_by" TEXT,
    "invited_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_info" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#6366F1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroupMember" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "owner_id" TEXT,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_by" TEXT,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'US',
    "postal_code" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "icon" TEXT DEFAULT 'box',
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "cost_center" TEXT,
    "manager_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "category_id" TEXT,
    "options" JSONB,
    "validation" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_filterable" BOOLEAN NOT NULL DEFAULT true,
    "is_searchable" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCustomFieldValue" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "custom_field_id" TEXT NOT NULL,
    "value_text" TEXT,
    "value_number" DOUBLE PRECISION,
    "value_boolean" BOOLEAN,
    "value_date" TIMESTAMP(3),
    "value_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetCustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_tag" TEXT NOT NULL,
    "normalized_tag" TEXT NOT NULL,
    "serial_number" TEXT,
    "qr_code_data" TEXT,
    "barcode_data" TEXT,
    "make" TEXT,
    "model" TEXT,
    "category_id" TEXT,
    "site_id" TEXT,
    "location_id" TEXT,
    "department_id" TEXT,
    "custodian_user_id" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'IN_STOCK',
    "condition" TEXT DEFAULT 'Good',
    "purchase_date" TIMESTAMP(3),
    "purchase_cost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "warranty_expires" TIMESTAMP(3),
    "vendor_id" TEXT,
    "asset_tag_counter" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTag" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "AssetTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetImage" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "AssetImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT,
    "tenant_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanned" BOOLEAN NOT NULL DEFAULT false,
    "scan_result" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetEvent" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" "AssetEventType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "performed_by_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceWorkOrder" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "wo_number" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "problem_description" TEXT,
    "root_cause" TEXT,
    "resolution" TEXT,
    "technician_id" TEXT,
    "assigned_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "labor_hours" DECIMAL(6,2),
    "labor_rate" DECIMAL(10,2),
    "parts_cost" DECIMAL(12,2),
    "total_cost" DECIMAL(12,2),
    "downtime_hours" DECIMAL(6,2),
    "condition_before" TEXT,
    "condition_after" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" TEXT,
    "parent_wo_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "assigned_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "MaintenanceWorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTask" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePart" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "part_name" TEXT NOT NULL,
    "part_number" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_cost" DECIMAL(10,2),
    "total_cost" DECIMAL(10,2),
    "source" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenancePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceLabor" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hours" DECIMAL(4,2) NOT NULL,
    "rate" DECIMAL(10,2),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceLabor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceAttachment" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceNote" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceHistory" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by_id" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "approver_id" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditSession" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT,
    "scope_name" TEXT,
    "status" "AuditStatus" NOT NULL DEFAULT 'SCHEDULED',
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "lead_auditor_id" TEXT,
    "total_assets" INTEGER NOT NULL DEFAULT 0,
    "scanned_count" INTEGER NOT NULL DEFAULT 0,
    "found_count" INTEGER NOT NULL DEFAULT 0,
    "missing_count" INTEGER NOT NULL DEFAULT 0,
    "mismatched_count" INTEGER NOT NULL DEFAULT 0,
    "damaged_count" INTEGER NOT NULL DEFAULT 0,
    "notify_assignees" BOOLEAN NOT NULL DEFAULT true,
    "require_signature" BOOLEAN NOT NULL DEFAULT false,
    "require_photo" BOOLEAN NOT NULL DEFAULT false,
    "offline_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "AuditSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditSessionItem" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "expected_location_id" TEXT,
    "scanned_location_id" TEXT,
    "status" "AuditItemStatus" NOT NULL DEFAULT 'MISSING',
    "scanned_at" TIMESTAMP(3),
    "scanned_by_id" TEXT,
    "notes" TEXT,
    "photo_url" TEXT,
    "signature_url" TEXT,
    "discrepancy_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditSessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditDiscrepancy" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "suggested_match_id" TEXT,
    "resolution" TEXT,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditDiscrepancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "vendor_id" TEXT,
    "value" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billing_cycle" TEXT,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "renewal_date" TIMESTAMP(3),
    "notice_period_days" INTEGER NOT NULL DEFAULT 30,
    "terms" TEXT,
    "sla_terms" TEXT,
    "owner_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractReminder" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "trigger_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "recipient_ids" TEXT[],
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "read_at" TIMESTAMP(3),
    "related_type" TEXT,
    "related_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "retry_policy" JSONB,
    "timeout_ms" INTEGER NOT NULL DEFAULT 30000,
    "last_triggered" TIMESTAMP(3),
    "last_status" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDeliveryLog" (
    "id" TEXT NOT NULL,
    "webhook_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status_code" INTEGER,
    "response_body" TEXT,
    "latency_ms" INTEGER NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentEnrollment" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "enrollment_token" TEXT NOT NULL,
    "hostname" TEXT,
    "os" TEXT,
    "os_version" TEXT,
    "agent_version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "last_seen" TIMESTAMP(3),
    "last_ip" TEXT,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrolled_by_id" TEXT,
    "revoked_at" TIMESTAMP(3),
    "revoked_by_id" TEXT,
    "sync_interval_seconds" INTEGER NOT NULL DEFAULT 900,
    "data_categories" TEXT[] DEFAULT ARRAY['hardware', 'software', 'network', 'security']::TEXT[],
    "privacy_mode" BOOLEAN NOT NULL DEFAULT true,
    "auto_update" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AgentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentHeartbeat" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "data" JSONB,

    CONSTRAINT "AgentHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSoftware" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "publisher" TEXT,
    "install_date" TIMESTAMP(3),
    "install_path" TEXT,
    "size" BIGINT,
    "usage_percent" DOUBLE PRECISION,
    "last_used" TIMESTAMP(3),
    "category" TEXT,
    "is_authorized" BOOLEAN NOT NULL DEFAULT true,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentSoftware_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'tenant',
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "previous_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_domain_idx" ON "Tenant"("domain");

-- CreateIndex
CREATE INDEX "User_tenant_id_status_idx" ON "User"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "User_tenant_id_role_idx" ON "User"("tenant_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenant_id_email_key" ON "User"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_hash_key" ON "Session"("token_hash");

-- CreateIndex
CREATE INDEX "Session_user_id_expires_at_idx" ON "Session"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "Session_token_hash_idx" ON "Session"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_tenant_id_name_key" ON "UserGroup"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroupMember_user_id_group_id_key" ON "UserGroupMember"("user_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_hash_key" ON "ApiKey"("key_hash");

-- CreateIndex
CREATE INDEX "ApiKey_tenant_id_idx" ON "ApiKey"("tenant_id");

-- CreateIndex
CREATE INDEX "ApiKey_key_hash_idx" ON "ApiKey"("key_hash");

-- CreateIndex
CREATE INDEX "Site_tenant_id_is_active_idx" ON "Site"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "Site_tenant_id_code_key" ON "Site"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "Location_tenant_id_site_id_idx" ON "Location"("tenant_id", "site_id");

-- CreateIndex
CREATE INDEX "Location_parent_id_idx" ON "Location"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "Location_tenant_id_site_id_code_key" ON "Location"("tenant_id", "site_id", "code");

-- CreateIndex
CREATE INDEX "Category_tenant_id_parent_id_idx" ON "Category"("tenant_id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "Category_tenant_id_code_key" ON "Category"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "Department_tenant_id_idx" ON "Department"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "Department_tenant_id_code_key" ON "Department"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "CustomField_tenant_id_entity_type_idx" ON "CustomField"("tenant_id", "entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_tenant_id_entity_type_name_key" ON "CustomField"("tenant_id", "entity_type", "name");

-- CreateIndex
CREATE INDEX "AssetCustomFieldValue_asset_id_idx" ON "AssetCustomFieldValue"("asset_id");

-- CreateIndex
CREATE INDEX "AssetCustomFieldValue_custom_field_id_idx" ON "AssetCustomFieldValue"("custom_field_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCustomFieldValue_asset_id_custom_field_id_key" ON "AssetCustomFieldValue"("asset_id", "custom_field_id");

-- CreateIndex
CREATE INDEX "Asset_tenant_id_status_idx" ON "Asset"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "Asset_tenant_id_site_id_idx" ON "Asset"("tenant_id", "site_id");

-- CreateIndex
CREATE INDEX "Asset_tenant_id_location_id_idx" ON "Asset"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "Asset_tenant_id_category_id_idx" ON "Asset"("tenant_id", "category_id");

-- CreateIndex
CREATE INDEX "Asset_tenant_id_custodian_user_id_idx" ON "Asset"("tenant_id", "custodian_user_id");

-- CreateIndex
CREATE INDEX "Asset_tenant_id_serial_number_idx" ON "Asset"("tenant_id", "serial_number");

-- CreateIndex
CREATE INDEX "Asset_tenant_id_created_at_idx" ON "Asset"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "Asset_tenant_id_deleted_at_idx" ON "Asset"("tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_tenant_id_normalized_tag_key" ON "Asset"("tenant_id", "normalized_tag");

-- CreateIndex
CREATE INDEX "AssetTag_tag_idx" ON "AssetTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "AssetTag_asset_id_tag_key" ON "AssetTag"("asset_id", "tag");

-- CreateIndex
CREATE INDEX "AssetImage_asset_id_is_primary_idx" ON "AssetImage"("asset_id", "is_primary");

-- CreateIndex
CREATE INDEX "Document_asset_id_idx" ON "Document"("asset_id");

-- CreateIndex
CREATE INDEX "Document_tenant_id_uploaded_at_idx" ON "Document"("tenant_id", "uploaded_at");

-- CreateIndex
CREATE INDEX "AssetEvent_asset_id_occurred_at_idx" ON "AssetEvent"("asset_id", "occurred_at");

-- CreateIndex
CREATE INDEX "AssetEvent_tenant_id_event_type_occurred_at_idx" ON "AssetEvent"("tenant_id", "event_type", "occurred_at");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_tenant_id_status_idx" ON "MaintenanceWorkOrder"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_tenant_id_asset_id_idx" ON "MaintenanceWorkOrder"("tenant_id", "asset_id");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_tenant_id_technician_id_idx" ON "MaintenanceWorkOrder"("tenant_id", "technician_id");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_tenant_id_due_date_idx" ON "MaintenanceWorkOrder"("tenant_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceWorkOrder_tenant_id_wo_number_key" ON "MaintenanceWorkOrder"("tenant_id", "wo_number");

-- CreateIndex
CREATE INDEX "MaintenanceTask_wo_id_order_idx" ON "MaintenanceTask"("wo_id", "order");

-- CreateIndex
CREATE INDEX "MaintenancePart_wo_id_idx" ON "MaintenancePart"("wo_id");

-- CreateIndex
CREATE INDEX "MaintenanceLabor_wo_id_idx" ON "MaintenanceLabor"("wo_id");

-- CreateIndex
CREATE INDEX "MaintenanceLabor_technician_id_idx" ON "MaintenanceLabor"("technician_id");

-- CreateIndex
CREATE INDEX "MaintenanceAttachment_wo_id_idx" ON "MaintenanceAttachment"("wo_id");

-- CreateIndex
CREATE INDEX "MaintenanceNote_wo_id_created_at_idx" ON "MaintenanceNote"("wo_id", "created_at");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_wo_id_changed_at_idx" ON "MaintenanceHistory"("wo_id", "changed_at");

-- CreateIndex
CREATE INDEX "Reservation_tenant_id_asset_id_start_at_idx" ON "Reservation"("tenant_id", "asset_id", "start_at");

-- CreateIndex
CREATE INDEX "Reservation_tenant_id_requester_id_status_idx" ON "Reservation"("tenant_id", "requester_id", "status");

-- CreateIndex
CREATE INDEX "Reservation_tenant_id_status_idx" ON "Reservation"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "AuditSession_tenant_id_status_idx" ON "AuditSession"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "AuditSession_tenant_id_due_at_idx" ON "AuditSession"("tenant_id", "due_at");

-- CreateIndex
CREATE INDEX "AuditSession_tenant_id_lead_auditor_id_idx" ON "AuditSession"("tenant_id", "lead_auditor_id");

-- CreateIndex
CREATE INDEX "AuditSessionItem_session_id_status_idx" ON "AuditSessionItem"("session_id", "status");

-- CreateIndex
CREATE INDEX "AuditSessionItem_asset_id_idx" ON "AuditSessionItem"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "AuditSessionItem_session_id_asset_id_key" ON "AuditSessionItem"("session_id", "asset_id");

-- CreateIndex
CREATE INDEX "AuditDiscrepancy_session_id_status_idx" ON "AuditDiscrepancy"("session_id", "status");

-- CreateIndex
CREATE INDEX "AuditDiscrepancy_asset_id_idx" ON "AuditDiscrepancy"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contract_number_key" ON "Contract"("contract_number");

-- CreateIndex
CREATE INDEX "Contract_tenant_id_status_idx" ON "Contract"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "Contract_tenant_id_vendor_id_idx" ON "Contract"("tenant_id", "vendor_id");

-- CreateIndex
CREATE INDEX "Contract_tenant_id_end_date_idx" ON "Contract"("tenant_id", "end_date");

-- CreateIndex
CREATE INDEX "Contract_tenant_id_renewal_date_idx" ON "Contract"("tenant_id", "renewal_date");

-- CreateIndex
CREATE INDEX "ContractReminder_contract_id_trigger_at_idx" ON "ContractReminder"("contract_id", "trigger_at");

-- CreateIndex
CREATE INDEX "ContractReminder_trigger_at_status_idx" ON "ContractReminder"("trigger_at", "status");

-- CreateIndex
CREATE INDEX "Notification_tenant_id_user_id_status_idx" ON "Notification"("tenant_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "Notification_tenant_id_created_at_idx" ON "Notification"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "Notification_related_type_related_id_idx" ON "Notification"("related_type", "related_id");

-- CreateIndex
CREATE INDEX "Webhook_tenant_id_is_active_idx" ON "Webhook"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "WebhookDeliveryLog_webhook_id_created_at_idx" ON "WebhookDeliveryLog"("webhook_id", "created_at");

-- CreateIndex
CREATE INDEX "WebhookDeliveryLog_created_at_idx" ON "WebhookDeliveryLog"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "AgentEnrollment_enrollment_token_key" ON "AgentEnrollment"("enrollment_token");

-- CreateIndex
CREATE INDEX "AgentEnrollment_tenant_id_status_idx" ON "AgentEnrollment"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "AgentEnrollment_tenant_id_asset_id_idx" ON "AgentEnrollment"("tenant_id", "asset_id");

-- CreateIndex
CREATE INDEX "AgentEnrollment_enrollment_token_idx" ON "AgentEnrollment"("enrollment_token");

-- CreateIndex
CREATE INDEX "AgentHeartbeat_enrollment_id_received_at_idx" ON "AgentHeartbeat"("enrollment_id", "received_at");

-- CreateIndex
CREATE INDEX "AgentSoftware_enrollment_id_name_idx" ON "AgentSoftware"("enrollment_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentSoftware_enrollment_id_name_version_key" ON "AgentSoftware"("enrollment_id", "name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_tenant_id_scope_key_user_id_key" ON "Setting"("tenant_id", "scope", "key", "user_id");

-- CreateIndex
CREATE INDEX "AuditLog_tenant_id_created_at_idx" ON "AuditLog"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "AuditLog_tenant_id_user_id_created_at_idx" ON "AuditLog"("tenant_id", "user_id", "created_at");

-- CreateIndex
CREATE INDEX "AuditLog_tenant_id_resource_type_resource_id_idx" ON "AuditLog"("tenant_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "AuditLog_action_created_at_idx" ON "AuditLog"("action", "created_at");
