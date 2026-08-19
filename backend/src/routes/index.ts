// backend/src/routes/index.ts
// Main routes registration

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authRoutes } from './auth';
import { assetRoutes } from './assets';
import { auditRoutes } from './audits';
import { maintenanceRoutes } from './maintenance';
import { reportRoutes } from './reports';
import { userRoutes } from './users';
import { adminRoutes } from './admin';
import { webhookRoutes } from './webhooks';
import { documentRoutes } from './documents';
import { agentRoutes } from './agents';
import { siteRoutes } from './sites';
import { categoryRoutes } from './categories';
import { departmentRoutes } from './departments';
import { contractRoutes } from './contracts';
import { notificationRoutes } from './notifications';
import { settingsRoutes } from './settings';

export async function registerRoutes(app: FastifyInstance) {
  // API version prefix
  const api = app.withTypeProvider<ZodTypeProvider>();
  
  // Register all route modules
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(assetRoutes, { prefix: '/api/assets' });
  await app.register(auditRoutes, { prefix: '/api/audits' });
  await app.register(maintenanceRoutes, { prefix: '/api/maintenance' });
  await app.register(reportRoutes, { prefix: '/api/reports' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });
  await app.register(documentRoutes, { prefix: '/api/documents' });
  await app.register(agentRoutes, { prefix: '/api/agents' });
  await app.register(siteRoutes, { prefix: '/api/sites' });
  await app.register(categoryRoutes, { prefix: '/api/categories' });
  await app.register(departmentRoutes, { prefix: '/api/departments' });
  await app.register(contractRoutes, { prefix: '/api/contracts' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });
}