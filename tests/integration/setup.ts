/**
 * Integration Test Setup Utilities
 * 
 * Provides test database and server management for integration tests.
 * Uses Testcontainers for isolated database testing and Fastify server setup.
 */

import { FastifyInstance } from 'fastify'
import { GenericContainer, StartedTestContainer } from 'testcontainers'

export interface TestDatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  url: string
}

export interface TestEvent {
  id?: string
  type: string
  payload: unknown
  timestamp: Date
  userId?: string
}

/**
 * Database manager for integration tests using Testcontainers
 */
export class TestDatabaseManager {
  private static instance: TestDatabaseManager
  private container: StartedTestContainer | null = null
  private config: TestDatabaseConfig | null = null

  static getInstance(): TestDatabaseManager {
    if (!TestDatabaseManager.instance) {
      TestDatabaseManager.instance = new TestDatabaseManager()
    }
    return TestDatabaseManager.instance
  }

  async setup(): Promise<TestDatabaseConfig> {
    if (this.config) return this.config

    try {
      // Start PostgreSQL container for testing
      this.container = await new GenericContainer('postgres:16-alpine')
        .withEnvironment({
          POSTGRES_DB: 'chainworkspace_test',
          POSTGRES_USER: 'test_user',
          POSTGRES_PASSWORD: 'test_pass',
        })
        .withExposedPorts(5432)
        .withWaitStrategy({
          type: 'log',
          message: 'database system is ready to accept connections',
          times: 2,
        })
        .start()

      const host = this.container.getHost()
      const port = this.container.getMappedPort(5432)
      const database = 'chainworkspace_test'
      const username = 'test_user'
      const password = 'test_pass'

      this.config = {
        host,
        port,
        database,
        username,
        password,
        url: `postgresql://${username}:${password}@${host}:${port}/${database}`,
      }

      // Run database migrations
      await this.runMigrations()

      console.log(`✅ Test database started: ${host}:${port}`)
      return this.config
    } catch (error) {
      console.error('❌ Failed to start test database:', error)
      throw new Error(`Failed to setup test database: ${error}`)
    }
  }

  async cleanup(): Promise<void> {
    if (this.container) {
      await this.container.stop()
      this.container = null
      this.config = null
      console.log('✅ Test database stopped')
    }
  }

  async clearEvents(): Promise<void> {
    if (!this.config) {
      throw new Error('Database not initialized')
    }

    // Clear events from test database using direct SQL
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient({
      datasources: {
        db: { url: this.config.url }
      }
    })

    try {
      await prisma.event.deleteMany({})
      console.log('🧹 Cleared events from test database')
    } finally {
      await prisma.$disconnect()
    }
  }

  async seedEvents(events: TestEvent[]): Promise<void> {
    if (!this.config) {
      throw new Error('Database not initialized')
    }

    // Seed events to test database using Prisma
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient({
      datasources: {
        db: { url: this.config.url }
      }
    })

    try {
      for (const event of events) {
        await prisma.event.create({
          data: {
            eventType: event.type,
            payload: event.payload,
            timestamp: event.timestamp,
            actorId: event.userId || 'test-user',
          }
        })
      }
      console.log(`🌱 Seeded ${events.length} events to test database`)
    } finally {
      await prisma.$disconnect()
    }
  }

  async getEventById(id: string): Promise<TestEvent | null> {
    if (!this.config) {
      throw new Error('Database not initialized')
    }

    // TODO: Implement event retrieval when database schema is ready
    console.log(`🔍 Retrieving event ${id} from test database...`)
    return null
  }

  async getAllEvents(): Promise<TestEvent[]> {
    if (!this.config) {
      throw new Error('Database not initialized')
    }

    // TODO: Implement event listing when database schema is ready
    console.log('📋 Retrieving all events from test database...')
    return []
  }

  private async runMigrations(): Promise<void> {
    if (!this.config) {
      throw new Error('Database not initialized')
    }

    // Run Prisma migrations against test database
    try {
      const { execSync } = await import('child_process')
      
      // Set the DATABASE_URL for migration
      const env = { ...process.env, DATABASE_URL: this.config.url }
      
      // Run migrations
      execSync('npx prisma migrate deploy', { 
        env, 
        stdio: 'inherit',
        cwd: process.cwd()
      })
      
      console.log('🔄 Database migrations completed successfully')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw new Error(`Migration failed: ${error}`)
    }
  }

  getConfig(): TestDatabaseConfig {
    if (!this.config) {
      throw new Error('Database not initialized')
    }
    return this.config
  }
}

/**
 * Fastify server manager for integration tests
 */
export class TestServerManager {
  private static instance: TestServerManager
  private app: FastifyInstance | null = null

  static getInstance(): TestServerManager {
    if (!TestServerManager.instance) {
      TestServerManager.instance = new TestServerManager()
    }
    return TestServerManager.instance
  }

  async start(databaseConfig: TestDatabaseConfig): Promise<FastifyInstance> {
    if (this.app) return this.app

    try {
      // Set the test database URL in environment for Prisma
      process.env.DATABASE_URL = databaseConfig.url
      
      // Import and initialize Fastify server
      const createServer = (await import('../../api/server')).default
      
      this.app = await createServer({
        database: {
          url: databaseConfig.url,
        },
        jwt: {
          secret: 'test-jwt-secret-for-integration-tests',
        },
        testing: true,
      })

      console.log('✅ Test server started successfully')
      return this.app
    } catch (error) {
      console.error('❌ Failed to start test server:', error)
      throw error
    }
  }

  async stop(): Promise<void> {
    if (this.app) {
      await this.app.close()
      this.app = null
      console.log('✅ Test server stopped')
    }
  }

  getApp(): FastifyInstance {
    if (!this.app) {
      throw new Error('Server not started')
    }
    return this.app
  }
}

/**
 * JWT helper for authentication testing
 */
export class JWTTestHelper {
  private static readonly TEST_SECRET = 'test-jwt-secret-for-integration-tests'
  private static readonly TEST_USER_ID = 'test-user-123'
  private static readonly TEST_USER_EMAIL = 'test@example.com'

  static generateValidToken(userId = JWTTestHelper.TEST_USER_ID): string {
    // Create a proper JWT token using crypto for HMAC
    const crypto = require('crypto')
    
    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = {
      userId,
      email: JWTTestHelper.TEST_USER_EMAIL,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    }

    // Base64url encode header and payload
    const encodedHeader = JWTTestHelper.base64urlEncode(JSON.stringify(header))
    const encodedPayload = JWTTestHelper.base64urlEncode(JSON.stringify(payload))
    
    // Create signature using HMAC SHA256
    const signature = crypto
      .createHmac('sha256', JWTTestHelper.TEST_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  static generateExpiredToken(): string {
    // Create an expired JWT token
    const crypto = require('crypto')
    
    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = {
      userId: JWTTestHelper.TEST_USER_ID,
      email: JWTTestHelper.TEST_USER_EMAIL,
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
    }

    const encodedHeader = JWTTestHelper.base64urlEncode(JSON.stringify(header))
    const encodedPayload = JWTTestHelper.base64urlEncode(JSON.stringify(payload))
    
    // Create proper signature for expired token
    const signature = crypto
      .createHmac('sha256', JWTTestHelper.TEST_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  static generateInvalidToken(): string {
    return 'invalid.jwt.token'
  }

  private static base64urlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  static getTestUserId(): string {
    return JWTTestHelper.TEST_USER_ID
  }

  static getTestUserEmail(): string {
    return JWTTestHelper.TEST_USER_EMAIL
  }

  static getTestSecret(): string {
    return JWTTestHelper.TEST_SECRET
  }
}

/**
 * Test utilities for common integration test operations
 */
export class TestUtils {
  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Retry an operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    baseDelay = 100
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxAttempts) {
          throw lastError
        }

        const delay = baseDelay * Math.pow(2, attempt - 1)
        await TestUtils.wait(delay)
      }
    }

    throw lastError!
  }

  /**
   * Generate a unique test ID
   */
  static generateTestId(prefix = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Create a test event with default values
   */
  static createTestEvent(overrides: Partial<TestEvent> = {}): TestEvent {
    return {
      id: TestUtils.generateTestId('event'),
      type: 'TEST_EVENT',
      payload: { test: true },
      timestamp: new Date(),
      userId: JWTTestHelper.getTestUserId(),
      ...overrides,
    }
  }

  /**
   * Validate that a response matches the expected schema structure
   */
  static validateResponseStructure(response: Record<string, unknown>, expectedKeys: string[]): void {
    for (const key of expectedKeys) {
      if (!(key in response)) {
        throw new Error(`Expected response to contain key: ${key}`)
      }
    }
  }

  /**
   * Validate pagination metadata structure
   */
  static validatePaginationMeta(pagination: Record<string, unknown>): void {
    const requiredKeys = ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev']
    TestUtils.validateResponseStructure(pagination, requiredKeys)
    
    if (typeof pagination.page !== 'number' || pagination.page < 1) {
      throw new Error('Invalid pagination.page value')
    }
    
    if (typeof pagination.limit !== 'number' || pagination.limit < 1) {
      throw new Error('Invalid pagination.limit value')
    }
    
    if (typeof pagination.total !== 'number' || pagination.total < 0) {
      throw new Error('Invalid pagination.total value')
    }
  }
}

/**
 * Global test setup and teardown helpers
 */
export const setupIntegrationTests = async () => {
  const dbManager = TestDatabaseManager.getInstance()
  const serverManager = TestServerManager.getInstance()
  
  const dbConfig = await dbManager.setup()
  const app = await serverManager.start(dbConfig)
  
  return { dbManager, serverManager, app, dbConfig }
}

export const teardownIntegrationTests = async () => {
  const dbManager = TestDatabaseManager.getInstance()
  const serverManager = TestServerManager.getInstance()
  
  await serverManager.stop()
  await dbManager.cleanup()
}

// Export types for use in tests
export type { TestDatabaseConfig, TestEvent }