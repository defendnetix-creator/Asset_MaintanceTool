-- PostgreSQL RLS (Row Level Security) Initialization for Asset Maintenance Tool
-- This script runs on database initialization to set up multi-tenant isolation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app role for RLS context
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
    CREATE ROLE app NOLOGIN;
  END IF;
END $$;

-- Create function to get current tenant ID from session variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.current_tenant', true)::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has access to tenant
CREATE OR REPLACE FUNCTION has_tenant_access(tenant_uuid uuid) RETURNS boolean AS $$
BEGIN
  RETURN current_tenant_id() = tenant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION current_tenant_id() TO app;
GRANT EXECUTE ON FUNCTION has_tenant_access(uuid) TO app;

-- Create audit log trigger function for tamper-evident logging
CREATE OR REPLACE FUNCTION audit_log_trigger() RETURNS trigger AS $$
DECLARE
  prev_hash text;
  new_hash text;
  log_data text;
BEGIN
  -- Get previous hash for chaining
  SELECT hash INTO prev_hash
  FROM audit_log
  WHERE tenant_id = NEW.tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Create hash of current log entry
  log_data := NEW.id || '|' || NEW.tenant_id || '|' || 
              COALESCE(NEW.user_id::text, '') || '|' ||
              NEW.action || '|' || NEW.resource_type || '|' ||
              COALESCE(NEW.resource_id, '') || '|' ||
              COALESCE(NEW.old_values::text, '') || '|' ||
              COALESCE(NEW.new_values::text, '') || '|' ||
              COALESCE(NEW.ip_address, '') || '|' ||
              COALESCE(NEW.user_agent, '') || '|' ||
              COALESCE(NEW.metadata::text, '') || '|' ||
              COALESCE(prev_hash, '');

  new_hash := encode(digest(log_data, 'sha256'), 'hex');

  NEW.hash := new_hash;
  NEW.previous_hash := prev_hash;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on the trigger function
GRANT EXECUTE ON FUNCTION audit_log_trigger() TO app;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_updated_at_column() TO app;

-- Create function to normalize asset tags
CREATE OR REPLACE FUNCTION normalize_asset_tag(tag text) RETURNS text AS $$
BEGIN
  RETURN upper(regexp_replace(trim(tag), '[^A-Z0-9_-]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION normalize_asset_tag(text) TO app;

-- Create function to generate next asset tag number
CREATE OR REPLACE FUNCTION next_asset_tag_number(tenant_uuid uuid, prefix text) RETURNS integer AS $$
DECLARE
  next_num integer;
BEGIN
  UPDATE tenant_settings
  SET asset_tag_counter = asset_tag_counter + 1
  WHERE tenant_id = tenant_uuid
  RETURNING asset_tag_counter INTO next_num;
  
  RETURN COALESCE(next_num, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION next_asset_tag_number(uuid, text) TO app;

-- Create view for tenant-scoped asset counts (useful for dashboards)
CREATE OR REPLACE VIEW tenant_asset_summary AS
SELECT 
  a.tenant_id,
  COUNT(*) FILTER (WHERE a.status = 'IN_STOCK') AS in_stock,
  COUNT(*) FILTER (WHERE a.status = 'ASSIGNED') AS assigned,
  COUNT(*) FILTER (WHERE a.status = 'IN_REPAIR') AS in_repair,
  COUNT(*) FILTER (WHERE a.status = 'ON_LOAN') AS on_loan,
  COUNT(*) FILTER (WHERE a.status = 'RETIRED') AS retired,
  COUNT(*) FILTER (WHERE a.status = 'DISPOSED') AS disposed,
  COUNT(*) FILTER (WHERE a.warranty_expires <= NOW() + INTERVAL '30 days' AND a.warranty_expires >= NOW()) AS warranty_expiring_30d,
  COUNT(*) FILTER (WHERE a.warranty_expires < NOW()) AS warranty_expired
FROM asset a
WHERE a.deleted_at IS NULL
GROUP BY a.tenant_id;

GRANT SELECT ON tenant_asset_summary TO app;

-- Create view for tenant-scoped maintenance summary
CREATE OR REPLACE VIEW tenant_maintenance_summary AS
SELECT 
  m.tenant_id,
  COUNT(*) FILTER (WHERE m.status = 'OPEN') AS open,
  COUNT(*) FILTER (WHERE m.status = 'IN_PROGRESS') AS in_progress,
  COUNT(*) FILTER (WHERE m.status = 'ON_HOLD') AS on_hold,
  COUNT(*) FILTER (WHERE m.status = 'COMPLETED') AS completed,
  COUNT(*) FILTER (WHERE m.due_date < NOW() AND m.status IN ('OPEN', 'IN_PROGRESS', 'ON_HOLD')) AS overdue,
  COUNT(*) FILTER (WHERE m.priority = 1) AS critical,
  COUNT(*) FILTER (WHERE m.priority = 2) AS high
FROM maintenance_work_order m
WHERE m.deleted_at IS NULL
GROUP BY m.tenant_id;

GRANT SELECT ON tenant_maintenance_summary TO app;

-- Create view for tenant-scoped audit summary
CREATE OR REPLACE VIEW tenant_audit_summary AS
SELECT 
  a.tenant_id,
  COUNT(*) FILTER (WHERE a.status = 'SCHEDULED') AS scheduled,
  COUNT(*) FILTER (WHERE a.status = 'IN_PROGRESS') AS in_progress,
  COUNT(*) FILTER (WHERE a.status = 'COMPLETED') AS completed,
  COUNT(*) FILTER (WHERE a.status = 'OVERDUE') AS overdue,
  SUM(a.total_assets) AS total_assets_audited,
  SUM(a.scanned_count) AS total_scanned,
  SUM(a.found_count) AS total_found,
  SUM(a.missing_count) AS total_missing,
  SUM(a.mismatched_count) AS total_mismatched,
  SUM(a.damaged_count) AS total_damaged
FROM audit_session a
GROUP BY a.tenant_id;

GRANT SELECT ON tenant_audit_summary TO app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES FOR ROLE app IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app;
ALTER DEFAULT PRIVILEGES FOR ROLE app IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app;
ALTER DEFAULT PRIVILEGES FOR ROLE app IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO app;

-- Create indexes for RLS performance
-- These will be created by Prisma migrations, but we define them here for reference

-- COMMENT: The following indexes should be created on each tenant-scoped table:
-- CREATE INDEX idx_<table>_tenant_id ON <table> (tenant_id);
-- CREATE INDEX idx_<table>_tenant_id_status ON <table> (tenant_id, status);
-- CREATE INDEX idx_<table>_tenant_id_created_at ON <table> (tenant_id, created_at);

-- Audit log chaining index
-- CREATE INDEX idx_audit_log_tenant_created ON audit_log (tenant_id, created_at);
-- CREATE INDEX idx_audit_log_hash_chain ON audit_log (tenant_id, previous_hash);

-- Performance: Partial indexes for soft deletes
-- CREATE INDEX idx_<table>_tenant_not_deleted ON <table> (tenant_id) WHERE deleted_at IS NULL;

-- Grant connect permission
GRANT CONNECT ON DATABASE assetmt TO app;
GRANT USAGE ON SCHEMA public TO app;