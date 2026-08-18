// backend/src/routes/auth.ts
// Authentication routes

import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../plugins/auth';

export async function authRoutes(app: FastifyInstance) {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // Login
  api.post('/login', {
    schema: {
      body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
        rememberMe: z.boolean().optional(),
      }),
      response: {
        200: z.object({
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
        }),
        401: z.object({
          error: z.string(),
          code: z.string(),
        }),
      },
    }, async (request, reply) => {
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
    return { message: 'Logged out successfully' };
  });

  // Get current user
  api.get('/me', {
    preHandler: [app.authenticate],
  }, async (request) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        title: true,
        avatarUrl: true,
        role: true,
        status: true,
        timezone: true,
        dateFormat: true,
        timeFormat: true,
        language: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: {
          select: { id: true, name: true, slug: true, plan: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return { user };
  });

  // Update profile
  api.patch('/me', {
    preHandler: [app.authenticate],
    schema: {
      body: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        title: z.string().optional(),
        timezone: z.string().optional(),
        dateFormat: z.string().optional(),
        timeFormat: z.string().optional(),
        language: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const user = await request.server.prisma.user.update({
      where: { id: request.user!.id },
      data: request.body,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        title: true,
        avatarUrl: true,
        role: true,
        timezone: true,
        dateFormat: true,
        timeFormat: true,
        language: true,
      },
    });
    return { user };
  });

  // Change password
  api.patch('/me/password', {
    preHandler: [app.authenticate],
    schema: {
      body: z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(12),
        confirmPassword: z.string().min(12),
      }).refine(data => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      }),
    },
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body;

    const user = await app.prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { password_hash: true },
    });

    if (!user?.password_hash) {
      return reply.code(400).send({ error: 'Cannot change password for SSO accounts', code: 'SSO_ACCOUNT' });
    }

    const valid = await verifyPassword(request.body.currentPassword, user.password_hash);
    if (!valid) {
      return reply.code(400).send({ error: 'Current password is incorrect', code: 'INVALID_PASSWORD' });
    }

    const newHash = await hashPassword(newPassword);
    await app.prisma.user.update({
      where: { id: request.user!.id },
      data: { password_hash: newHash },
    });

    // Revoke all other sessions
    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });

    return { message: 'Password changed successfully. Please log in again.' };
  });

  // Forgot password
  api.post('/forgot-password', {
    schema: {
      body: z.object({
        email: z.string().email(),
      }),
    },
  }, async (request, reply) => {
    const { email } = request.body;

    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token (store in DB with expiry)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await app.hashPassword(resetToken);
    
    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: resetTokenHash,
        password_reset_expires: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // Send email (implement email service)
    // await sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  });

  // Reset password
  api.post('/reset-password', {
    schema: {
      body: z.object({
        token: z.string().min(1),
        newPassword: z.string().min(12),
        confirmPassword: z.string().min(12),
      }).refine(data => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      }),
    },
  }, async (request, reply) => {
    const { token, newPassword } = request.body;

    const users = await app.prisma.user.findMany({
      where: { password_reset_expires: { gt: new Date() } },
      select: { id: true, password_reset_token: true },
    });

    let user = null;
    for (const u of users) {
      if (u.password_reset_token && await verifyPassword(request.body.token, u.password_reset_token)) {
        user = u;
        break;
      }
    }

    if (!user) {
      return reply.code(400).send({ error: 'Invalid or expired reset token', code: 'INVALID_RESET_TOKEN' });
    }

    const newHash = await hashPassword(request.body.newPassword);
    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: newHash,
        password_reset_token: null,
        password_reset_expires: null,
      },
    });

    return { message: 'Password reset successfully. Please log in.' };
  });
});

export { authRoutes };