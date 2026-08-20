// backend/src/routes/auth.ts
// Authentication routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { hashPassword, verifyPassword } from '../plugins/auth.js';

// JWT keys for token signing
const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || fs.readFileSync(path.resolve('keys/private.pem'), 'utf-8');
const REFRESH_PRIVATE_KEY = process.env.JWT_REFRESH_PRIVATE_KEY || fs.readFileSync(path.resolve('keys/refresh-private.pem'), 'utf-8');

// ============================================
// Zod Schemas for validation (input only)
// ============================================

const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

const forgotPasswordInput = z.object({
  email: z.string().email(),
});

const resetPasswordInput = z.object({
  token: z.string(),
  password: z.string().min(12),
});

const changePasswordInput = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12),
  confirmPassword: z.string().min(12),
  additionalProperties: true,
});

const registerInput = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  tenantName: z.string().min(1).max(100).optional(),
});

const mfaSetupResponse = z.object({
  secret: z.string(),
  qrCode: z.string(),
  backupCodes: z.array(z.string()),
});

const mfaVerifyInput = z.object({
  code: z.string().length(6),
});

const updateProfileInput = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

const avatarUploadInput = z.object({
  avatarBase64: z.string(),
});

const errorResponse = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    code: { type: 'string' },
  },
  required: ['error', 'code'],
};

const messageResponse = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
};

const userResponse = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    role: { type: 'string' },
    tenantId: { type: 'string' },
    mfaEnabled: { type: 'boolean' },
    avatarUrl: { type: 'string', nullable: true },
    timezone: { type: 'string' },
    createdAt: { type: 'string' },
  },
  required: ['id', 'email', 'firstName', 'lastName', 'role', 'tenantId', 'mfaEnabled', 'avatarUrl', 'timezone', 'createdAt'],
};

const loginResponse = {
  type: 'object',
  properties: {
    user: userResponse,
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
  },
  required: ['user', 'accessToken', 'refreshToken'],
};

const meResponse = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    role: { type: 'string' },
    tenantId: { type: 'string' },
    mfaEnabled: { type: 'boolean' },
    avatarUrl: { type: 'string', nullable: true },
    timezone: { type: 'string' },
  },
  required: ['id', 'email', 'firstName', 'lastName', 'role', 'tenantId', 'mfaEnabled', 'avatarUrl', 'timezone'],
};

// ============================================
// Route Schemas (inline JSON Schema for Fastify compatibility)
// ============================================

const loginSchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      password: { type: 'string', minLength: 1 },
      rememberMe: { type: 'boolean' },
    },
    required: ['email', 'password'],
  },
  response: {
    200: loginResponse,
    401: errorResponse,
  },
};

const forgotPasswordSchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
    },
    required: ['email'],
  },
  response: {
    200: messageResponse,
    404: errorResponse,
  },
};

const resetPasswordSchema = {
  body: {
    type: 'object',
    properties: {
      token: { type: 'string' },
      password: { type: 'string', minLength: 12 },
    },
    required: ['token', 'password'],
  },
  response: {
    200: messageResponse,
    400: errorResponse,
  },
};

const changePasswordSchema = {
  body: {
    type: 'object',
    properties: {
      currentPassword: { type: 'string', minLength: 1 },
      newPassword: { type: 'string', minLength: 12 },
    },
    required: ['currentPassword', 'newPassword'],
  },
  response: {
    200: messageResponse,
    400: errorResponse,
    401: errorResponse,
  },
};

const registerSchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      password: { type: 'string', minLength: 12 },
      firstName: { type: 'string', minLength: 1, maxLength: 50 },
      lastName: { type: 'string', minLength: 1, maxLength: 50 },
      tenantName: { type: 'string', minLength: 1, maxLength: 100 },
    },
    required: ['email', 'password', 'firstName', 'lastName'],
  },
  response: {
    201: loginResponse,
    400: errorResponse,
    409: errorResponse,
  },
};

const mfaSetupSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        secret: { type: 'string' },
        qrCode: { type: 'string' },
        backupCodes: { type: 'array', items: { type: 'string' } },
      },
      required: ['secret', 'qrCode', 'backupCodes'],
    },
    400: errorResponse,
  },
};

const mfaVerifySchema = {
  body: {
    type: 'object',
    properties: {
      code: { type: 'string', minLength: 6, maxLength: 6 },
    },
    required: ['code'],
  },
  response: {
    200: messageResponse,
    400: errorResponse,
  },
};

const mfaDisableSchema = {
  body: {
    type: 'object',
    properties: {
      code: { type: 'string', minLength: 6, maxLength: 6 },
    },
    required: ['code'],
  },
  response: {
    200: messageResponse,
    400: errorResponse,
  },
};

const updateProfileSchema = {
  body: {
    type: 'object',
    additionalProperties: true,
    properties: {
      firstName: { type: 'string', maxLength: 50 },
      lastName: { type: 'string', maxLength: 50 },
      timezone: { type: 'string' },
      language: { type: 'string' },
    },
  },
  response: {
    200: userResponse,
    400: errorResponse,
  },
};

const avatarUploadSchema = {
  body: {
    type: 'object',
    properties: {
      avatarBase64: { type: 'string' },
    },
    required: ['avatarBase64'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        avatarUrl: { type: 'string' },
      },
      required: ['avatarUrl'],
    },
    400: errorResponse,
  },
};

interface AuthUser {
  id: string;
  tenantId: string;
  role: string;
  email: string;
}

function generateTotpSecret(): string {
  const secret = crypto.randomBytes(10).toString('base32');
  return secret.replace(/=/g, '');
}

function verifyTotp(secret: string, token: string): boolean {
  const timeStep = Math.floor(Date.now() / 30000);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(timeStep));

  const key = Buffer.from(secret, 'base32');
  const hmac = crypto.createHmac('sha1', key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24 | hmac[offset + 1] << 16 | hmac[offset + 2] << 8 | hmac[offset + 3]) % 1000000;
  return code.toString().padStart(6, '0') === token;
}

export async function authRoutes(app: FastifyInstance) {
  // Use the app directly (it already has the prefix from app.register())
  // Don't create a new api instance - just add routes to app

  // Login
  app.post('/login', { schema: loginSchema }, async (request, reply) => {
    const { email, password, rememberMe } = request.body as { email: string; password: string; rememberMe?: boolean };

    // First find user by email to get tenant_id
    const userWithTenant = await app.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    }) as AuthUser | null;

    if (!userWithTenant || !userWithTenant.password_hash) {
      return reply.status(401).send({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    if (userWithTenant.status !== 'ACTIVE') {
      return reply.status(403).send({ error: 'Account is not active', code: 'ACCOUNT_INACTIVE' });
    }

    const valid = await verifyPassword(password, userWithTenant.password_hash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    // Generate tokens
    // Use the default JWT instance with explicit key options
    const accessToken = app.jwt.sign(
      { userId: userWithTenant.id, tenantId: userWithTenant.tenant_id, role: userWithTenant.role },
      { expiresIn: '15m', key: PRIVATE_KEY }
    );

    const refreshToken = app.jwt.sign(
      { userId: userWithTenant.id },
      { expiresIn: rememberMe ? '30d' : '7d', key: REFRESH_PRIVATE_KEY }
    );

    // Update last login
    await app.prisma.user.update({
      where: { id: userWithTenant.id },
      data: { last_login_at: new Date() },
    });

    // Set cookies
    const accessMaxAge = 15 * 60; // 15 minutes
    const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days

    reply
      .setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: accessMaxAge,
        path: '/',
      })
      .setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: refreshMaxAge,
        path: '/',
      });

    return {
      user: {
        id: userWithTenant.id,
        email: userWithTenant.email,
        firstName: userWithTenant.first_name,
        lastName: userWithTenant.last_name,
        role: userWithTenant.role,
        tenantId: userWithTenant.tenant_id,
        mfaEnabled: userWithTenant.mfa_enabled,
        avatarUrl: userWithTenant.avatar_url,
        timezone: userWithTenant.timezone,
        createdAt: userWithTenant.created_at.toISOString(),
      },
      accessToken,
      refreshToken,
    };
  });

  // Forgot password
  app.post('/forgot-password', { schema: forgotPasswordSchema }, async (request, reply) => {
    const { email } = request.body as { email: string };

    const user = await app.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link will be sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
      },
    });

    // TODO: Send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If the email exists, a reset link will be sent' };
  });

  // Reset password
  app.post('/reset-password', { schema: resetPasswordSchema }, async (request, reply) => {
    const { token, password } = request.body as { token: string; password: string };

    const user = await app.prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expiry: { gt: new Date() },
      },
    });

    if (!user) {
      return reply.status(400).send({ error: 'Invalid or expired reset token', code: 'INVALID_RESET_TOKEN' });
    }

    const passwordHash = await hashPassword(password);

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null,
        password_changed_at: new Date(),
      },
    });

    return { message: 'Password reset successful' };
  });

  // Register
  app.post('/register', { schema: registerSchema }, async (request, reply) => {
    const { email, password, firstName, lastName, tenantName } = request.body as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      tenantName?: string;
    };

    // Check if user with this email already exists in any tenant
    const existing = await app.prisma.user.findFirst({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered', code: 'EMAIL_EXISTS' });
    }

    const passwordHash = await hashPassword(password);

    const tenant = await app.prisma.tenant.create({
      data: {
        name: tenantName || `${firstName}'s Organization`,
        slug: crypto.randomBytes(8).toString('hex'),
        plan: 'FREE',
        max_assets: 1000,
        max_users: 50,
        max_storage_gb: 10,
      },
    });

    const user = await app.prisma.user.create({
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

    const accessToken = app.jwt.sign(
      { userId: user.id, tenantId: tenant.id, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = app.jwt.sign(
      { userId: user.id },
      { expiresIn: '7d' }
    );

    reply
      .setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60,
        path: '/',
      })
      .setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

    return reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        tenantId: tenant.id,
        mfaEnabled: false,
        avatarUrl: null,
        timezone: 'UTC',
        createdAt: user.created_at.toISOString(),
      },
      accessToken,
      refreshToken,
    });
  });

  // MFA Setup
  app.post('/mfa/setup', { schema: mfaSetupSchema }, async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', code: 'NO_ACCESS_TOKEN' });
    }

    const fullUser = await app.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      return reply.status(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    if (fullUser.mfa_enabled) {
      return reply.status(400).send({ error: 'MFA already enabled', code: 'MFA_ALREADY_ENABLED' });
    }

    const secret = generateTotpSecret();
    const otpauth = `otpauth://totp/AssetMT:${user.email}?secret=${secret}&issuer=AssetMT`;

    const qrCode = await import('qrcode').then(m => m.default.toDataURL(otpauth));

    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        mfa_secret: secret,
        mfa_backup_codes: backupCodes,
      },
    });

    return { secret, qrCode, backupCodes };
  });

  // MFA Verify
  app.post('/mfa/verify', { schema: mfaVerifySchema }, async (request, reply) => {
    const { code } = request.body as { code: string };
    const user = request.user as AuthUser | undefined;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', code: 'NO_ACCESS_TOKEN' });
    }

    const fullUser = await app.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser || !fullUser.mfa_secret) {
      return reply.status(400).send({ error: 'MFA not set up', code: 'MFA_NOT_SETUP' });
    }

    const valid = verifyTotp(fullUser.mfa_secret, code);

    // Also check backup codes
    if (!valid && fullUser.mfa_backup_codes) {
      const idx = fullUser.mfa_backup_codes.indexOf(code.toUpperCase());
      if (idx !== -1) {
        // Remove used backup code
        const newBackupCodes = fullUser.mfa_backup_codes.filter((_, i) => i !== idx);
        await app.prisma.user.update({
          where: { id: user.id },
          data: { mfa_backup_codes: newBackupCodes },
        });
        valid = true;
      }
    }

    if (!valid) {
      return reply.status(400).send({ error: 'Invalid code', code: 'INVALID_MFA_CODE' });
    }

    await app.prisma.user.update({
      where: { id: user.id },
      data: { mfa_enabled: true },
    });

    return { message: 'MFA enabled successfully' };
  });

  // MFA Disable
  app.post('/mfa/disable', { schema: mfaDisableSchema }, async (request, reply) => {
    const { code } = request.body as { code: string };
    const user = request.user as AuthUser | undefined;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', code: 'NO_ACCESS_TOKEN' });
    }

    const fullUser = await app.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser || !fullUser.mfa_secret) {
      return reply.status(400).send({ error: 'MFA not enabled', code: 'MFA_NOT_ENABLED' });
    }

    const valid = verifyTotp(fullUser.mfa_secret, code);

    if (!valid && fullUser.mfa_backup_codes) {
      const idx = fullUser.mfa_backup_codes.indexOf(code.toUpperCase());
      if (idx !== -1) {
        valid = true;
      }
    }

    if (!valid) {
      return reply.status(400).send({ error: 'Invalid code', code: 'INVALID_MFA_CODE' });
    }

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        mfa_enabled: false,
        mfa_secret: null,
        mfa_backup_codes: [],
      },
    });

    return { message: 'MFA disabled successfully' };
  });

  // Refresh token
  app.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({ error: 'No refresh token', code: 'NO_REFRESH_TOKEN' });
    }

    try {
      const decoded = await request.jwtVerify<{ userId: string }>({ namespace: 'refresh' });
      const user = await app.prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { tenant: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        return reply.status(401).send({ error: 'User not found or inactive', code: 'USER_INACTIVE' });
      }

      const accessToken = app.jwt.sign(
        { userId: user.id, tenantId: user.tenant_id, role: user.role },
        { expiresIn: '15m' }
      );

      const newRefreshToken = app.jwt.sign(
        { userId: user.id },
        { expiresIn: '7d', namespace: 'refresh' }
      );

      reply
        .setCookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60,
          path: '/',
        })
        .setCookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          tenantId: user.tenant_id,
          mfaEnabled: user.mfa_enabled,
          avatarUrl: user.avatar_url,
          timezone: user.timezone,
          createdAt: user.created_at.toISOString(),
        },
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      return reply.status(401).send({ error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }
  });

  // Logout
  app.post('/logout', async (request, reply) => {
    reply
      .clearCookie('accessToken', { path: '/' })
      .clearCookie('refreshToken', { path: '/' });
    return { message: 'Logged out successfully' };
  });

  // Get current user
  app.get('/me', { schema: { response: { 200: meResponse, 404: errorResponse } } }, async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', code: 'NO_ACCESS_TOKEN' });
    }

    const fullUser = await app.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        tenant_id: true,
        mfa_enabled: true,
        avatar_url: true,
        timezone: true,
      },
    });

    if (!fullUser) {
      return reply.status(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    return {
      id: fullUser.id,
      email: fullUser.email,
      firstName: fullUser.first_name,
      lastName: fullUser.last_name,
      role: fullUser.role,
      tenantId: fullUser.tenant_id,
      mfaEnabled: fullUser.mfa_enabled,
      avatarUrl: fullUser.avatar_url,
      timezone: fullUser.timezone,
    };
  });

  // Update profile
  app.patch('/me', { schema: updateProfileSchema }, async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', code: 'NO_ACCESS_TOKEN' });
    }

    // Convert camelCase to snake_case for Prisma
    const { firstName, lastName, ...rest } = request.body as any;
    const updateData: any = { ...rest };
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;

    const updated = await app.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.first_name,
      lastName: updated.last_name,
      role: updated.role,
      tenantId: updated.tenant_id,
      mfaEnabled: updated.mfa_enabled,
      avatarUrl: updated.avatar_url,
      timezone: updated.timezone,
      createdAt: updated.created_at.toISOString(),
    };
  });

  // Change password
  app.post('/change-password', { schema: changePasswordSchema }, async (request, reply) => {
    const { currentPassword, newPassword, confirmPassword } = request.body as { currentPassword: string; newPassword: string; confirmPassword: string };
    const user = request.user as AuthUser | undefined;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', code: 'NO_ACCESS_TOKEN' });
    }

    if (newPassword !== confirmPassword) {
      return reply.status(400).send({ error: 'Passwords do not match', code: 'PASSWORD_MISMATCH' });
    }

    const fullUser = await app.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser || !fullUser.password_hash) {
      return reply.status(401).send({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const valid = await verifyPassword(currentPassword, fullUser.password_hash);
    if (!valid) {
      return reply.status(401).send({ error: 'Current password is incorrect', code: 'INVALID_CURRENT_PASSWORD' });
    }

    const passwordHash = await hashPassword(newPassword);

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
      },
    });

    return { message: 'Password changed successfully' };
  });

  // Upload avatar
  app.post('/me/avatar', { schema: avatarUploadSchema }, async (request, reply) => {
    const { avatarBase64 } = request.body as { avatarBase64: string };
    const user = request.user as AuthUser | undefined;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', code: 'NO_ACCESS_TOKEN' });
    }

    // TODO: Upload to storage
    const avatarUrl = `/uploads/avatars/${user.id}.png`;

    await app.prisma.user.update({
      where: { id: user.id },
      data: { avatar_url: avatarUrl },
    });

    return { avatarUrl };
  });

  // Verify email
  app.get('/verify-email', { 
    schema: { 
      querystring: {
        type: 'object',
        properties: {
          token: { type: 'string' }
        },
        required: ['token']
      },
      response: { 200: messageResponse, 400: errorResponse } 
    } 
  }, async (request, reply) => {
    const { token } = request.query as { token: string };

    const user = await app.prisma.user.findFirst({
      where: { email_verification_token: token },
    });

    if (!user) {
      return reply.status(400).send({ error: 'Invalid verification token', code: 'INVALID_VERIFICATION_TOKEN' });
    }

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        email_verification_token: null,
      },
    });

    return { message: 'Email verified successfully' };
  });

  // Resend verification
  app.post('/resend-verification', { 
    schema: { 
      response: { 
        200: messageResponse 
      } 
    } 
  }, async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', code: 'NO_ACCESS_TOKEN' });
    }

    const fullUser = await app.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser || fullUser.email_verified) {
      return { message: 'Email already verified' };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    await app.prisma.user.update({
      where: { id: user.id },
      data: { email_verification_token: verificationToken },
    });

    // TODO: Send verification email
    console.log(`Verification token for ${fullUser.email}: ${verificationToken}`);

    return { message: 'Verification email sent' };
  });
}

