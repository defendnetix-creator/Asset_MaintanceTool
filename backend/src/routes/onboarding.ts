// backend/src/routes/onboarding.ts
// Multi-tenant onboarding routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import crypto from 'crypto';
import { hashPassword } from '../plugins/auth.js';

const registerInputSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 12 },
    firstName: { type: 'string', minLength: 1, maxLength: 50 },
    lastName: { type: 'string', minLength: 1, maxLength: 50 },
    companyName: { type: 'string', minLength: 1, maxLength: 100 },
    companySlug: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-z0-9-]+$' },
    plan: { type: 'string', enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'] },
    logoBase64: { type: 'string' },
  },
  required: ['email', 'password', 'firstName', 'lastName', 'companyName', 'companySlug'],
};

const checkSlugInputSchema = {
  type: 'object',
  properties: {
    slug: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-z0-9-]+$' },
  },
  required: ['slug'],
};

const onboardingResponseSchema = {
  type: 'object',
  properties: {
    tenant: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
        plan: { type: 'string' },
      },
      required: ['id', 'name', 'slug', 'plan'],
    },
    user: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string', format: 'email' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string' },
        tenantId: { type: 'string' },
      },
      required: ['id', 'email', 'firstName', 'lastName', 'role', 'tenantId'],
    },
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
  },
  required: ['tenant', 'user', 'accessToken', 'refreshToken'],
};

export async function onboardingRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // Check if slug is available
  api.get('/check-slug', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          slug: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-z0-9-]+$' },
        },
        required: ['slug'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            available: { type: 'boolean' },
            slug: { type: 'string' },
          },
          required: ['available', 'slug'],
        },
      },
    },
  }, async (request) => {
    const { slug } = request.query as { slug: string };
    
    const existing = await app.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    return { available: !existing, slug };
  });

  // Register new company/tenant with admin user
  api.post('/register', {
    schema: {
      body: registerInputSchema,
      response: {
        201: onboardingResponseSchema,
        400: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
        409: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' } }, required: ['error', 'code'] },
      },
    },
  }, async (request, reply) => {
    const { email, password, firstName, lastName, companyName, companySlug, plan, logoBase64 } = request.body;

    // Check if email already exists
    const existingUser = await app.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return reply.status(409).send({ error: 'Email already registered', code: 'EMAIL_EXISTS' });
    }

    // Check if slug is taken
    const existingTenant = await app.prisma.tenant.findUnique({
      where: { slug: companySlug },
    });

    if (existingTenant) {
      return reply.status(409).send({ error: 'Company slug already taken', code: 'SLUG_EXISTS' });
    }

    // Create tenant with plan limits
    const planLimits = {
      FREE: { max_assets: 100, max_users: 5, max_storage_gb: 1 },
      STARTER: { max_assets: 1000, max_users: 25, max_storage_gb: 10 },
      PROFESSIONAL: { max_assets: 10000, max_users: 100, max_storage_gb: 100 },
      ENTERPRISE: { max_assets: 100000, max_users: 1000, max_storage_gb: 1000 },
    };

    const limits = planLimits[plan] || planLimits.FREE;

    // Handle logo upload if provided
    let logoUrl = null;
    if (logoBase64) {
      // TODO: Upload to MinIO
      // For now, store as data URL placeholder
      logoUrl = logoBase64;
    }

    // Create tenant and admin user in a transaction
    const result = await app.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug: companySlug,
          plan,
          max_assets: limits.max_assets,
          max_users: limits.max_users,
          max_storage_gb: limits.max_storage_gb,
          logo_url: logoUrl,
          settings: {
            theme: 'light',
            language: 'en',
            date_format: 'MM/DD/YYYY',
            time_format: '12h',
            currency: 'USD',
            timezone: 'UTC',
          },
        },
      });

      // Create admin user
      const passwordHash = await hashPassword(password);

      const adminUser = await tx.user.create({
        data: {
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          role: 'TENANT_ADMIN',
          tenant_id: tenant.id,
          status: 'ACTIVE',
        },
      });

      return { tenant, adminUser };
    });

    // Generate tokens
    const accessToken = app.jwt.sign(
      { userId: result.adminUser.id, tenantId: result.tenant.id, role: result.adminUser.role },
      { expiresIn: '15m' }
    );

    const refreshToken = app.jwt.sign(
      { userId: result.adminUser.id },
      { expiresIn: '7d', namespace: 'refresh' }
    );

    reply
      .setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60,
        path: '/',
      })
      .setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

    return reply.status(201).send({
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.plan,
      },
      user: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        firstName: result.adminUser.first_name,
        lastName: result.adminUser.last_name,
        role: result.adminUser.role,
        tenantId: result.adminUser.tenant_id,
      },
      accessToken,
      refreshToken,
    });
  });

  // Upload company logo
  api.post('/upload-logo', {
    schema: {
      body: {
        type: 'object',
        properties: {
          logoBase64: { type: 'string' },
        },
        required: ['logoBase64'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            logoUrl: { type: 'string' },
          },
          required: ['logoUrl'],
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
          },
          required: ['error', 'code'],
        },
      },
    },
  }, async (request, reply) => {
    const { logoBase64 } = request.body;
    const user = request.user as { tenantId: string } | undefined;

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', code: 'NO_ACCESS_TOKEN' });
    }

    // TODO: Upload to MinIO and return public URL
    // For now, return the base64 as data URL
    const logoUrl = logoBase64;

    await app.prisma.tenant.update({
      where: { id: user.tenantId },
      data: { logo_url: logoUrl },
    });

    return { logoUrl };
  });

  // Get tenant info (for onboarding progress)
  api.get('/tenant-info', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            plan: { type: 'string' },
            logoUrl: { type: 'string', nullable: true },
          },
          required: ['id', 'name', 'slug', 'plan'],
        },
      },
    },
  }, async (request) => {
    const user = request.user as { tenantId: string } | undefined;
    if (!user) {
      return { id: '', name: '', slug: '', plan: '', logoUrl: null };
    }

    const tenant = await app.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, name: true, slug: true, plan: true, logo_url: true },
    });

    return {
      id: tenant?.id || '',
      name: tenant?.name || '',
      slug: tenant?.slug || '',
      plan: tenant?.plan || 'FREE',
      logoUrl: tenant?.logo_url || null,
    };
  });
}

export default onboardingRoutes;