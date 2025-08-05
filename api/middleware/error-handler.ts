import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { 
  ErrorResponseSchema, 
  ValidationErrorResponseSchema 
} from '../../schemas/api/common'

/**
 * Global error handler for Fastify server
 * Provides consistent error response format across all endpoints
 */

export interface AppError extends Error {
  statusCode?: number
  code?: string
  validation?: unknown[]
  validationContext?: string
}

/**
 * Create structured error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: unknown
) {
  return {
    statusCode,
    response: ErrorResponseSchema.parse({
      error: {
        code,
        message,
        ...(details && { details }),
      },
    }),
  }
}

/**
 * Global error handler function
 */
export async function globalErrorHandler(
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log error with context
  const errorContext = {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    requestId: request.id,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    userId: (request as any).user?.userId,
  }

  // Log full stack trace for server errors, minimal info for client errors
  if (!error.statusCode || error.statusCode >= 500) {
    request.log.error({
      ...errorContext,
      stack: error.stack,
      cause: error.cause,
    }, 'Server error occurred')
  } else {
    request.log.warn(errorContext, 'Client error occurred')
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = ValidationErrorResponseSchema.parse({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.') || 'unknown',
          message: err.message,
          value: err.input,
        })),
      },
    })

    return reply.status(400).send(validationError)
  }

  // Handle JWT authentication errors
  if (error.code?.startsWith('FST_JWT_')) {
    let message = 'Authentication failed'
    
    switch (error.code) {
      case 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED':
        message = 'JWT token has expired'
        break
      case 'FST_JWT_AUTHORIZATION_TOKEN_INVALID':
        message = 'Invalid JWT token'
        break
      case 'FST_JWT_NO_AUTHORIZATION_IN_HEADER':
        message = 'Authentication token required'
        break
      case 'FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED':
        message = 'Untrusted JWT token'
        break
      default:
        message = 'Authentication failed'
    }

    const authError = ErrorResponseSchema.parse({
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    })

    return reply.status(401).send(authError)
  }

  // Handle Fastify validation errors
  if (error.validation) {
    const validationError = ValidationErrorResponseSchema.parse({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [{
          field: error.validationContext || 'unknown',
          message: error.message,
          value: undefined,
        }],
      },
    })

    return reply.status(400).send(validationError)
  }

  // Handle CORS errors
  if (error.code === 'FST_CORS_INVALID_ORIGIN') {
    const corsError = ErrorResponseSchema.parse({
      error: {
        code: 'FORBIDDEN',
        message: 'CORS policy violation',
      },
    })

    return reply.status(403).send(corsError)
  }

  // Handle content type errors
  if (error.code === 'FST_ERR_CTP_INVALID_CONTENT_TYPE') {
    const contentTypeError = ErrorResponseSchema.parse({
      error: {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Invalid content type. Expected application/json',
      },
    })

    return reply.status(415).send(contentTypeError)
  }

  // Handle payload too large errors
  if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
    const payloadError = ErrorResponseSchema.parse({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds maximum size limit',
      },
    })

    return reply.status(413).send(payloadError)
  }

  // Handle malformed JSON errors
  if (error.code === 'FST_ERR_CTP_INVALID_JSON_BODY') {
    const jsonError = ErrorResponseSchema.parse({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid JSON in request body',
      },
    })

    return reply.status(400).send(jsonError)
  }

  // Handle route not found (404) errors
  if (error.statusCode === 404) {
    const notFoundError = ErrorResponseSchema.parse({
      error: {
        code: 'NOT_FOUND',
        message: error.message || 'Resource not found',
      },
    })

    return reply.status(404).send(notFoundError)
  }

  // Handle method not allowed (405) errors
  if (error.statusCode === 405) {
    const methodError = ErrorResponseSchema.parse({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: error.message || 'Method not allowed for this endpoint',
      },
    })

    return reply.status(405).send(methodError)
  }

  // Handle client errors (4xx)
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    const clientError = ErrorResponseSchema.parse({
      error: {
        code: error.code || 'CLIENT_ERROR',
        message: error.message || 'Client error occurred',
      },
    })

    return reply.status(error.statusCode).send(clientError)
  }

  // Handle server errors (5xx)
  const serverError = ErrorResponseSchema.parse({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message || 'Unknown server error',
      ...(process.env.NODE_ENV !== 'production' && {
        details: {
          code: error.code,
          stack: error.stack,
          cause: error.cause,
        },
      }),
    },
  })

  return reply.status(error.statusCode || 500).send(serverError)
}

/**
 * Custom error classes for application-specific errors
 */
export class AppError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code || 'APPLICATION_ERROR'
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}