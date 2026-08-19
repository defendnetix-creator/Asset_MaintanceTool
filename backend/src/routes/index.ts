// backend/src/routes/index.ts
// Main routes registration

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authRoutes } from './auth.js';
import { assetRoutes } from './assets.js';
import { auditRoutes } from './audits.js';
import { maintenanceRoutes } from './maintenance.js';
import { reportRoutes } from './reports.js';
import { userRoutes } from './users.js';
import { adminRoutes } from './admin.js';
import { webhookRoutes } from './webhooks.js';
import { documentRoutes } from './documents.js';
import { agentRoutes } from './agents.js';
import { siteRoutes } from './sites.js';
import { categoryRoutes } from './categories.js';
import { departmentRoutes } from './departments.js';
import { contractRoutes } from './contracts.js';
import { notificationRoutes } from './notifications.js';
import { settingsRoutes } from './settings.js';

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