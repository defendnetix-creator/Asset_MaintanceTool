// backend/src/middleware/error-handler.ts
// Global error handler

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  // Log error
  request.log.error({ err: error, url: request.url, method: request.method }, 'Request error');

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    });
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return reply.code(409).send({
          error: 'Conflict',
          code: 'DUPLICATE_ENTRY',
          field: error.meta?.target,
          message: 'A record with this value already exists',
        });
      case 'P2003': // Foreign key constraint violation
        return reply.code(400).send({
          error: 'Bad Request',
          code: 'INVALID_REFERENCE',
          message: 'Referenced record does not exist',
        });
      case 'P2025': // Record not found
        return reply.code(404).send({
          error: 'Not Found',
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found',
        });
      default:
        return reply.code(500).send({
          error: 'Database Error',
          code: 'DATABASE_ERROR',
          message: 'An unexpected database error occurred',
        });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return reply.code(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'Invalid data provided',
    });
  }

  // Fastify validation errors
  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: error.validation,
    });
  }

  // JWT errors
  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' || error.code === 'FST_JWT_BAD_SIGNATURE') {
    return reply.code(401).send({ error: 'Token expired or invalid', code: 'TOKEN_EXPIRED' });
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return reply.code(429).send({
      error: 'Too Many Requests',
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : error.message;

  return reply.code(statusCode).send({
    error: statusCode === 500 ? 'Internal Server Error' : error.name,
    code: error.code || 'INTERNAL_ERROR',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export default errorHandler;