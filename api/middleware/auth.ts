import { FastifyRequest, FastifyReply } from 'fastify'
import { ErrorResponseSchema } from '../../schemas/api/common'

/**
 * JWT Authentication middleware
 * Validates JWT tokens and extracts user information from requests
 */

export interface AuthenticatedUser {
  userId: string
  email?: string
  iat?: number
  exp?: number
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
}

/**
 * Middleware to require valid JWT authentication
 * Extracts user information from JWT and adds it to the request
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Verify JWT token - this will throw if invalid/missing
    await request.jwtVerify()
    
    // Extract user information from JWT payload
    const payload = request.user as AuthenticatedUser
    
    if (!payload || !payload.userId) {
      const error = ErrorResponseSchema.parse({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token payload - missing user information',
        },
      })
      
      reply.status(401).send(error)
      return
    }

    // Add user info to request for use in route handlers
    request.user = {
      userId: payload.userId,
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch (error) {
    // JWT verification failed - error will be handled by global error handler
    throw error
  }
}

/**
 * Optional authentication middleware
 * Extracts user information if JWT is present, but doesn't require it
 */
export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    // Only verify if Authorization header is present
    const authHeader = request.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await request.jwtVerify()
      const payload = request.user as AuthenticatedUser
      
      if (payload && payload.userId) {
        request.user = {
          userId: payload.userId,
          email: payload.email,
          iat: payload.iat,
          exp: payload.exp,
        }
      }
    }
  } catch {
    // Ignore JWT errors in optional auth - just continue without user info
    request.user = undefined
  }
}

/**
 * Utility function to get current user ID from request
 * Throws error if no authenticated user
 */
export function getCurrentUserId(request: FastifyRequest): string {
  if (!request.user || !request.user.userId) {
    throw new Error('No authenticated user found')
  }
  return request.user.userId
}

/**
 * Utility function to get current user ID from request if available
 * Returns undefined if no authenticated user
 */
export function getCurrentUserIdOptional(request: FastifyRequest): string | undefined {
  return request.user?.userId
}