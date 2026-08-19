// backend/src/middleware/tenant-middleware.ts
// Prisma middleware for automatic tenant context injection (RLS)

import { PrismaClient } from '@prisma/client';

export function tenantMiddleware(prisma: PrismaClient) {
  // Middleware to automatically inject tenant_id into queries
  prisma.$use(async (params, next) => {
    // Skip if no tenant context available
    if (!params.args || typeof params.args !== 'object') {
      return next(params);
    }

    // Get tenant context from Prisma's request context (set via AsyncLocalStorage)
    const tenantContext = (globalThis as any).__TENANT_CONTEXT__;
    
    if (tenantContext?.tenantId) {
      // Add tenant_id to where clauses for multi-tenant models
      const model = params.model;
      const multiTenantModels = [
        'Asset', 'AssetEvent', 'AuditSession', 'AuditSessionItem', 'AuditDiscrepancy',
        'MaintenanceWorkOrder', 'MaintenanceTask', 'MaintenancePart', 'MaintenanceLabor',
        'MaintenanceAttachment', 'MaintenanceNote', 'Reservation', 'Contract',
        'Webhook', 'WebhookDelivery', 'Document', 'Notification', 'Report',
        'ReportSchedule', 'Category', 'Department', 'Site', 'Location',
        'AgentEnrollment', 'ApiKey', 'TenantSettings'
      ];

      if (multiTenantModels.includes(model || '')) {
        // For write operations, ensure tenant_id is set
        if (['create', 'createMany', 'upsert'].includes(params.action)) {
          if (params.args.data) {
            if (Array.isArray(params.args.data)) {
              params.args.data = params.args.data.map((d: any) => ({
                ...d,
                tenant_id: d.tenant_id || tenantContext.tenantId,
              }));
            } else if (typeof params.args.data === 'object') {
              params.args.data = {
                ...params.args.data,
                tenant_id: params.args.data.tenant_id || tenantContext.tenantId,
              };
            }
          }
        }

        // For read operations, filter by tenant_id
        if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
          if (!params.args.where) {
            params.args.where = {};
          }
          
          // Don't override explicit tenant_id filter
          if (params.args.where.tenant_id === undefined) {
            params.args.where.tenant_id = tenantContext.tenantId;
          }
        }

        // For update/delete operations, filter by tenant_id
        if (['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
          if (!params.args.where) {
            params.args.where = {};
          }
          
          if (params.args.where.tenant_id === undefined) {
            params.args.where.tenant_id = tenantContext.tenantId;
          }
        }
      }
    }

    return next(params);
  });
}

// AsyncLocalStorage for tenant context
import { AsyncLocalStorage } from 'async_hooks';

const tenantContextStorage = new AsyncLocalStorage<{ tenantId: string }>();

export function runWithTenantContext<T>(tenantId: string, callback: () => T): T {
  return tenantContextStorage.run({ tenantId }, callback);
}

export function getTenantContext(): { tenantId: string } | undefined {
  return tenantContextStorage.getStore();
}