// backend/src/routes/maintenance.ts
// Maintenance routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function maintenanceRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List work orders
  api.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(25),
        status: z.string().optional(),
        type: z.string().optional(),
        technician_id: z.string().uuid().optional(),
        asset_id: z.string().uuid().optional(),
        priority: z.coerce.number().int().min(1).max(4).optional(),
        overdue: z.boolean().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            wo_number: z.string(),
            asset_id: z.string(),
            type: z.string(),
            status: z.string(),
            priority: z.number(),
            title: z.string(),
            technician_id: z.string().nullable(),
            assigned_at: z.string().nullable(),
            started_at: z.string().nullable(),
            completed_at: z.string().nullable(),
            due_date: z.string().nullable(),
            asset: z.object({ id: z.string(), asset_tag: z.string(), make: z.string().nullable(), model: z.string().nullable() }).nullable(),
            technician: z.object({ id: z.string(), first_name: z.string(), last_name: z.string() }).nullable(),
          })),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            total_pages: z.number(),
          }),
        }),
      },
    }, async (request) => {
      const { page, limit, status, type, technician_id, asset_id, priority, overdue } = request.query;
      const tenantId = request.tenantId!;

      const where: any = { tenant_id: tenantId, deleted_at: null };
      if (status) where.status = status;
      if (type) where.type = type;
      if (technician_id) where.technician_id = technician_id;
      if (asset_id) where.asset_id = asset_id;
      if (priority) where.priority = priority;
      if (overdue) {
        where.due_date = { lt: new Date() };
        where.status = { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] };
      }

      const [wos, total] = await Promise.all([
        app.prisma.maintenanceWorkOrder.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            asset: { select: { id: true, asset_tag: true, make: true, model: true } },
            technician: { select: { id: true, first_name: true, last_name: true } },
          },
        }),
        app.prisma.maintenanceWorkOrder.count({ where }),
      ]);

      return { data: wos, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
    });

  // Get work order detail
  api.get('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          id: z.string(),
          wo_number: z.string(),
          asset_id: z.string(),
          type: z.string(),
          status: z.string(),
          priority: z.number(),
          title: z.string(),
          description: z.string().nullable(),
          problem_description: z.string().nullable(),
          root_cause: z.string().nullable(),
          resolution: z.string().nullable(),
          technician_id: z.string().nullable(),
          assigned_at: z.string().nullable(),
          started_at: z.string().nullable(),
          completed_at: z.string().nullable(),
          due_date: z.string().nullable(),
          labor_hours: z.number().nullable(),
          labor_rate: z.number().nullable(),
          parts_cost: z.number().nullable(),
          total_cost: z.number().nullable(),
          downtime_hours: z.number().nullable(),
          condition_before: z.string().nullable(),
          condition_after: z.string().nullable(),
          is_recurring: z.boolean(),
          recurrence_rule: z.string().nullable(),
          asset: z.object({ id: z.string(), asset_tag: z.string(), make: z.string().nullable(), model: z.string().nullable(), serial_number: z.string().nullable(), location: z.string().nullable() }).nullable(),
          technician: z.object({ id: z.string(), first_name: z.string(), last_name: z.string(), email: z.string() }).nullable(),
          tasks: z.array(z.object({ id: z.string(), title: z.string(), description: z.string().nullable(), is_completed: z.boolean(), completed_at: z.string().nullable() })),
          parts: z.array(z.object({ id: z.string(), part_name: z.string(), part_number: z.string().nullable(), quantity: z.number(), unit_cost: z.number().nullable(), total_cost: z.number().nullable() })),
          labor: z.array(z.object({ id: z.string(), technician_id: z.string(), date: z.string(), hours: z.number(), rate: z.number().nullable(), total_cost: z.number().nullable() })),
          attachments: z.array(z.object({ id: z.string(), url: z.string(), filename: z.string(), size: z.number() })),
          notes: z.array(z.object({ id: z.string(), author_id: z.string(), content: z.string(), is_internal: z.boolean(), created_at: z.string() })),
          history: z.array(z.object({ id: z.string(), field_name: z.string(), old_value: z.string().nullable(), new_value: z.string().nullable(), changed_by_id: z.string(), changed_at: z.string() })),
        }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const wo = await app.prisma.maintenanceWorkOrder.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
        include: {
          asset: { select: { id: true, asset_tag: true, make: true, model: true, serial_number: true, location: { select: { name: true } } } },
          technician: { select: { id: true, first_name: true, last_name: true, email: true } },
          tasks: { orderBy: { order: 'asc' } },
          parts: true,
          labor_entries: { include: { technician: { select: { id: true, first_name: true, last_name: true } } } },
          attachments: true,
          notes: { include: { author: { select: { id: true, first_name: true, last_name: true } } }, orderBy: { created_at: 'desc' } },
          history: { include: { changed_by: { select: { id: true, first_name: true, last_name: true } } }, orderBy: { changed_at: 'desc' } },
        },
      });

      if (!wo) {
        return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
      }

      return wo;
    });

  // Create work order
  api.post('/', {
    schema: {
      body: z.object({
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
        tasks: z.array(z.object({ title: z.string(), description: z.string().optional(), order: z.number().int().nonnegative() })).optional(),
        parts: z.array(z.object({ part_name: z.string(), part_number: z.string().optional(), quantity: z.number().int().positive().default(1), unit_cost: z.number().nonnegative().optional(), source: z.string().optional() })).optional(),
      }),
      response: {
        201: z.object({ id: z.string(), wo_number: z.string() }),
        400: z.object({ error: z.string(), code: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const tenantId = request.tenantId!;
      const userId = request.user!.id;

      // Validate asset
      const asset = await app.prisma.asset.findFirst({
        where: { id: request.body.asset_id, tenant_id: tenantId, deleted_at: null },
      });
      if (!asset) {
        return reply.code(404).send({ error: 'Asset not found', code: 'ASSET_NOT_FOUND' });
      }

      // Validate technician
      if (request.body.technician_id) {
        const tech = await app.prisma.user.findFirst({
          where: { id: request.body.technician_id, tenant_id: tenantId, status: 'ACTIVE' },
        });
        if (!tech) {
          return reply.code(400).send({ error: 'Technician not found', code: 'INVALID_TECHNICIAN' });
        }
      }

      // Generate WO number
      const count = await app.prisma.maintenanceWorkOrder.count({ where: { tenant_id: tenantId } });
      const wo_number = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const wo = await app.prisma.maintenanceWorkOrder.create({
        data: {
          ...request.body,
          wo_number,
          tenant_id: tenantId,
          asset_id: request.body.asset_id,
          created_by_id: request.user!.id,
          assigned_by_id: request.body.technician_id ? userId : undefined,
          assigned_at: request.body.technician_id ? new Date() : null,
          status: request.body.technician_id ? 'IN_PROGRESS' : 'OPEN',
          tasks: { create: request.body.tasks?.map((t, i) => ({ ...t, order: t.order ?? i })) || [] },
          parts: { create: request.body.parts || [] },
        },
      });

      // Create initial history
      await app.prisma.maintenanceHistory.create({
        data: {
          wo_id: wo.id,
          field_name: 'status',
          old_value: null,
          new_value: wo.status,
          changed_by_id: userId,
        },
      });

      if (request.body.technician_id) {
        await app.prisma.maintenanceHistory.create({
          data: {
            wo_id: wo.id,
            field_name: 'technician_id',
            old_value: null,
            new_value: request.body.technician_id,
            changed_by_id: userId,
          },
        });
      }

      // Notify technician
      if (request.body.technician_id) {
        // await app.queues.notifications.add('wo_assigned', { woId: wo.id, technicianId: request.body.technician_id });
      }

      return reply.code(201).send({ id: wo.id, wo_number: wo.wo_number });
    });

  // Update work order
  api.patch('/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
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
      }),
      response: {
        200: z.object({ id: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const wo = await app.prisma.maintenanceWorkOrder.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
      });

      if (!wo) {
        return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
      }

      const updates: any = {};
      const changes: Record<string, { old: any; new: any }> = {};

      const fieldsToTrack = [
        'title', 'description', 'problem_description', 'root_cause', 'resolution',
        'type', 'status', 'priority', 'technician_id', 'due_date',
        'condition_before', 'condition_after', 'labor_hours', 'labor_rate', 'parts_cost', 'downtime_hours'
      ];

      for (const field of fieldsToTrack) {
        if (request.body[field] !== undefined && request.body[field] !== wo[field]) {
          changes[field] = { old: wo[field], new: request.body[field] };
          updates[field] = request.body[field];
        }
      }

      if (request.body.technician_id !== undefined && request.body.technician_id !== wo.technician_id) {
        updates.technician_id = request.body.technician_id;
        if (request.body.technician_id) {
          updates.assigned_at = new Date();
          updates.assigned_by_id = request.user!.id;
        }
      }

      if (request.body.status === 'COMPLETED' && wo.status !== 'COMPLETED') {
        updates.completed_at = new Date();
        if (!wo.condition_after && !updates.condition_after) {
          return reply.code(400).send({ error: 'Condition after is required when completing work order', code: 'MISSING_CONDITION' });
        }
      }

      const updated = await app.prisma.maintenanceWorkOrder.update({
        where: { id: request.params.id },
        data: { ...updates, updated_by_id: request.user!.id },
      });

      // Log history
      if (Object.keys(changes).length > 0) {
        await Promise.all(Object.entries(changes).map(([field, change]) =>
          app.prisma.maintenanceHistory.create({
            data: {
              wo_id: wo.id,
              field_name: field,
              old_value: String(change.old ?? ''),
              new_value: String(change.new ?? ''),
              changed_by_id: request.user!.id,
            },
          })
        ));
      }

      // Notify if status changed
      if (changes.status && wo.technician_id) {
        // await app.queues.notifications.add('wo_status_changed', { woId: wo.id, technicianId: wo.technician_id, oldStatus: wo.status, newStatus: updates.status });
      }

      return { id: updated.id };
    });

  // Work order actions
  api.post('/:id/start', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ error: z.string(), code: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const wo = await app.prisma.maintenanceWorkOrder.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
      });

      if (!wo) return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
      if (wo.status !== 'OPEN' && wo.status !== 'ON_HOLD') {
        return reply.code(400).send({ error: 'Work order cannot be started', code: 'INVALID_STATUS' });
      }

      await app.prisma.maintenanceWorkOrder.update({
        where: { id: request.params.id },
        data: { status: 'IN_PROGRESS', started_at: new Date(), updated_by_id: request.user!.id },
      });

      await app.prisma.maintenanceHistory.create({
        data: { wo_id: request.params.id, field_name: 'status', old_value: wo.status, new_value: 'IN_PROGRESS', changed_by_id: request.user!.id },
      });

      return { message: 'Work order started' };
    });

  api.post('/:id/complete', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        condition_after: z.enum(['SERVICEABLE', 'NEEDS_REPLACEMENT', 'RETIRE']),
        resolution: z.string().min(1),
        labor_hours: z.number().nonnegative().optional(),
        parts_cost: z.number().nonnegative().optional(),
        downtime_hours: z.number().nonnegative().optional(),
      }),
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ error: z.string(), code: z.string() }),
        404: z.object({ error: z.string(), code: z.string() }),
      },
    }, async (request, reply) => {
      const wo = await app.prisma.maintenanceWorkOrder.findFirst({
        where: { id: request.params.id, tenant_id: request.tenantId!, deleted_at: null },
      });

      if (!wo) return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
      if (wo.status === 'COMPLETED') return reply.code(400).send({ error: 'Already completed', code: 'ALREADY_COMPLETED' });

      const { condition_after, resolution, labor_hours, parts_cost, downtime_hours } = request.body;

      await app.prisma.maintenanceWorkOrder.update({
        where: { id: request.params.id },
        data: {
          status: 'COMPLETED',
          completed_at: new Date(),
          condition_after,
          resolution,
          labor_hours: labor_hours ?? wo.labor_hours,
          parts_cost: parts_cost ?? wo.parts_cost,
          downtime_hours: downtime_hours ?? wo.downtime_hours,
          updated_by_id: request.user!.id,
        },
      });

      await app.prisma.maintenanceHistory.create({
        data: { wo_id: request.params.id, field_name: 'status', old_value: 'IN_PROGRESS', new_value: 'COMPLETED', changed_by_id: request.user!.id },
      });

      // Update asset condition
      await app.prisma.asset.update({
        where: { id: request.wo.asset_id },
        data: { status: condition_after === 'RETIRE' ? 'RETIRED' : condition_after === 'NEEDS_REPLACEMENT' ? 'IN_REPAIR' : 'IN_STOCK' },
      });

      return { message: 'Work order completed' };
    });

  // Add task
  api.post('/:id/tasks', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ title: z.string().min(1), description: z.string().optional(), order: z.number().int().nonnegative().optional() }),
      response: { 201: z.object({ id: z.string() }), 404: z.object({ error: z.string(), code: z.string() }) },
    }, async (request, reply) => {
      const wo = await app.prisma.maintenanceWorkOrder.findFirst({ where: { id: request.params.id, tenant_id: request.tenantId! } });
      if (!wo) return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });

      const maxOrder = await app.prisma.maintenanceTask.aggregate({ where: { wo_id: request.params.id }, _max: { order: true } });
      const task = await app.prisma.maintenanceTask.create({
        data: { wo_id: request.params.id, title: request.body.title, description: request.body.description, order: request.body.order ?? (maxOrder._max.order ?? 0) + 1 },
      });

      return reply.code(201).send({ id: task.id });
    });

  // Complete task
  api.patch('/:id/tasks/:taskId', {
    schema: {
      params: z.object({ id: z.string().uuid(), taskId: z.string().uuid() }),
      body: z.object({ is_completed: z.boolean() }),
      response: { 200: z.object({ message: z.string() }), 404: z.object({ error: z.string(), code: z.string() }) },
    }, async (request, reply) => {
      const task = await app.prisma.maintenanceTask.findFirst({ where: { id: request.params.taskId, wo_id: request.params.id } });
      if (!task) return reply.code(404).send({ error: 'Task not found', code: 'NOT_FOUND' });

      await app.prisma.maintenanceTask.update({
        where: { id: request.params.taskId },
        data: { is_completed: request.body.is_completed, completed_at: request.body.is_completed ? new Date() : null },
      });

      return { message: 'Task updated' };
    });

  // Add part
  api.post('/:id/parts', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ part_name: z.string(), part_number: z.string().optional(), quantity: z.number().int().positive().default(1), unit_cost: z.number().nonnegative().optional(), source: z.string().optional() }),
      response: { 201: z.object({ id: z.string() }), 404: z.object({ error: z.string(), code: z.string() }) },
    }, async (request, reply) => {
      const wo = await app.prisma.maintenanceWorkOrder.findFirst({ where: { id: request.params.id, tenant_id: request.tenantId! } });
      if (!wo) return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });

      const part = await app.prisma.maintenancePart.create({
        data: { wo_id: request.params.id, ...request.body, total_cost: request.body.unit_cost ? request.body.unit_cost * request.body.quantity : null },
      });

      return reply.code(201).send({ id: part.id });
    });

  // Add labor
  api.post('/:id/labor', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ technician_id: z.string().uuid(), hours: z.number().positive(), rate: z.number().nonnegative().optional(), description: z.string().optional() }),
      response: { 201: z.object({ id: z.string() }), 404: z.object({ error: z.string(), code: z.string() }) },
    }, async (request, reply) => {
      const wo = await app.prisma.maintenanceWorkOrder.findFirst({ where: { id: request.params.id, tenant_id: request.tenantId! } });
      if (!wo) return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });

      const labor = await app.prisma.maintenanceLabor.create({
        data: { wo_id: request.params.id, technician_id: request.body.technician_id, hours: request.body.hours, rate: request.body.rate, description: request.body.description, total_cost: request.body.hours * (request.body.rate ?? 0) },
      });

      return reply.code(201).send({ id: labor.id });
    });

  // Add attachment
  api.post('/:id/attachments', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: { 201: z.object({ id: z.string(), url: z.string() }) },
    }, async (request, reply) => {
      const wo = await app.prisma.maintenanceWorkOrder.findFirst({ where: { id: request.params.id, tenant_id: request.tenantId! } });
      if (!wo) return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });

      const data = await request.file();
      if (!data) return reply.code(400).send({ error: 'No file uploaded' });

      // Scan and upload (reuse upload logic)
      // ... simplified for brevity
      const attachment = await app.prisma.maintenanceAttachment.create({
        data: { wo_id: request.params.id, url: '', filename: data.filename, mime_type: data.mimetype, size: data.file.bytesRead, uploaded_by: request.user!.id },
      });

      return reply.code(201).send({ id: attachment.id, url: attachment.url });
    });

  // Add note
  api.post('/:id/notes', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ content: z.string().min(1), is_internal: z.boolean().default(false) }),
      response: { 201: z.object({ id: z.string() }), 404: z.object({ error: z.string(), code: z.string() }) },
    }, async (request, reply) => {
      const wo = await app.prisma.maintenanceWorkOrder.findFirst({ where: { id: request.params.id, tenant_id: request.tenantId! } });
      if (!wo) return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });

      const note = await app.prisma.maintenanceNote.create({
        data: { wo_id: request.params.id, author_id: request.user!.id, ...request.body },
      });

      return reply.code(201).send({ id: note.id });
    });

export { maintenanceRoutes };