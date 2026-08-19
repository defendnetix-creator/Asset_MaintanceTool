// backend/src/routes/auth.ts
// Authentication routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '../plugins/auth.js';

const loginResponse = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
    tenantId: z.string(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
});

const errorResponse = z.object({
  error: z.string(),
  code: z.string(),
});

const messageResponse = z.object({ message: z.string() });

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    rememberMe: z.boolean().optional(),
  }),
  response: {
    200: loginResponse,
    401: errorResponse,
  },
};

const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email(),
  }),
  response: {
    200: messageResponse,
    404: errorResponse,
  },
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string(),
    password: z.string().min(12),
  }),
  response: {
    200: messageResponse,
    400: errorResponse,
  },
};

const mfaVerifySchema = {
  body: z.object({
    token: z.string().length(6),
  }),
  response: {
    200: z.object({ message: z.string(), backupCodes: z.array(z.string()) }),
    400: errorResponse,
  },
};

const mfaDisableSchema = {
  body: z.object({
    password: z.string(),
  }),
  response: {
    200: messageResponse,
    400: errorResponse,
    401: errorResponse,
  },
};

const mfaChallengeSchema = {
  body: z.object({
    email: z.string().email(),
    token: z.string().length(6),
  }),
  response: {
    200: z.object({ accessToken: z.string(), refreshToken: z.string() }),
    400: errorResponse,
    401: errorResponse,
  },
};

const meResponse = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  tenantId: z.string(),
  mfaEnabled: z.boolean(),
  avatarUrl: z.string().nullable(),
  timezone: z.string(),
  language: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // Login
  api.post('/login', loginSchema, async (request, reply) => {
    const { email, password, rememberMe } = request.body;

    const user = await app.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !user.password_hash) {
      return reply.code(401).send({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    if (user.status !== 'ACTIVE') {
      return reply.code(403).send({ error: 'Account is not active', code: 'ACCOUNT_INACTIVE' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    // Generate tokens
    const accessToken = app.jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = app.refreshJwt.sign(
      { userId: user.id },
      { expiresIn: rememberMe ? '30d' : '7d' }
    );

    // Update last login
    await app.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // Set cookies
    const accessMaxAge = 15 * 60; // 15 minutes
    const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days

    reply
      .setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: accessMaxAge,
        path: '/',
      })
      .setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: refreshMaxAge,
        path: '/',
      });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        tenantId: user.tenantId,
      },
      accessToken,
      refreshToken,
    };
  });

  // Refresh token
  api.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.code(401).send({ error: 'Refresh token required', code: 'NO_REFRESH_TOKEN' });
    }

    try {
      const decoded = await request.refreshJwtVerify<{ userId: string }>();
      const user = await app.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, tenantId: true, role: true, email: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        return reply.code(401).send({ error: 'User not found or inactive', code: 'USER_INACTIVE' });
      }

      const accessToken = app.jwt.sign(
        { userId: user.id, tenantId: user.tenantId, role: user.role },
        { expiresIn: '15m' }
      );

      const newRefreshToken = app.refreshJwt.sign(
        { userId: user.id },
        { expiresIn: '7d' }
      );

      reply
        .setCookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60, path: '/' })
        .setCookie('refreshToken', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60, path: '/' });

      return { accessToken, refreshToken };
    } catch {
      reply.clearCookie('accessToken', { path: '/' });
      reply.clearCookie('refreshToken', { path: '/' });
      return reply.code(401).send({ error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }
  });

  // Logout
  api.post('/logout', async (request, reply) => {
    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });
    return { message: 'Logged out' };
  });

  // Me
  api.get('/me', {
    schema: { response: { 200: meResponse, 404: errorResponse } },
  }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user!.id },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        tenantId: true,
        mfa_enabled: true,
        avatar_url: true,
        timezone: true,
        language: true,
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenantId,
      mfaEnabled: user.mfa_enabled,
      avatarUrl: user.avatar_url,
      timezone: user.timezone,
      language: user.language,
    };
  });

  // Forgot password
  api.post('/forgot-password', forgotPasswordSchema, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { email: request.body.email },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    // Generate reset token (in production, send via email)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await hashPassword(resetToken);

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        mfa_secret: resetTokenHash, // Reuse field for password reset token
        updated_at: new Date(),
      },
    });

    // TODO: Send email with reset link
    // For now, return token in response (dev only)
    return { message: 'Password reset initiated', resetToken };
  });

  // Reset password
  api.post('/reset-password', resetPasswordSchema, async (request, reply) => {
    const { token, password } = request.body;
    const tokenHash = await hashPassword(token);

    const user = await app.prisma.user.findFirst({
      where: { mfa_secret: tokenHash },
    });

    if (!user) {
      return reply.code(400).send({ error: 'Invalid or expired reset token', code: 'INVALID_RESET_TOKEN' });
    }

    const newPasswordHash = await hashPassword(password);

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: newPasswordHash,
        mfa_secret: null, // Clear reset token
        updated_at: new Date(),
      },
    });

    return { message: 'Password reset successful' };
  });

  // MFA setup
  api.post('/mfa/setup', async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user!.id },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
    }

    if (user.mfa_enabled) {
      return reply.code(400).send({ error: 'MFA already enabled', code: 'MFA_ALREADY_ENABLED' });
    }

    // Generate TOTP secret
    const secret = crypto.randomBytes(20).toString('base32');
    const otpauth = `otpauth://totp/AssetMT:${user.email}?secret=${secret}&issuer=AssetMT`;

    // Store secret temporarily (not enabled yet)
    await app.prisma.user.update({
      where: { id: user.id },
      data: { mfa_secret: secret },
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());

    return {
      secret,
      otpauth,
      backupCodes,
    };
  });

  // MFA verify (enable)
  api.post('/mfa/verify', mfaVerifySchema, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user!.id },
    });

    if (!user || !user.mfa_secret) {
      return reply.code(400).send({ error: 'MFA setup not initiated', code: 'MFA_NOT_INITIATED' });
    }

    // Verify TOTP token
    const speakeasy = await import('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: request.body.token,
      window: 1,
    });

    if (!verified) {
      return reply.code(400).send({ error: 'Invalid MFA token', code: 'INVALID_MFA_TOKEN' });
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        mfa_enabled: true,
        backup_codes: backupCodes,
        updated_at: new Date(),
      },
    });

    return { message: 'MFA enabled successfully', backupCodes };
  });

  // MFA disable
  api.post('/mfa/disable', mfaDisableSchema, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user!.id },
    });

    if (!user || !user.password_hash) {
      return reply.code(401).send({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const valid = await verifyPassword(request.body.password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
    }

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        mfa_enabled: false,
        mfa_secret: null,
        backup_codes: [],
        updated_at: new Date(),
      },
    });

    return { message: 'MFA disabled successfully' };
  });

  // Verify MFA token (for login)
  api.post('/mfa/challenge', mfaChallengeSchema, async (request, reply) => {
    const { email, token } = request.body;

    const user = await app.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !user.mfa_enabled || !user.mfa_secret) {
      return reply.code(401).send({ error: 'MFA not enabled for this user', code: 'MFA_NOT_ENABLED' });
    }

    const speakeasy = await import('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return reply.code(401).send({ error: 'Invalid MFA token', code: 'INVALID_MFA_TOKEN' });
    }

    // Generate tokens
    const accessToken = app.jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = app.refreshJwt.sign(
      { userId: user.id },
      { expiresIn: '7d' }
    );

    await app.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    reply
      .setCookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60, path: '/' })
      .setCookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60, path: '/' });

    return { accessToken, refreshToken };
  });
}