# Asset Maintenance Tool — Database ERD

> Last verified: 2026-08-20.
>
> **How this was produced:** Generated from Prisma schema (`prisma/schema.prisma`) which defines the PostgreSQL database structure. All models, fields, indexes, and relations are read from the live Prisma schema definitions.

**26 models in a single PostgreSQL database (`assetmt`) with multi-tenant Row-Level Security (RLS).**

| Domain | Models | Notes |
|---|---|---|
| **Identity & Access** | 5 | Tenant, User, Session, UserGroup, ApiKey |
| **Organization Hierarchy** | 4 | Site, Location, Category, Department |
| **Asset Core** | 4 | Asset, AssetTag, AssetImage, Document |
| **Asset Events** | 1 | AssetEvent |
| **Maintenance** | 7 | MaintenanceWorkOrder, Task, Part, Labor, Attachment, Note, History |
| **Reservations** | 1 | Reservation |
| **Audits** | 3 | AuditSession, AuditSessionItem, AuditDiscrepancy |
| **Contracts & Warranties** | 2 | Contract, ContractReminder |
| **Notifications & Webhooks** | 3 | Notification, Webhook, WebhookDeliveryLog |
| **Agent Management** | 3 | AgentEnrollment, AgentHeartbeat, AgentSoftware |
| **Settings & Audit** | 2 | Setting, AuditLog |

---

## 1. Identity, Organisation and Access Control

```mermaid
erDiagram
    TENANT ||--o{ USER : "has users"
    TENANT ||--o{ USERGROUP : "has groups"
    TENANT ||--o{ APIKEY : "has API keys"
    USER ||--o{ SESSION : "has sessions"
    USER }o--o{ USERGROUP : "member of"
    USERGROUP }o--o{ USERGROUPMEMBER : "has members"
    USER }o--o{ USERGROUPMEMBER : "belongs to"

    TENANT {
        uuid id PK
        string name
        string slug UK
        string domain UK
        string logo_url
        string primary_color
        string timezone
        string currency
        string date_format
        string time_format
        string plan
        int max_assets
        int max_users
        int max_storage_gb
        json settings
        string status
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    USER {
        uuid id PK
        uuid tenant_id FK
        string email
        string password_hash
        string first_name
        string last_name
        string phone
        string title
        string avatar_url
        string timezone
        string date_format
        string time_format
        string language
        enum role
        enum status
        boolean mfa_enabled
        string mfa_secret
        string[] backup_codes
        datetime last_login_at
        datetime last_activity_at
        datetime created_at
        datetime updated_at
        datetime deleted_at
        string invited_by
        datetime invited_at
    }
    SESSION {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        string ip_address
        string user_agent
        json device_info
        datetime expires_at
        datetime created_at
        datetime last_used_at
        datetime revoked_at
    }
    USERGROUP {
        uuid id PK
        uuid tenant_id FK
        string name
        string description
        string color
        datetime created_at
        datetime updated_at
    }
    USERGROUPMEMBER {
        uuid id PK
        uuid user_id FK
        uuid group_id FK
        string role
        datetime joined_at
    }
    APIKEY {
        uuid id PK
        uuid tenant_id FK
        string name
        string key_hash UK
        string key_prefix
        string[] scopes
        uuid owner_id FK
        datetime last_used_at
        datetime expires_at
        datetime revoked_at
        datetime created_at
        string last_used_by
    }
```

**Key Points:**
- All models scoped by `tenant_id` for multi-tenancy
- `User` has unique constraint on `[tenant_id, email]`
- `UserGroupMember` is the join table with composite unique on `[user_id, group_id]`
- RLS policies enforce tenant isolation at database level

---

## 2. Organization Hierarchy (Sites, Locations, Categories, Departments)

```mermaid
erDiagram
    TENANT ||--o{ SITE : "has sites"
    TENANT ||--o{ LOCATION : "has locations"
    TENANT ||--o{ CATEGORY : "has categories"
    TENANT ||--o{ DEPARTMENT : "has departments"
    SITE ||--o{ LOCATION : "contains"
    LOCATION }o--o{ LOCATION : "parent/child"
    CATEGORY }o--o{ CATEGORY : "parent/child"

    SITE {
        uuid id PK
        uuid tenant_id FK
        string name
        string code UK
        string address
        string city
        string state
        string country
        string postal_code
        string timezone
        string description
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    LOCATION {
        uuid id PK
        uuid tenant_id FK
        uuid site_id FK
        string name
        string code
        string description
        uuid parent_id FK
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    CATEGORY {
        uuid id PK
        uuid tenant_id FK
        string name
        string code UK
        string description
        string color
        string icon
        uuid parent_id FK
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    DEPARTMENT {
        uuid id PK
        uuid tenant_id FK
        string name
        string code UK
        string description
        string cost_center
        uuid manager_id FK
        boolean is_active
        datetime created_at
        datetime updated_at
    }
```

**Key Points:**
- Hierarchical locations (building → floor → room) via self-referencing `parent_id`
- Hierarchical categories via self-referencing `parent_id`
- Unique codes scoped to tenant (and site for locations)

---

## 3. Asset Core

```mermaid
erDiagram
    TENANT ||--o{ ASSET : "owns assets"
    CATEGORY }o--o{ ASSET : "categorizes"
    SITE }o--o{ ASSET : "hosts"
    LOCATION }o--o{ ASSET : "located at"
    DEPARTMENT }o--o{ ASSET : "assigned to"
    USER }o--o{ ASSET : "custodian"
    ASSET ||--o{ ASSETTAG : "has tags"
    ASSET ||--o{ ASSETIMAGE : "has images"
    ASSET }o--o{ DOCUMENT : "has documents"
    ASSET ||--o{ ASSETCUSTOMFIELDVALUE : "has custom values"
    CUSTOMFIELD ||--o{ ASSETCUSTOMFIELDVALUE : "defines"

    ASSET {
        uuid id PK
        uuid tenant_id FK
        string asset_tag
        string normalized_tag UK
        string serial_number
        string qr_code_data
        string barcode_data
        string make
        string model
        uuid category_id FK
        uuid site_id FK
        uuid location_id FK
        uuid department_id FK
        uuid custodian_user_id FK
        enum status
        string condition
        datetime purchase_date
        decimal purchase_cost
        string currency
        datetime warranty_expires
        uuid vendor_id
        int asset_tag_counter
        uuid created_by_id FK
        uuid updated_by_id FK
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    ASSETTAG {
        uuid id PK
        uuid asset_id FK
        string tag UK
        datetime created_at
        string created_by
    }
    ASSETIMAGE {
        uuid id PK
        uuid asset_id FK
        string url
        string filename
        string mime_type
        int size
        int width
        int height
        boolean is_primary
        string caption
        datetime created_at
        string created_by
    }
    DOCUMENT {
        uuid id PK
        uuid asset_id FK
        uuid tenant_id FK
        string filename
        string mime_type
        int size
        string url
        string sha256
        string title
        string description
        string[] tags
        uuid uploaded_by FK
        datetime uploaded_at
        boolean scanned
        string scan_result
    }
    CUSTOMFIELD {
        uuid id PK
        uuid tenant_id FK
        string name
        string label
        string type
        string entity_type
        uuid category_id FK
        json options
        json validation
        boolean is_required
        boolean is_filterable
        boolean is_searchable
        int display_order
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    ASSETCUSTOMFIELDVALUE {
        uuid id PK
        uuid asset_id FK
        uuid custom_field_id FK
        string value_text
        float value_number
        boolean value_boolean
        datetime value_date
        json value_json
        datetime created_at
        datetime updated_at
    }
```

**Key Points:**
- `normalized_tag` ensures case-insensitive uniqueness per tenant
- Assets linked to Site → Location hierarchy (location is child of site)
- Custodian is a User (person responsible)
- Custom fields via EAV pattern (Entity-Attribute-Value) with `CustomField` definitions and `AssetCustomFieldValue` instances
- Documents are asset-optional (can exist without asset_id for global docs)

---

## 4. Asset Events / Lifecycle

```mermaid
erDiagram
    ASSET ||--o{ ASSETEVENT : "has events"
    USER }o--o{ ASSETEVENT : "performed by"

    ASSETEVENT {
        uuid id PK
        uuid asset_id FK
        uuid tenant_id FK
        enum event_type
        string description
        json metadata
        uuid performed_by_id FK
        datetime occurred_at
        datetime created_at
    }
```

**Event Types:** `CHECK_OUT`, `CHECK_IN`, `MAINTENANCE_START`, `MAINTENANCE_COMPLETE`, `RESERVE`, `LEASE`, `LEASE_RETURN`, `MOVE`, `DISPOSE`, `RETIRE`, `TAG_CHANGE`, `CUSTODIAN_CHANGE`, `STATUS_CHANGE`

---

## 5. Maintenance

```mermaid
erDiagram
    TENANT ||--o{ MAINTENANCEWORKORDER : "has work orders"
    ASSET ||--o{ MAINTENANCEWORKORDER : "subject of"
    USER }o--o{ MAINTENANCEWORKORDER : "technician"
    USER }o--o{ MAINTENANCEWORKORDER : "created by"
    USER }o--o{ MAINTENANCEWORKORDER : "assigned by"
    MAINTENANCEWORKORDER }o--o{ MAINTENANCEWORKORDER : "parent/child"
    MAINTENANCEWORKORDER ||--o{ MAINTENANCETASK : "has tasks"
    MAINTENANCEWORKORDER ||--o{ MAINTENANCEPART : "uses parts"
    MAINTENANCEWORKORDER ||--o{ MAINTENANCELABOR : "has labor"
    MAINTENANCEWORKORDER ||--o{ MAINTENANCEATTACHMENT : "has attachments"
    MAINTENANCEWORKORDER ||--o{ MAINTENANCENOTE : "has notes"
    MAINTENANCEWORKORDER ||--o{ MAINTENANCEHISTORY : "has history"
    USER }o--o{ MAINTENANCELABOR : "technician"
    USER }o--o{ MAINTENANCENOTE : "author"

    MAINTENANCEWORKORDER {
        uuid id PK
        uuid tenant_id FK
        string wo_number UK
        uuid asset_id FK
        enum type
        enum status
        int priority
        string title
        string description
        string problem_description
        string root_cause
        string resolution
        uuid technician_id FK
        datetime assigned_at
        datetime started_at
        datetime completed_at
        datetime due_date
        decimal labor_hours
        decimal labor_rate
        decimal parts_cost
        decimal total_cost
        decimal downtime_hours
        string condition_before
        string condition_after
        boolean is_recurring
        string recurrence_rule
        uuid parent_wo_id FK
        uuid created_by_id FK
        uuid assigned_by_id FK
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    MAINTENANCETASK {
        uuid id PK
        uuid wo_id FK
        string title
        string description
        boolean is_completed
        datetime completed_at
        uuid completed_by FK
        int order
        datetime created_at
        datetime updated_at
    }
    MAINTENANCEPART {
        uuid id PK
        uuid wo_id FK
        string part_name
        string part_number
        int quantity
        decimal unit_cost
        decimal total_cost
        string source
        string notes
        datetime created_at
        datetime updated_at
    }
    MAINTENANCELABOR {
        uuid id PK
        uuid wo_id FK
        uuid technician_id FK
        datetime date
        decimal hours
        decimal rate
        string description
        datetime created_at
    }
    MAINTENANCEATTACHMENT {
        uuid id PK
        uuid wo_id FK
        string url
        string filename
        string mime_type
        int size
        uuid uploaded_by FK
        datetime created_at
    }
    MAINTENANCENOTE {
        uuid id PK
        uuid wo_id FK
        uuid author_id FK
        string content
        boolean is_internal
        datetime created_at
        datetime updated_at
    }
    MAINTENANCEHISTORY {
        uuid id PK
        uuid wo_id FK
        string field_name
        string old_value
        string new_value
        uuid changed_by_id FK
        datetime changed_at
    }
```

**Key Points:**
- Work orders can be recurring with `recurrence_rule` (cron-like)
- Parent/child work orders for complex jobs
- Full cost tracking: labor hours/rate, parts cost, total cost, downtime
- Immutable audit trail via `MaintenanceHistory`

---

## 6. Reservations

```mermaid
erDiagram
    TENANT ||--o{ RESERVATION : "has reservations"
    ASSET ||--o{ RESERVATION : "reserved"
    USER }o--o{ RESERVATION : "requester"
    USER }o--o{ RESERVATION : "approver"

    RESERVATION {
        uuid id PK
        uuid tenant_id FK
        uuid asset_id FK
        uuid requester_id FK
        uuid approver_id FK
        datetime start_at
        datetime end_at
        string purpose
        string status
        datetime approved_at
        datetime rejected_at
        string rejection_reason
        datetime created_at
        datetime updated_at
    }
```

**Status Flow:** `PENDING` → `APPROVED`/`REJECTED` → `ACTIVE` → `COMPLETED`/`CANCELLED`

---

## 7. Audits (Physical Verification)

```mermaid
erDiagram
    TENANT ||--o{ AUDITSESSION : "has audit sessions"
    USER }o--o{ AUDITSESSION : "lead auditor"
    USER }o--o{ AUDITSESSION : "created by"
    AUDITSESSION ||--o{ AUDITSESSIONITEM : "has items"
    ASSET }o--o{ AUDITSESSIONITEM : "audited"
    LOCATION }o--o{ AUDITSESSIONITEM : "expected at"
    LOCATION }o--o{ AUDITSESSIONITEM : "scanned at"
    USER }o--o{ AUDITSESSIONITEM : "scanned by"
    AUDITSESSIONITEM }o--o{ AUDITDISCREPANCY : "has discrepancy"
    AUDITSESSION ||--o{ AUDITDISCREPANCY : "has discrepancies"
    ASSET }o--o{ AUDITDISCREPANCY : "related asset"

    AUDITSESSION {
        uuid id PK
        uuid tenant_id FK
        string name
        string scope_type
        uuid scope_id FK
        string scope_name
        enum status
        datetime start_at
        datetime end_at
        datetime due_at
        string timezone
        uuid lead_auditor_id FK
        int total_assets
        int scanned_count
        int found_count
        int missing_count
        int mismatched_count
        int damaged_count
        boolean notify_assignees
        boolean require_signature
        boolean require_photo
        boolean offline_enabled
        uuid created_by_id FK
        datetime created_at
        datetime updated_at
        datetime completed_at
    }
    AUDITSESSIONITEM {
        uuid id PK
        uuid session_id FK
        uuid asset_id FK
        uuid expected_location_id FK
        uuid scanned_location_id FK
        enum status
        datetime scanned_at
        uuid scanned_by_id FK
        string notes
        string photo_url
        string signature_url
        uuid discrepancy_id FK
        datetime created_at
        datetime updated_at
    }
    AUDITDISCREPANCY {
        uuid id PK
        uuid session_id FK
        uuid asset_id FK
        string type
        string severity
        string status
        uuid suggested_match_id FK
        string resolution
        uuid resolved_by_id FK
        datetime resolved_at
        datetime created_at
        datetime updated_at
    }
```

**Scope Types:** `SITE`, `BUILDING`, `FLOOR`, `ROOM`, `DEPARTMENT`, `ALL`
**Item Status:** `FOUND`, `MISSING`, `MISMATCHED`, `DAMAGED`
**Discrepancy Status:** `OPEN` → `RESOLVED`

**Key Points:**
- Audit sessions can be scoped to site, building, floor, room, department, or all assets
- Offline-enabled with PWA scanner support
- Discrepancies track mismatches between expected and scanned state
- Digital signatures and photos for compliance

---

## 8. Contracts & Warranties

```mermaid
erDiagram
    TENANT ||--o{ CONTRACT : "has contracts"
    USER }o--o{ CONTRACT : "owner"
    USER }o--o{ CONTRACT : "created by"
    CONTRACT ||--o{ CONTRACTREMINDER : "has reminders"

    CONTRACT {
        uuid id PK
        uuid tenant_id FK
        string name
        string contract_number UK
        string type
        enum status
        uuid vendor_id FK
        decimal value
        string currency
        string billing_cycle
        boolean auto_renew
        datetime start_date
        datetime end_date
        datetime renewal_date
        int notice_period_days
        string terms
        string sla_terms
        uuid owner_id FK
        uuid created_by_id FK
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    CONTRACTREMINDER {
        uuid id PK
        uuid contract_id FK
        string type
        datetime trigger_at
        datetime sent_at
        uuid[] recipient_ids
        enum channel
        string status
        datetime created_at
    }
```

**Contract Status:** `ACTIVE`, `EXPIRED`, `PENDING_RENEWAL`, `TERMINATED`

---

## 9. Notifications & Webhooks

```mermaid
erDiagram
    TENANT ||--o{ NOTIFICATION : "has notifications"
    USER }o--o{ NOTIFICATION : "recipient"
    TENANT ||--o{ WEBHOOK : "has webhooks"
    USER }o--o{ WEBHOOK : "created by"
    WEBHOOK ||--o{ WEBHOOKDELIVERYLOG : "has deliveries"

    NOTIFICATION {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string type
        string title
        string message
        json data
        enum channel
        string status
        datetime read_at
        string related_type
        uuid related_id FK
        datetime created_at
    }
    WEBHOOK {
        uuid id PK
        uuid tenant_id FK
        string name
        string url
        string secret
        string[] events
        boolean is_active
        json retry_policy
        int timeout_ms
        datetime last_triggered
        string last_status
        uuid created_by_id FK
        datetime created_at
        datetime updated_at
    }
    WEBHOOKDELIVERYLOG {
        uuid id PK
        uuid webhook_id FK
        string event
        json payload
        int status_code
        string response_body
        int latency_ms
        int attempt
        string error
        datetime created_at
    }
```

**Webhook Events:** `ASSET_CREATED`, `ASSET_UPDATED`, `ASSET_DELETED`, `ASSET_CHECKED_OUT`, `ASSET_CHECKED_IN`, `MAINTENANCE_STARTED`, `MAINTENANCE_COMPLETED`, `AUDIT_COMPLETED`, `WARRANTY_EXPIRING`, `AGENT_OFFLINE`

---

## 10. Agent Management (Endpoint Agent)

```mermaid
erDiagram
    TENANT ||--o{ AGENTENROLLMENT : "has enrollments"
    ASSET }o--o{ AGENTENROLLMENT : "assigned to"
    USER }o--o{ AGENTENROLLMENT : "enrolled by"
    USER }o--o{ AGENTENROLLMENT : "revoked by"
    AGENTENROLLMENT ||--o{ AGENTHEARTBEAT : "has heartbeats"
    AGENTENROLLMENT ||--o{ AGENTSOFTWARE : "reports software"

    AGENTENROLLMENT {
        uuid id PK
        uuid tenant_id FK
        uuid asset_id FK
        string enrollment_token UK
        string hostname
        string os
        string os_version
        string agent_version
        string status
        datetime last_seen
        string last_ip
        datetime enrolled_at
        uuid enrolled_by_id FK
        datetime revoked_at
        uuid revoked_by_id FK
        int sync_interval_seconds
        string[] data_categories
        boolean privacy_mode
        boolean auto_update
    }
    AGENTHEARTBEAT {
        uuid id PK
        uuid enrollment_id FK
        datetime received_at
        string ip_address
        json data
    }
    AGENTSOFTWARE {
        uuid id PK
        uuid enrollment_id FK
        string name
        string version
        string publisher
        datetime install_date
        string install_path
        bigint size
        float usage_percent
        datetime last_used
        string category
        boolean is_authorized
        datetime detected_at
        datetime last_seen
    }
```

**Key Points:**
- Agent enrolls via token, optionally linked to an asset
- Heartbeats for online/offline detection
- Software inventory with authorization flags
- Privacy mode limits data collection
- Auto-update capability

---

## 11. Settings & Audit Log

```mermaid
erDiagram
    TENANT ||--o{ SETTING : "has settings"
    USER }o--o{ SETTING : "user-scoped"
    TENANT ||--o{ AUDITLOG : "has audit logs"
    USER }o--o{ AUDITLOG : "actor"

    SETTING {
        uuid id PK
        uuid tenant_id FK
        string key
        json value
        string scope
        uuid user_id FK
        datetime created_at
        datetime updated_at
    }
    AUDITLOG {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string action
        string resource_type
        uuid resource_id FK
        json old_values
        json new_values
        string ip_address
        string user_agent
        json metadata
        string hash
        string previous_hash
        datetime created_at
    }
```

**Key Points:**
- Settings scoped to `tenant` or `user`
- AuditLog uses hash chaining (`previous_hash`) for tamper evidence
- Comprehensive indexing for query performance

---

## Cross-Model Relationships Summary

```mermaid
erDiagram
    %% Core multi-tenant pattern
    TENANT ||--o{ USER : ""
    TENANT ||--o{ SITE : ""
    TENANT ||--o{ LOCATION : ""
    TENANT ||--o{ CATEGORY : ""
    TENANT ||--o{ DEPARTMENT : ""
    TENANT ||--o{ ASSET : ""
    TENANT ||--o{ ASSETEVENT : ""
    TENANT ||--o{ MAINTENANCEWORKORDER : ""
    TENANT ||--o{ RESERVATION : ""
    TENANT ||--o{ AUDITSESSION : ""
    TENANT ||--o{ CONTRACT : ""
    TENANT ||--o{ NOTIFICATION : ""
    TENANT ||--o{ WEBHOOK : ""
    TENANT ||--o{ AGENTENROLLMENT : ""
    TENANT ||--o{ SETTING : ""
    TENANT ||--o{ AUDITLOG : ""

    %% Asset-centric relationships
    ASSET }o--o{ SITE : "site"
    ASSET }o--o{ LOCATION : "location"
    ASSET }o--o{ CATEGORY : "category"
    ASSET }o--o{ DEPARTMENT : "department"
    ASSET }o--o{ USER : "custodian"

    %% Maintenance chain
    MAINTENANCEWORKORDER }o--o{ ASSET : "asset"
    MAINTENANCEWORKORDER }o--o{ USER : "technician"

    %% Audit chain
    AUDITSESSION }o--o{ USER : "lead_auditor"
    AUDITSESSIONITEM }o--o{ ASSET : "asset"
    AUDITSESSIONITEM }o--o{ LOCATION : "expected_location"
    AUDITSESSIONITEM }o--o{ LOCATION : "scanned_location"
    AUDITDISCREPANCY }o--o{ ASSET : "asset"

    %% Agent chain
    AGENTENROLLMENT }o--o{ ASSET : "asset"
    AGENTHEARTBEAT }o--o{ AGENTENROLLMENT : "enrollment"
    AGENTSOFTWARE }o--o{ AGENTENROLLMENT : "enrollment"
```

---

## Index Strategy

Every model includes `tenant_id` in composite indexes for RLS-friendly query patterns:

| Model | Key Indexes |
|---|---|
| `User` | `[tenant_id, status]`, `[tenant_id, role]`, `[tenant_id, email]` (unique) |
| `Asset` | `[tenant_id, status]`, `[tenant_id, site_id]`, `[tenant_id, location_id]`, `[tenant_id, category_id]`, `[tenant_id, custodian_user_id]`, `[tenant_id, serial_number]`, `[tenant_id, created_at]`, `[tenant_id, deleted_at]`, `[tenant_id, normalized_tag]` (unique) |
| `MaintenanceWorkOrder` | `[tenant_id, status]`, `[tenant_id, asset_id]`, `[tenant_id, technician_id]`, `[tenant_id, due_date]`, `[tenant_id, wo_number]` (unique) |
| `AuditSession` | `[tenant_id, status]`, `[tenant_id, due_at]`, `[tenant_id, lead_auditor_id]` |
| `Reservation` | `[tenant_id, asset_id, start_at]`, `[tenant_id, requester_id, status]`, `[tenant_id, status]` |
| `Contract` | `[tenant_id, status]`, `[tenant_id, vendor_id]`, `[tenant_id, end_date]`, `[tenant_id, renewal_date]`, `[tenant_id, contract_number]` (unique) |
| `AgentEnrollment` | `[tenant_id, status]`, `[tenant_id, asset_id]`, `[enrollment_token]` (unique) |
| `Notification` | `[tenant_id, user_id, status]`, `[tenant_id, created_at]`, `[related_type, related_id]` |
| `AuditLog` | `[tenant_id, created_at]`, `[tenant_id, user_id, created_at]`, `[tenant_id, resource_type, resource_id]`, `[action, created_at]` |

---

## RLS Policy Pattern

All multi-tenant tables have a `tenant_id` column and a PostgreSQL RLS policy:

```sql
-- Example pattern applied to all multi-tenant tables
ALTER TABLE "Asset" ENABLE ROW LEVEL SECURITY;

CREATE POLICY asset_tenant_isolation ON "Asset"
  FOR ALL TO app_user
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

The Prisma middleware (`tenant-middleware.ts`) automatically sets `app.current_tenant_id` session variable before each query, ensuring transparent tenant isolation.

---

## Notes for Future Development

1. **No foreign keys in PostgreSQL** — relationships are enforced at application layer via Prisma; RLS provides tenant isolation
2. **Soft deletes** — `deleted_at` column on most models; queries filter `deleted_at IS NULL` by default
3. **UUID primary keys** — all IDs are UUID v4 generated by database
4. **Timestamps** — `created_at` (default now), `updated_at` (auto-update), `deleted_at` (soft delete)
5. **Decimal precision** — financial fields use `Decimal(12,2)` or `Decimal(10,2)`; labor hours use `Decimal(6,2)` or `Decimal(4,2)`
6. **Array columns** — PostgreSQL arrays used for tags, scopes, backup_codes, data_categories
7. **JSON/JSONB** — flexible metadata, settings, custom field values, webhook payloads
8. **Audit trail** — `AuditLog` captures all sensitive operations with hash chaining for integrity
9. **Agent offline-first** — `AgentEnrollment.offline_enabled`, `sync_interval_seconds` support disconnected operation