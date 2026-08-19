// backend/src/plugins/auth.ts
// Authentication plugin with JWT (RS256) + Argon2id

import { FastifyPluginAsync } from 'fastify';
import { fastifyJwt } from '@fastify/jwt';
import { fastifyCookie } from '@fastify/cookie';
import { argon2id } from 'argon2';
import fs from 'fs';
import path from 'path';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; tenantId: string; role: string; email: string };
    tenantId?: string;
  }
}

const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || fs.readFileSync(path.resolve('keys/private.pem'), 'utf-8');
const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || fs.readFileSync(path.resolve('keys/public.pem'), 'utf-8');
const REFRESH_PRIVATE_KEY = process.env.JWT_REFRESH_PRIVATE_KEY || fs.readFileSync(path.resolve('keys/refresh-private.pem'), 'utf-8');
const REFRESH_PUBLIC_KEY = process.env.JWT_REFRESH_PUBLIC_KEY || fs.readFileSync(path.resolve('keys/refresh-public.pem'), 'utf-8');
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'change-me-in-production';

function isPublicRoute(url: string): boolean {
  const publicRoutes = [
    '/health',
    '/ready',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
  ];
  return publicRoutes.some(route => url.startsWith(route));
}

export const authPlugin: FastifyPluginAsync = async (app) => {
  // Cookie parsing
  await app.register(fastifyCookie, {
    secret: COOKIE_SECRET,
    parseOptions: { httpOnly: true, secure: true, sameSite: 'strict' },
    hook: 'onRequest',
  });

  // Access token JWT (15 min)
  await app.register(fastifyJwt, {
    secret: {
      private: PRIVATE_KEY,
      public: PUBLIC_KEY,
    },
    sign: { algorithm: 'RS256', expiresIn: '15m' },
    verify: { algorithms: ['RS256'] },
    cookie: { cookieName: 'accessToken', signed: false },
  });

  // Refresh token JWT (7 days) - register with different cookie name
  await app.register(fastifyJwt, {
    secret: {
      private: REFRESH_PRIVATE_KEY,
      public: REFRESH_PUBLIC_KEY,
    },
    sign: { algorithm: 'RS256', expiresIn: '7d' },
    verify: { algorithms: ['RS256'] },
    cookie: { cookieName: 'refreshToken', signed: false },
  });

  // Auth hook
  app.addHook('preHandler', async (request, reply) => {
    if (isPublicRoute(request.url)) return;

    try {
      const accessToken = request.cookies.accessToken;
      const refreshToken = request.cookies.refreshToken;

      if (!accessToken) {
        return reply.code(401).send({ error: 'Unauthorized', code: 'NO_ACCESS_TOKEN' });
      }

      // Verify access token
      const decoded = await request.jwtVerify<{ userId: string; tenantId: string; role: string }>();
      
      // Verify user exists and is active
      const user = await app.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, tenantId: true, role: true, email: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE' || user.tenantId !== decoded.tenantId) {
        return reply.code(403).send({ error: 'Forbidden', code: 'INVALID_TENANT' });
      }

      request.user = { id: user.id, tenantId: user.tenantId, role: user.role, email: user.email };
      request.tenantId = user.tenantId;
    } catch (err) {
      // Try refresh token
      if (request.cookies.refreshToken) {
        try {
          const decoded = await request.jwtVerify<{ userId: string }>();
          const user = await app.prisma.user.findUnique({ where: { id: decoded.userId } });
          
          if (user && user.status === 'ACTIVE') {
            const newAccessToken = app.jwt.sign({ userId: user.id, tenantId: user.tenantId, role: user.role }, { expiresIn: '15m' });
            const newRefreshToken = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' });
            
            reply.setCookie('accessToken', newAccessToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 });
            reply.setCookie('refreshToken', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 });
            
            request.user = { id: user.id, tenantId: user.tenantId, role: user.role, email: user.email };
            request.tenantId = user.tenantId;
            return;
          }
        } catch {}
      }
      return reply.code(401).send({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    }
  });

  // Password hashing helpers
  app.decorate('hashPassword', async (password: string) => {
    return argon2id.hash(password, { memoryCost: 65536, timeCost: 3, parallelism: 4 });
  });

  app.decorate('verifyPassword', async (password: string, hash: string) => {
    return argon2id.verify(hash, password);
  });
};

function isPublicRoute(url: string): boolean {
  const publicRoutes = [
    '/health',
    '/ready',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
  ];
  return publicRoutes.some(route => url.startsWith(route));
}

export default authPlugin;