// backend/src/routes/maintenance.ts
// Maintenance routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const workOrderListItemSchema = z.object({
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
});

const workOrdersListResponse = z.object({
  data: z.array(workOrderListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

const workOrderDetailSchema = z.object({
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
  technician_name: z.string().nullable(),
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
  parent_wo_id: z.string().nullable(),
  created_by_id: z.string(),
  created_by_name: z.string().nullable(),
  assigned_by_id: z.string().nullable(),
  assigned_by_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    is_completed: z.boolean(),
    completed_at: z.string().nullable(),
    completed_by: z.string().nullable(),
    order: z.number(),
  })),
  parts: z.array(z.object({
    id: z.string(),
    part_name: z.string(),
    part_number: z.string().nullable(),
    quantity: z.number(),
    unit_cost: z.number().nullable(),
    total_cost: z.number().nullable(),
    source: z.string().nullable(),
    notes: z.string().nullable(),
  })),
  labor_entries: z.array(z.object({
    id: z.string(),
    technician_id: z.string(),
    technician_name: z.string().nullable(),
    date: z.string(),
    hours: z.number(),
    rate: z.number().nullable(),
    description: z.string().nullable(),
  })),
  attachments: z.array(z.object({
    id: z.string(),
    url: z.string(),
    filename: z.string(),
    mime_type: z.string(),
    size: z.number(),
    uploaded_by: z.string(),
    created_at: z.string(),
  })),
  notes: z.array(z.object({
    id: z.string(),
    author_id: z.string(),
    author_name: z.string().nullable(),
    content: z.string(),
    is_internal: z.boolean(),
    created_at: z.string(),
  })),
  history: z.array(z.object({
    id: z.string(),
    field_name: z.string(),
    old_value: z.string().nullable(),
    new_value: z.string().nullable(),
    changed_by_id: z.string(),
    changed_by_name: z.string().nullable(),
    changed_at: z.string(),
  })),
});

const messageResponse = z.object({ message: z.string() });
const errorResponse = z.object({ error: z.string(), code: z.string() });

const listWorkOrdersSchema = {
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
  response: { 200: workOrdersListResponse },
};

const getWorkOrderSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: workOrderDetailSchema, 404: errorResponse },
};

const createWorkOrderSchema = {
  body: z.object({
    asset_id: z.string().uuid(),
    type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSPECTION']),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('OPEN'),
    priority: z.number().int().min(1).max(4).default(3),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    problem_description: z.string().optional(),
    technician_id: z.string().uuid().optional(),
    due_date: z.string().datetime().optional(),
    condition_before: z.string().optional(),
    is_recurring: z.boolean().default(false),
    recurrence_rule: z.string().optional(),
    parent_wo_id: z.string().uuid().optional(),
    assigned_by_id: z.string().uuid().optional(),
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      order: z.number().default(0),
    })).optional(),
    parts: z.array(z.object({
      part_name: z.string(),
      part_number: z.string().optional(),
      quantity: z.number().int().positive().default(1),
      unit_cost: z.number().optional(),
      source: z.string().optional(),
      notes: z.string().optional(),
    })).optional(),
  }),
  response: { 201: workOrderDetailSchema, 400: errorResponse },
};

const updateWorkOrderSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSPECTION']).optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.number().int().min(1).max(4).optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional().nullable(),
    problem_description: z.string().optional().nullable(),
    root_cause: z.string().optional().nullable(),
    resolution: z.string().optional().nullable(),
    technician_id: z.string().uuid().optional().nullable(),
    due_date: z.string().datetime().optional().nullable(),
    labor_hours: z.number().optional().nullable(),
    labor_rate: z.number().optional().nullable(),
    parts_cost: z.number().optional().nullable(),
    total_cost: z.number().optional().nullable(),
    downtime_hours: z.number().optional().nullable(),
    condition_before: z.string().optional().nullable(),
    condition_after: z.string().optional().nullable(),
    is_recurring: z.boolean().optional(),
    recurrence_rule: z.string().optional().nullable(),
    assigned_by_id: z.string().uuid().optional().nullable(),
  }),
  response: { 200: workOrderDetailSchema, 400: errorResponse, 404: errorResponse },
};

const deleteWorkOrderSchema = {
  params: z.object({ id: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

const startWorkOrderSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    technician_id: z.string().uuid().optional(),
  }),
  response: { 200: workOrderDetailSchema, 400: errorResponse, 404: errorResponse },
};

const completeWorkOrderSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    resolution: z.string().optional(),
    root_cause: z.string().optional(),
    labor_hours: z.number().optional(),
    labor_rate: z.number().optional(),
    parts_cost: z.number().optional(),
    condition_after: z.string().optional(),
  }),
  response: { 200: workOrderDetailSchema, 400: errorResponse, 404: errorResponse },
};

const addTaskSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().default(0),
  }),
  response: { 201: z.object({ id: z.string() }), 400: errorResponse, 404: errorResponse },
};

const completeTaskSchema = {
  params: z.object({ id: z.string().uuid(), taskId: z.string().uuid() }),
  response: { 200: messageResponse, 404: errorResponse },
};

const addPartSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    part_name: z.string(),
    part_number: z.string().optional(),
    quantity: z.number().int().positive().default(1),
    unit_cost: z.number().optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
  }),
  response: { 201: z.object({ id: z.string() }), 400: errorResponse, 404: errorResponse },
};

const addLaborSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    technician_id: z.string().uuid(),
    date: z.string().datetime().optional(),
    hours: z.number().positive(),
    rate: z.number().optional(),
    description: z.string().optional(),
  }),
  response: { 201: z.object({ id: z.string() }), 400: errorResponse, 404: errorResponse },
};

const addAttachmentSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    url: z.string().url(),
    filename: z.string(),
    mime_type: z.string(),
    size: z.number().int().positive(),
    uploaded_by: z.string(),
  }),
  response: { 201: z.object({ id: z.string() }), 400: errorResponse, 404: errorResponse },
};

const addNoteSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    author_id: z.string(),
    content: z.string(),
    is_internal: z.boolean().default(false),
  }),
  response: { 201: z.object({ id: z.string() }), 400: errorResponse, 404: errorResponse },
};

export async function maintenanceRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // List work orders
  api.get('/', listWorkOrdersSchema, async (request) => {
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

  // Create work order
  api.post('/', createWorkOrderSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    // Verify asset exists
    const asset = await app.prisma.asset.findFirst({
      where: { id: request.body.asset_id, tenant_id: tenantId },
    });
    if (!asset) {
      return reply.code(400).send({ error: 'Asset not found', code: 'ASSET_NOT_FOUND' });
    }

    // Verify technician exists if provided
    if (request.body.technician_id) {
      const tech = await app.prisma.user.findFirst({
        where: { id: request.body.technician_id, tenant_id: tenantId },
      });
      if (!tech) {
        return reply.code(400).send({ error: 'Technician not found', code: 'TECHNICIAN_NOT_FOUND' });
      }
    }

    // Generate WO number
    const count = await app.prisma.maintenanceWorkOrder.count({ where: { tenant_id: tenantId } });
    const woNumber = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const { tasks, parts, ...data } = request.body;

    const wo = await app.prisma.maintenanceWorkOrder.create({
      data: {
        tenant_id: tenantId,
        wo_number: woNumber,
        created_by_id: userId,
        assigned_by_id: data.assigned_by_id,
        ...data,
        tasks: tasks?.length ? {
          create: tasks.map(t => ({
            ...t,
            order: t.order ?? 0,
          })),
        } : undefined,
        parts: parts?.length ? {
          create: parts.map(p => ({
            ...p,
            total_cost: p.unit_cost ? p.unit_cost * p.quantity : null,
          })),
        } : undefined,
      },
      include: {
        asset: { select: { id: true, asset_tag: true, make: true, model: true } },
        technician: { select: { id: true, first_name: true, last_name: true } },
        tasks: { orderBy: { order: 'asc' } },
        parts: true,
        labor_entries: true,
        attachments: true,
        notes: true,
        history: true,
      },
    });

    return reply.code(201).send({
      ...wo,
      technician_name: wo.technician ? `${wo.technician.first_name} ${wo.technician.last_name}` : null,
      created_by_name: null,
      assigned_by_name: null,
    });
  });

  // Get work order
  api.get('/:id', getWorkOrderSchema, async (request, reply) => {
    const wo = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: request.tenantId! },
      include: {
        asset: { select: { id: true, asset_tag: true, make: true, model: true } },
        technician: { select: { id: true, first_name: true, last_name: true } },
        created_by: { select: { id: true, first_name: true, last_name: true } },
        assigned_by: { select: { id: true, first_name: true, last_name: true } },
        tasks: { orderBy: { order: 'asc' } },
        parts: true,
        labor_entries: {
          include: { technician: { select: { id: true, first_name: true, last_name: true } } },
          orderBy: { date: 'desc' },
        },
        attachments: { orderBy: { created_at: 'desc' } },
        notes: {
          include: { author: { select: { id: true, first_name: true, last_name: true } } },
          orderBy: { created_at: 'desc' },
        },
        history: {
          include: { changed_by: { select: { id: true, first_name: true, last_name: true } } },
          orderBy: { changed_at: 'desc' },
        },
      },
    });

    if (!wo) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    return {
      ...wo,
      technician_name: wo.technician ? `${wo.technician.first_name} ${wo.technician.last_name}` : null,
      created_by_name: wo.created_by ? `${wo.created_by.first_name} ${wo.created_by.last_name}` : null,
      assigned_by_name: wo.assigned_by ? `${wo.assigned_by.first_name} ${wo.assigned_by.last_name}` : null,
      labor_hours: wo.labor_hours ? Number(wo.labor_hours) : null,
      labor_rate: wo.labor_rate ? Number(wo.labor_rate) : null,
      parts_cost: wo.parts_cost ? Number(wo.parts_cost) : null,
      total_cost: wo.total_cost ? Number(wo.total_cost) : null,
      downtime_hours: wo.downtime_hours ? Number(wo.downtime_hours) : null,
      tasks: wo.tasks.map(t => ({ ...t })),
      parts: wo.parts.map(p => ({ ...p, unit_cost: p.unit_cost ? Number(p.unit_cost) : null, total_cost: p.total_cost ? Number(p.total_cost) : null })),
      labor_entries: wo.labor_entries.map(l => ({ ...l, hours: Number(l.hours), rate: l.rate ? Number(l.rate) : null, technician_name: l.technician ? `${l.technician.first_name} ${l.technician.last_name}` : null })),
      attachments: wo.attachments.map(a => ({ ...a })),
      notes: wo.notes.map(n => ({ ...n, author_name: n.author ? `${n.author.first_name} ${n.author.last_name}` : null })),
      history: wo.history.map(h => ({ ...h, changed_by_name: h.changed_by ? `${h.changed_by.first_name} ${h.changed_by.last_name}` : null })),
    };
  });

  // Update work order
  api.put('/:id', updateWorkOrderSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    const updated = await app.prisma.maintenanceWorkOrder.update({
      where: { id: request.params.id },
      data: request.body,
      include: {
        asset: { select: { id: true, asset_tag: true, make: true, model: true } },
        technician: { select: { id: true, first_name: true, last_name: true } },
        created_by: { select: { id: true, first_name: true, last_name: true } },
        assigned_by: { select: { id: true, first_name: true, last_name: true } },
        tasks: { orderBy: { order: 'asc' } },
        parts: true,
        labor_entries: true,
        attachments: true,
        notes: true,
        history: true,
      },
    });

    return {
      ...updated,
      technician_name: updated.technician ? `${updated.technician.first_name} ${updated.technician.last_name}` : null,
      created_by_name: updated.created_by ? `${updated.created_by.first_name} ${updated.created_by.last_name}` : null,
      assigned_by_name: updated.assigned_by ? `${updated.assigned_by.first_name} ${updated.assigned_by.last_name}` : null,
      labor_hours: updated.labor_hours ? Number(updated.labor_hours) : null,
      labor_rate: updated.labor_rate ? Number(updated.labor_rate) : null,
      parts_cost: updated.parts_cost ? Number(updated.parts_cost) : null,
      total_cost: updated.total_cost ? Number(updated.total_cost) : null,
      downtime_hours: updated.downtime_hours ? Number(updated.downtime_hours) : null,
    };
  });

  // Delete work order
  api.delete('/:id', deleteWorkOrderSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    await app.prisma.maintenanceWorkOrder.update({
      where: { id: request.params.id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Work order deleted' };
  });

  // Start work order
  api.post('/:id/start', startWorkOrderSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const existing = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    if (existing.status !== 'OPEN') {
      return reply.code(400).send({ error: 'Work order must be OPEN to start', code: 'INVALID_STATUS' });
    }

    const technicianId = request.body.technician_id || existing.technician_id;
    if (technicianId) {
      const tech = await app.prisma.user.findFirst({
        where: { id: technicianId, tenant_id: tenantId },
      });
      if (!tech) {
        return reply.code(400).send({ error: 'Technician not found', code: 'TECHNICIAN_NOT_FOUND' });
      }
    }

    const updated = await app.prisma.maintenanceWorkOrder.update({
      where: { id: request.params.id },
      data: {
        status: 'IN_PROGRESS',
        technician_id: technicianId,
        started_at: new Date(),
        assigned_at: existing.assigned_at || new Date(),
      },
      include: {
        asset: { select: { id: true, asset_tag: true, make: true, model: true } },
        technician: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    return {
      ...updated,
      technician_name: updated.technician ? `${updated.technician.first_name} ${updated.technician.last_name}` : null,
    };
  });

  // Complete work order
  api.post('/:id/complete', completeWorkOrderSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const existing = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    if (existing.status !== 'IN_PROGRESS' && existing.status !== 'ON_HOLD') {
      return reply.code(400).send({ error: 'Work order must be IN_PROGRESS or ON_HOLD to complete', code: 'INVALID_STATUS' });
    }

    const { resolution, root_cause, labor_hours, labor_rate, parts_cost, condition_after } = request.body;
    const totalCost = (labor_hours || 0) * (labor_rate || 0) + (parts_cost || 0);

    const updated = await app.prisma.maintenanceWorkOrder.update({
      where: { id: request.params.id },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        resolution,
        root_cause,
        labor_hours,
        labor_rate,
        parts_cost,
        total_cost: totalCost,
        condition_after,
      },
      include: {
        asset: { select: { id: true, asset_tag: true, make: true, model: true } },
        technician: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    // Update asset condition
    if (condition_after) {
      await app.prisma.asset.update({
        where: { id: existing.asset_id },
        data: { condition: condition_after },
      });
    }

    return {
      ...updated,
      technician_name: updated.technician ? `${updated.technician.first_name} ${updated.technician.last_name}` : null,
      labor_hours: updated.labor_hours ? Number(updated.labor_hours) : null,
      labor_rate: updated.labor_rate ? Number(updated.labor_rate) : null,
      parts_cost: updated.parts_cost ? Number(updated.parts_cost) : null,
      total_cost: updated.total_cost ? Number(updated.total_cost) : null,
      downtime_hours: updated.downtime_hours ? Number(updated.downtime_hours) : null,
    };
  });

  // Add task
  api.post('/:id/tasks', addTaskSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    const maxOrder = await app.prisma.maintenanceTask.aggregate({
      where: { wo_id: request.params.id },
      _max: { order: true },
    });

    const task = await app.prisma.maintenanceTask.create({
      data: {
        wo_id: request.params.id,
        ...request.body,
        order: request.body.order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });

    return reply.code(201).send(task);
  });

  // Complete task
  api.post('/:id/tasks/:taskId/complete', completeTaskSchema, async (request, reply) => {
    const tenantId = request.tenantId!;
    const userId = request.user!.id;

    const existing = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    const task = await app.prisma.maintenanceTask.findFirst({
      where: { id: request.params.taskId, wo_id: request.params.id },
    });
    if (!task) {
      return reply.code(404).send({ error: 'Task not found', code: 'NOT_FOUND' });
    }

    if (task.is_completed) {
      return reply.code(400).send({ error: 'Task already completed', code: 'ALREADY_COMPLETED' });
    }

    await app.prisma.maintenanceTask.update({
      where: { id: request.params.taskId },
      data: {
        is_completed: true,
        completed_at: new Date(),
        completed_by: userId,
      },
    });

    // Check if all tasks completed
    const incompleteCount = await app.prisma.maintenanceTask.count({
      where: { wo_id: request.params.id, is_completed: false },
    });

    if (incompleteCount === 0 && existing.status === 'IN_PROGRESS') {
      await app.prisma.maintenanceWorkOrder.update({
        where: { id: request.params.id },
        data: { status: 'COMPLETED', completed_at: new Date() },
      });
    }

    return { message: 'Task completed' };
  });

  // Add part
  api.post('/:id/parts', addPartSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    const part = await app.prisma.maintenancePart.create({
      data: {
        wo_id: request.params.id,
        ...request.body,
        total_cost: request.body.unit_cost ? request.body.unit_cost * request.body.quantity : null,
      },
    });

    return reply.code(201).send(part);
  });

  // Add labor
  api.post('/:id/labor', addLaborSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    // Verify technician
    const tech = await app.prisma.user.findFirst({
      where: { id: request.body.technician_id, tenant_id: tenantId },
    });
    if (!tech) {
      return reply.code(400).send({ error: 'Technician not found', code: 'TECHNICIAN_NOT_FOUND' });
    }

    const labor = await app.prisma.maintenanceLabor.create({
      data: {
        wo_id: request.params.id,
        ...request.body,
        date: request.body.date ? new Date(request.body.date) : new Date(),
      },
    });

    return reply.code(201).send(labor);
  });

  // Add attachment
  api.post('/:id/attachments', addAttachmentSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    const attachment = await app.prisma.maintenanceAttachment.create({
      data: {
        wo_id: request.params.id,
        ...request.body,
      },
    });

    return reply.code(201).send(attachment);
  });

  // Add note
  api.post('/:id/notes', addNoteSchema, async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await app.prisma.maintenanceWorkOrder.findFirst({
      where: { id: request.params.id, tenant_id: tenantId },
    });
    if (!existing) {
      return reply.code(404).send({ error: 'Work order not found', code: 'NOT_FOUND' });
    }

    const note = await app.prisma.maintenanceNote.create({
      data: {
        wo_id: request.params.id,
        ...request.body,
      },
    });

    return reply.code(201).send(note);
  });
}