/**
 * Manual test script for Events API
 * 
 * This script can be used to manually test the API endpoints
 * without requiring full integration test setup.
 * 
 * Usage: npx tsx tests/manual/test-api-manual.ts
 */

import { createServer } from '../../api/server'

async function testEventsAPI() {
  try {
    console.log('🚀 Starting manual API test...')
    
    // Create server in testing mode (no database connection)
    const app = await createServer({
      testing: true,
      jwt: { secret: 'test-secret' }
    })

    console.log('✅ Server created successfully')

    // Test health endpoint
    const healthResponse = await app.inject({
      method: 'GET',
      url: '/health'
    })

    console.log('Health check:', healthResponse.statusCode, JSON.parse(healthResponse.body))

    // Test events endpoint structure (should work even without database)
    const eventsResponse = await app.inject({
      method: 'GET',
      url: '/api/events'
    })

    console.log('Events endpoint status:', eventsResponse.statusCode)
    if (eventsResponse.statusCode !== 500) {
      console.log('Events response:', JSON.parse(eventsResponse.body))
    } else {
      console.log('Expected 500 error (no database):', JSON.parse(eventsResponse.body))
    }

    // Test authentication requirement
    const authTestResponse = await app.inject({
      method: 'POST',
      url: '/api/events',
      payload: {
        type: 'TEST_EVENT',
        payload: { test: true }
      }
    })

    console.log('Auth test status:', authTestResponse.statusCode)
    console.log('Auth test response:', JSON.parse(authTestResponse.body))

    // Test with valid JWT
    const validToken = app.jwt.sign({ userId: 'test-user' })
    const authValidResponse = await app.inject({
      method: 'POST',
      url: '/api/events',
      headers: {
        authorization: `Bearer ${validToken}`
      },
      payload: {
        type: 'TEST_EVENT',
        payload: { test: true }
      }
    })

    console.log('Authenticated request status:', authValidResponse.statusCode)
    if (authValidResponse.statusCode !== 500) {
      console.log('Authenticated response:', JSON.parse(authValidResponse.body))
    } else {
      console.log('Expected 500 error (no database):', JSON.parse(authValidResponse.body))
    }

    // Test route registration
    console.log('\nRegistered routes:')
    console.log(app.printRoutes())

    await app.close()
    console.log('✅ API test completed successfully!')

  } catch (error) {
    console.error('❌ API test failed:', error)
    process.exit(1)
  }
}

// Run the test
testEventsAPI()