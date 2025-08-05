import { FastifyInstance, FastifyServerOptions } from 'fastify'
import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { ZodError } from 'zod'
import { 
  ErrorResponseSchema, 
  ValidationErrorResponseSchema 
} from '../schemas/api/common'
import { connectDatabase, disconnectDatabase, checkDatabaseHealth } from './db/client'

/**
 * Server configuration interface
 */
export interface ServerConfig {
  port?: number
  host?: string
  database?: {
    url: string
  }
  jwt?: {
    secret: string
  }
  testing?: boolean
}

/**
 * Create and configure Fastify server instance
 */
export async function createServer(config: ServerConfig = {}): Promise<FastifyInstance> {
  const {
    port = 3001,
    host = '0.0.0.0',
    testing = false,
    jwt: jwtConfig = { secret: process.env.JWT_SECRET || 'development-secret-key' }
  } = config

  // Fastify server options
  const serverOptions: FastifyServerOptions = {
    logger: testing ? false : {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    // Generate request IDs for tracing
    genReqId: () => `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    // Disable request logging in test mode
    disableRequestLogging: testing,
  }

  const app = fastify(serverOptions)

  // Register error handler first
  await registerErrorHandler(app)

  // Register middleware
  await registerMiddleware(app, jwtConfig)

  // Initialize database connection (skip in testing mode)
  if (!testing) {
    await connectDatabase()
  }

  // Register routes
  await registerRoutes(app)

  // Health check endpoint
  app.get('/health', async () => {
    const dbHealthy = await checkDatabaseHealth()
    return {
      status: dbHealthy ? 'healthy' : 'degraded',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }
  })

  // 404 handler for undefined routes
  app.setNotFoundHandler(async (request, reply) => {
    const error = ErrorResponseSchema.parse({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    })

    reply.status(404).send(error)
  })

  // Start server if not in testing mode
  if (!testing) {
    try {
      await app.listen({ port, host })
      app.log.info(`🚀 Server running on http://${host}:${port}`)
    } catch (err) {
      app.log.error('❌ Failed to start server:', err)
      process.exit(1)
    }
  }

  return app
}

/**
 * Register middleware plugins
 */
async function registerMiddleware(app: FastifyInstance, jwtConfig: { secret: string }) {
  // CORS configuration
  await app.register(cors, {
    origin: [
      'http://localhost:3000',  // Frontend dev server
      'http://localhost:3001',  // API server
      'http://127.0.0.1:3000',  // Alternative localhost
      'http://127.0.0.1:3001',  // Alternative localhost
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-ID',
    ],
    credentials: true,
  })

  // JWT authentication plugin
  await app.register(jwt, {
    secret: jwtConfig.secret,
    sign: {
      expiresIn: '24h',
    },
  })

  // Cookie support
  await app.register(cookie, {
    secret: jwtConfig.secret,
    parseOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })

  // Request/Response logging (not in test mode)
  app.addHook('onRequest', async (request) => {
    if (!process.env.NODE_ENV?.includes('test')) {
      request.log.info({
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        requestId: request.id,
      }, 'Incoming request')
    }
  })

  app.addHook('onResponse', async (request, reply) => {
    if (!process.env.NODE_ENV?.includes('test')) {
      request.log.info({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
        requestId: request.id,
      }, 'Request completed')
    }
  })

  // Add metadata to all successful responses
  app.addHook('onSend', async (request, reply, payload) => {
    // Only add metadata to JSON responses that don't already have it
    if (
      reply.getHeader('content-type')?.toString().includes('application/json') &&
      payload &&
      typeof payload === 'string'
    ) {
      try {
        const parsed = JSON.parse(payload)
        
        // Add timestamp to meta if response has data but no meta
        if (parsed.data && !parsed.meta) {
          parsed.meta = {
            timestamp: new Date().toISOString(),
          }
          return JSON.stringify(parsed)
        }
      } catch {
        // Not JSON, return as-is
      }
    }
    
    return payload
  })
}

/**
 * Register global error handler
 */
async function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler(async (error, request, reply) => {
    // Log error details
    request.log.error({
      error: error.message,
      stack: error.stack,
      requestId: request.id,
      method: request.method,
      url: request.url,
    }, 'Request error occurred')

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

    // Handle JWT errors
    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
      const authError = ErrorResponseSchema.parse({
        error: {
          code: 'UNAUTHORIZED',
          message: 'JWT token has expired',
        },
      })

      return reply.status(401).send(authError)
    }

    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      const authError = ErrorResponseSchema.parse({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid JWT token',
        },
      })

      return reply.status(401).send(authError)
    }

    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      const authError = ErrorResponseSchema.parse({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required',
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
          }],
        },
      })

      return reply.status(400).send(validationError)
    }

    // Handle 404 errors
    if (error.statusCode === 404) {
      const notFoundError = ErrorResponseSchema.parse({
        error: {
          code: 'NOT_FOUND',
          message: error.message || 'Resource not found',
        },
      })

      return reply.status(404).send(notFoundError)
    }

    // Handle other HTTP errors
    if (error.statusCode && error.statusCode < 500) {
      const clientError = ErrorResponseSchema.parse({
        error: {
          code: error.code || 'CLIENT_ERROR',
          message: error.message,
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
          : error.message,
        ...(process.env.NODE_ENV !== 'production' && {
          details: {
            stack: error.stack,
            cause: error.cause,
          },
        }),
      },
    })

    return reply.status(500).send(serverError)
  })
}

/**
 * Register API routes
 */
async function registerRoutes(app: FastifyInstance) {
  // API prefix for all routes
  app.register(async function (fastify) {
    // Register Events API routes
    const eventsRoutes = await import('./routes/events')
    await fastify.register(eventsRoutes.default)

    // Documents routes placeholder
    fastify.all('/documents*', async (request, reply) => {
      const error = ErrorResponseSchema.parse({
        error: {
          code: 'NOT_FOUND',
          message: `Documents API not implemented yet: ${request.method} ${request.url}`,
        },
      })
      reply.status(404).send(error)
    })

    // Agents routes placeholder
    fastify.all('/agents*', async (request, reply) => {
      const error = ErrorResponseSchema.parse({
        error: {
          code: 'NOT_FOUND',
          message: `Agents API not implemented yet: ${request.method} ${request.url}`,
        },
      })
      reply.status(404).send(error)
    })

    // Chains routes placeholder
    fastify.all('/chains*', async (request, reply) => {
      const error = ErrorResponseSchema.parse({
        error: {
          code: 'NOT_FOUND',
          message: `Chains API not implemented yet: ${request.method} ${request.url}`,
        },
      })
      reply.status(404).send(error)
    })
  }, { prefix: '/api' })
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(app: FastifyInstance) {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT']
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`)
      
      try {
        await app.close()
        await disconnectDatabase()
        app.log.info('✅ Server shut down successfully')
        process.exit(0)
      } catch (err) {
        app.log.error('❌ Error during shutdown:', err)
        process.exit(1)
      }
    })
  })
}

// Start server if this file is run directly
async function startServer() {
  if (import.meta.url === `file://${process.argv[1]}`) {
    const server = await createServer({
      port: Number(process.env.PORT) || 3001,
      host: process.env.HOST || '0.0.0.0',
      database: {
        url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/chainworkspace',
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'development-secret-key',
      },
    })

    setupGracefulShutdown(server)
  }
}

// Only start server if this module is run directly
startServer().catch(console.error)

export default createServer