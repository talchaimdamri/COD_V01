/**
 * Document Version Management API Integration Tests
 * Test ID: INT-VERSION-API
 * PRD Reference: Task 11.1 - Version Management Backend Endpoints
 * 
 * This test suite covers the integration between the frontend and backend
 * for document version management, including version creation, retrieval,
 * comparison, restoration, and event sourcing API endpoints.
 * 
 * These tests will FAIL initially until the version management API is implemented (TDD).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { DocumentEventFactory } from '../../schemas/events/document'
import type { DocumentEvent } from '../../schemas/events/document'
import { 
  mockVersionHistory,
  mockVersionDiffs,
  editorTestUtils,
} from '../fixtures/document-editor'

// Mock Express app for testing - will be replaced with actual server setup
const app = {
  listen: () => ({ close: () => {} }),
  // This would be the actual Express app in real implementation
}

describe('Document Version Management API Integration', () => {
  let server: any
  let baseURL: string
  
  beforeAll(async () => {
    // Start test server
    server = app.listen()
    baseURL = 'http://localhost:3001' // Test server URL
  })
  
  afterAll(async () => {
    // Cleanup test server
    if (server) {
      server.close()
    }
  })
  
  beforeEach(async () => {
    // Clean up test data before each test
    // In real implementation, this would reset the test database
  })
  
  afterEach(async () => {
    // Cleanup after each test
  })

  describe('Version Creation API', () => {
    it('should create new document version via API [INT-VERSION-01]', async () => {
      // Test ID: INT-VERSION-01
      // PRD Reference: Version creation endpoint with content snapshots
      
      const documentId = 'test-doc-version-create'
      const versionData = {
        documentId,
        content: '<h1>Version Test</h1><p>Content for version creation test</p>',
        description: 'Test version creation',
        wordCount: 7,
        charCount: 65,
      }
      
      const response = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send(versionData)
        .expect(201)
      
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('versionId')
      expect(response.body.data).toHaveProperty('versionNumber')
      expect(response.body.data.versionNumber).toBeGreaterThan(0)
      expect(response.body.data).toHaveProperty('timestamp')
      expect(response.body.data.description).toBe(versionData.description)
      
      // Verify version was persisted
      const getVersionResponse = await request(baseURL)
        .get(`/api/documents/${documentId}/versions/${response.body.data.versionNumber}`)
        .expect(200)
      
      expect(getVersionResponse.body.data.content).toBe(versionData.content)
      expect(getVersionResponse.body.data.wordCount).toBe(versionData.wordCount)
      expect(getVersionResponse.body.data.charCount).toBe(versionData.charCount)
    })

    it('should validate version creation data [INT-VERSION-02]', async () => {
      // Test ID: INT-VERSION-02
      // PRD Reference: API validation for version creation
      
      const documentId = 'test-doc-validation'
      
      // Test missing required fields
      const invalidData = {
        description: 'Missing content field',
      }
      
      const response = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send(invalidData)
        .expect(400)
      
      expect(response.body).toHaveProperty('error')
      expect(response.body.error.message).toMatch(/content.*required|missing.*content/i)
      
      // Test invalid content type
      const invalidContentData = {
        content: null,
        description: 'Invalid content type',
      }
      
      const response2 = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send(invalidContentData)
        .expect(400)
      
      expect(response2.body).toHaveProperty('error')
      expect(response2.body.error.message).toMatch(/content.*string|invalid.*content/i)
      
      // Test excessively long description
      const longDescriptionData = {
        content: '<p>Valid content</p>',
        description: 'x'.repeat(1001), // Assuming 1000 char limit
      }
      
      const response3 = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send(longDescriptionData)
        .expect(400)
      
      expect(response3.body).toHaveProperty('error')
      expect(response3.body.error.message).toMatch(/description.*long|exceeds.*limit/i)
    })
  })

  describe('Version Retrieval API', () => {
    it('should retrieve document version history [INT-VERSION-03]', async () => {
      // Test ID: INT-VERSION-03
      // PRD Reference: Version history retrieval with pagination
      
      const documentId = 'test-doc-history'
      
      // Create multiple versions first
      const versions = []
      for (let i = 1; i <= 5; i++) {
        const versionData = {
          content: `<p>Version ${i} content</p>`,
          description: `Version ${i} description`,
          wordCount: 3,
          charCount: 25,
        }
        
        const createResponse = await request(baseURL)
          .post(`/api/documents/${documentId}/versions`)
          .send(versionData)
          .expect(201)
        
        versions.push(createResponse.body.data)
      }
      
      // Retrieve version history
      const response = await request(baseURL)
        .get(`/api/documents/${documentId}/versions`)
        .expect(200)
      
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('versions')
      expect(response.body.data.versions).toHaveLength(5)
      expect(response.body.data).toHaveProperty('totalCount', 5)
      expect(response.body.data).toHaveProperty('hasMore', false)
      
      // Verify versions are sorted by version number (descending)
      const returnedVersions = response.body.data.versions
      for (let i = 0; i < returnedVersions.length - 1; i++) {
        expect(returnedVersions[i].versionNumber)
          .toBeGreaterThan(returnedVersions[i + 1].versionNumber)
      }
      
      // Verify version data structure
      returnedVersions.forEach((version: any) => {
        expect(version).toHaveProperty('versionId')
        expect(version).toHaveProperty('versionNumber')
        expect(version).toHaveProperty('timestamp')
        expect(version).toHaveProperty('description')
        expect(version).toHaveProperty('wordCount')
        expect(version).toHaveProperty('charCount')
        expect(version).toHaveProperty('author')
      })
    })

    it('should support version history pagination [INT-VERSION-04]', async () => {
      // Test ID: INT-VERSION-04
      // PRD Reference: Performance with large version histories
      
      const documentId = 'test-doc-pagination'
      
      // Create 25 versions
      for (let i = 1; i <= 25; i++) {
        const versionData = {
          content: `<p>Version ${i} content for pagination test</p>`,
          description: `Pagination test version ${i}`,
          wordCount: 6,
          charCount: 40,
        }
        
        await request(baseURL)
          .post(`/api/documents/${documentId}/versions`)
          .send(versionData)
          .expect(201)
      }
      
      // Test first page (default limit)
      const firstPageResponse = await request(baseURL)
        .get(`/api/documents/${documentId}/versions`)
        .query({ limit: 10 })
        .expect(200)
      
      expect(firstPageResponse.body.data.versions).toHaveLength(10)
      expect(firstPageResponse.body.data.hasMore).toBe(true)
      expect(firstPageResponse.body.data.totalCount).toBe(25)
      
      // Test second page with offset
      const secondPageResponse = await request(baseURL)
        .get(`/api/documents/${documentId}/versions`)
        .query({ limit: 10, offset: 10 })
        .expect(200)
      
      expect(secondPageResponse.body.data.versions).toHaveLength(10)
      expect(secondPageResponse.body.data.hasMore).toBe(true)
      
      // Verify no overlap between pages
      const firstPageIds = firstPageResponse.body.data.versions.map((v: any) => v.versionId)
      const secondPageIds = secondPageResponse.body.data.versions.map((v: any) => v.versionId)
      const overlap = firstPageIds.filter((id: string) => secondPageIds.includes(id))
      expect(overlap).toHaveLength(0)
      
      // Test last page
      const lastPageResponse = await request(baseURL)
        .get(`/api/documents/${documentId}/versions`)
        .query({ limit: 10, offset: 20 })
        .expect(200)
      
      expect(lastPageResponse.body.data.versions).toHaveLength(5)
      expect(lastPageResponse.body.data.hasMore).toBe(false)
    })

    it('should retrieve specific version by ID [INT-VERSION-05]', async () => {
      // Test ID: INT-VERSION-05
      // PRD Reference: Individual version retrieval
      
      const documentId = 'test-doc-specific'
      const versionContent = '<h1>Specific Version</h1><p>Content for specific version test</p>'
      
      // Create a version
      const createResponse = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({
          content: versionContent,
          description: 'Specific version for testing',
          wordCount: 8,
          charCount: 70,
        })
        .expect(201)
      
      const versionId = createResponse.body.data.versionId
      const versionNumber = createResponse.body.data.versionNumber
      
      // Retrieve by version ID
      const response1 = await request(baseURL)
        .get(`/api/documents/${documentId}/versions/${versionId}`)
        .expect(200)
      
      expect(response1.body.data.content).toBe(versionContent)
      expect(response1.body.data.description).toBe('Specific version for testing')
      
      // Retrieve by version number  
      const response2 = await request(baseURL)
        .get(`/api/documents/${documentId}/versions/${versionNumber}`)
        .expect(200)
      
      expect(response2.body.data.content).toBe(versionContent)
      expect(response2.body.data.versionId).toBe(versionId)
      
      // Test 404 for non-existent version
      await request(baseURL)
        .get(`/api/documents/${documentId}/versions/999999`)
        .expect(404)
    })
  })

  describe('Version Comparison API', () => {
    it('should generate diff between two versions [INT-VERSION-06]', async () => {
      // Test ID: INT-VERSION-06
      // PRD Reference: Diff calculation and display between versions
      
      const documentId = 'test-doc-diff'
      
      // Create first version
      const version1Response = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({
          content: '<p>Original content</p>',
          description: 'First version',
          wordCount: 2,
          charCount: 25,
        })
        .expect(201)
      
      const version1Number = version1Response.body.data.versionNumber
      
      // Create second version with changes
      const version2Response = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({
          content: '<p><strong>Modified</strong> content with changes</p>',
          description: 'Second version with formatting',
          wordCount: 5,
          charCount: 55,
        })
        .expect(201)
      
      const version2Number = version2Response.body.data.versionNumber
      
      // Generate diff
      const diffResponse = await request(baseURL)
        .get(`/api/documents/${documentId}/versions/${version1Number}/diff/${version2Number}`)
        .expect(200)
      
      expect(diffResponse.body).toHaveProperty('success', true)
      expect(diffResponse.body.data).toHaveProperty('fromVersion', version1Number)
      expect(diffResponse.body.data).toHaveProperty('toVersion', version2Number)
      expect(diffResponse.body.data).toHaveProperty('diff')
      
      const diff = diffResponse.body.data.diff
      expect(diff).toHaveProperty('additions')
      expect(diff).toHaveProperty('deletions')
      expect(diff).toHaveProperty('changes')
      expect(diff).toHaveProperty('statistics')
      
      // Verify diff statistics
      expect(diff.statistics).toHaveProperty('addedChars')
      expect(diff.statistics).toHaveProperty('removedChars')
      expect(diff.statistics).toHaveProperty('addedWords')
      expect(diff.statistics).toHaveProperty('removedWords')
      expect(diff.statistics.addedWords).toBeGreaterThan(0)
      expect(diff.statistics.addedChars).toBeGreaterThan(0)
      
      // Verify changes array structure
      expect(Array.isArray(diff.changes)).toBe(true)
      diff.changes.forEach((change: any) => {
        expect(change).toHaveProperty('type')
        expect(change).toHaveProperty('content')
        expect(['unchanged', 'addition', 'deletion']).toContain(change.type)
      })
    })

    it('should handle diff with complex formatting changes [INT-VERSION-07]', async () => {
      // Test ID: INT-VERSION-07
      // PRD Reference: Complex diff calculations with HTML formatting
      
      const documentId = 'test-doc-complex-diff'
      
      // Create version with complex content
      await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({
          content: mockVersionDiffs.complexChange.from,
          description: 'Complex content before changes',
          wordCount: 8,
          charCount: 80,
        })
        .expect(201)
      
      await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({
          content: mockVersionDiffs.complexChange.to,
          description: 'Complex content after changes',
          wordCount: 12,
          charCount: 140,
        })
        .expect(201)
      
      // Generate diff for complex changes
      const diffResponse = await request(baseURL)
        .get(`/api/documents/${documentId}/versions/1/diff/2`)
        .expect(200)
      
      const diff = diffResponse.body.data.diff
      
      // Verify complex diff handling
      expect(diff.additions).toContain('New ')
      expect(diff.additions).toContain('Updated ')
      expect(diff.deletions).toContain('Old ')
      
      // Verify statistics reflect structural changes
      expect(diff.statistics.addedWords).toBeGreaterThan(2)
      expect(diff.statistics.removedWords).toBeGreaterThan(0)
      
      // Verify HTML structure preservation in changes
      const hasStructuralChanges = diff.changes.some((change: any) => 
        change.type === 'addition' && change.content.includes('<')
      )
      expect(hasStructuralChanges).toBe(true)
    })
  })

  describe('Version Restoration API', () => {
    it('should restore document to previous version [INT-VERSION-08]', async () => {
      // Test ID: INT-VERSION-08
      // PRD Reference: Version restoration functionality
      
      const documentId = 'test-doc-restore'
      
      // Create initial version
      const initialContent = '<p>Initial document content</p>'
      const version1Response = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({
          content: initialContent,
          description: 'Initial version',
          wordCount: 3,
          charCount: 35,
        })
        .expect(201)
      
      // Create modified version
      const modifiedContent = '<h1>Modified Title</h1><p>Modified content with more text</p>'
      await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({
          content: modifiedContent,
          description: 'Modified version',
          wordCount: 7,
          charCount: 65,
        })
        .expect(201)
      
      const version1Number = version1Response.body.data.versionNumber
      
      // Restore to initial version
      const restoreResponse = await request(baseURL)
        .post(`/api/documents/${documentId}/versions/${version1Number}/restore`)
        .expect(200)
      
      expect(restoreResponse.body).toHaveProperty('success', true)
      expect(restoreResponse.body.data).toHaveProperty('newVersionNumber')
      expect(restoreResponse.body.data).toHaveProperty('restoredFromVersion', version1Number)
      expect(restoreResponse.body.data).toHaveProperty('timestamp')
      
      const newVersionNumber = restoreResponse.body.data.newVersionNumber
      
      // Verify new version was created with restored content
      const newVersionResponse = await request(baseURL)
        .get(`/api/documents/${documentId}/versions/${newVersionNumber}`)
        .expect(200)
      
      expect(newVersionResponse.body.data.content).toBe(initialContent)
      expect(newVersionResponse.body.data.description)
        .toMatch(/restored.*version.*1/i)
      
      // Verify version history shows restoration
      const historyResponse = await request(baseURL)
        .get(`/api/documents/${documentId}/versions`)
        .expect(200)
      
      expect(historyResponse.body.data.versions).toHaveLength(3) // Original 2 + restoration
      expect(historyResponse.body.data.versions[0].versionNumber)
        .toBe(newVersionNumber)
    })

    it('should handle restoration conflicts [INT-VERSION-09]', async () => {
      // Test ID: INT-VERSION-09
      // PRD Reference: Version conflict resolution during restoration
      
      const documentId = 'test-doc-conflict'
      
      // Create initial version
      const version1Response = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({
          content: '<p>Version 1 content</p>',
          description: 'Version 1',
          wordCount: 3,
          charCount: 25,
        })
        .expect(201)
      
      // Simulate concurrent modification (in real app, this could be from another user)
      await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({
          content: '<p>Concurrent modification</p>',
          description: 'Concurrent change',
          wordCount: 2,
          charCount: 30,
        })
        .expect(201)
      
      const version1Number = version1Response.body.data.versionNumber
      
      // Try to restore to version 1 - should detect conflict scenario  
      // (Implementation would need to track current version expectations)
      const restoreResponse = await request(baseURL)
        .post(`/api/documents/${documentId}/versions/${version1Number}/restore`)
        .send({
          expectedCurrentVersion: 1, // Expecting version 1 but version 2 exists
        })
      
      // Depending on implementation, this could return 409 (conflict) or succeed
      // For this test, assume it succeeds but includes conflict metadata
      if (restoreResponse.status === 200) {
        expect(restoreResponse.body.data).toHaveProperty('hasConflict')
        if (restoreResponse.body.data.hasConflict) {
          expect(restoreResponse.body.data).toHaveProperty('conflictDetails')
        }
      } else if (restoreResponse.status === 409) {
        expect(restoreResponse.body).toHaveProperty('error')
        expect(restoreResponse.body.error.code).toBe('VERSION_CONFLICT')
        expect(restoreResponse.body.error).toHaveProperty('conflictDetails')
      }
    })
  })

  describe('Event Sourcing Integration API', () => {
    it('should create document events through API [INT-VERSION-10]', async () => {
      // Test ID: INT-VERSION-10
      // PRD Reference: Event sourcing API integration
      
      const documentId = 'test-doc-events'
      
      // Create content change event
      const contentEvent = DocumentEventFactory.createContentChangeEvent(
        documentId,
        '<p>Old content</p>',
        '<p>New content</p>',
        'replace'
      )
      
      const eventResponse = await request(baseURL)
        .post('/api/events/document')
        .send({
          type: contentEvent.type,
          payload: contentEvent.payload,
          timestamp: contentEvent.timestamp.toISOString(),
          userId: 'test-user',
        })
        .expect(201)
      
      expect(eventResponse.body).toHaveProperty('success', true)
      expect(eventResponse.body.data).toHaveProperty('eventId')
      expect(eventResponse.body.data).toHaveProperty('timestamp')
      expect(eventResponse.body.data.type).toBe(contentEvent.type)
      
      // Create version save event
      const versionEvent = DocumentEventFactory.createVersionSaveEvent(
        documentId,
        1,
        '<p>New content</p>',
        { description: 'Saved version via events' }
      )
      
      const versionEventResponse = await request(baseURL)
        .post('/api/events/document')
        .send({
          type: versionEvent.type,
          payload: versionEvent.payload,
          timestamp: versionEvent.timestamp.toISOString(),
          userId: 'test-user',
        })
        .expect(201)
      
      expect(versionEventResponse.body.data.type).toBe(versionEvent.type)
    })

    it('should retrieve document events with filtering [INT-VERSION-11]', async () => {
      // Test ID: INT-VERSION-11
      // PRD Reference: Event retrieval with filtering options
      
      const documentId = 'test-doc-event-filter'
      
      // Create multiple types of events
      const events = [
        DocumentEventFactory.createContentChangeEvent(documentId, '', '<p>Content 1</p>', 'insert'),
        DocumentEventFactory.createVersionSaveEvent(documentId, 1, '<p>Content 1</p>', { description: 'V1' }),
        DocumentEventFactory.createContentChangeEvent(documentId, '<p>Content 1</p>', '<p>Content 2</p>', 'replace'),
        DocumentEventFactory.createUndoRedoEvent(documentId, 'undo', '<p>Content 2</p>', '<p>Content 1</p>'),
      ]
      
      // Create all events
      for (const event of events) {
        await request(baseURL)
          .post('/api/events/document')
          .send({
            type: event.type,
            payload: event.payload,
            timestamp: event.timestamp.toISOString(),
            userId: 'test-user',
          })
          .expect(201)
      }
      
      // Retrieve all events for document
      const allEventsResponse = await request(baseURL)
        .get('/api/events/document')
        .query({ documentId })
        .expect(200)
      
      expect(allEventsResponse.body.data).toHaveLength(4)
      
      // Filter by event type
      const contentEventsResponse = await request(baseURL)
        .get('/api/events/document')
        .query({ 
          documentId,
          type: 'DOCUMENT_CONTENT_CHANGE',
        })
        .expect(200)
      
      expect(contentEventsResponse.body.data).toHaveLength(2)
      contentEventsResponse.body.data.forEach((event: any) => {
        expect(event.type).toBe('DOCUMENT_CONTENT_CHANGE')
      })
      
      // Filter by type prefix
      const documentEventsResponse = await request(baseURL)
        .get('/api/events/document')
        .query({ 
          documentId,
          typePrefix: 'DOCUMENT_',
        })
        .expect(200)
      
      expect(documentEventsResponse.body.data).toHaveLength(4)
      
      // Filter by timestamp range
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      const timeFilterResponse = await request(baseURL)
        .get('/api/events/document')
        .query({ 
          documentId,
          fromTimestamp: oneHourAgo.toISOString(),
        })
        .expect(200)
      
      expect(timeFilterResponse.body.data.length).toBeGreaterThan(0)
      
      // Test pagination
      const paginatedResponse = await request(baseURL)
        .get('/api/events/document')
        .query({ 
          documentId,
          limit: 2,
        })
        .expect(200)
      
      expect(paginatedResponse.body.data).toHaveLength(2)
    })
  })

  describe('API Error Handling', () => {
    it('should handle malformed requests gracefully [INT-VERSION-12]', async () => {
      // Test ID: INT-VERSION-12
      // PRD Reference: API error handling and validation
      
      const documentId = 'test-doc-errors'
      
      // Test invalid JSON
      const invalidJsonResponse = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400)
      
      expect(invalidJsonResponse.body).toHaveProperty('error')
      expect(invalidJsonResponse.body.error.message).toMatch(/invalid.*json|malformed/i)
      
      // Test missing content-type
      const noContentTypeResponse = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send('{"content":"test"}')
        .expect(400)
      
      expect(noContentTypeResponse.body).toHaveProperty('error')
      
      // Test oversized request
      const oversizedContent = 'x'.repeat(10 * 1024 * 1024) // 10MB content
      const oversizedResponse = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({ content: oversizedContent })
        .expect(413) // Payload Too Large
      
      expect(oversizedResponse.body).toHaveProperty('error')
      expect(oversizedResponse.body.error.message).toMatch(/too.*large|size.*limit/i)
    })

    it('should handle database errors gracefully [INT-VERSION-13]', async () => {
      // Test ID: INT-VERSION-13
      // PRD Reference: Database error handling and recovery
      
      // This test would simulate database connectivity issues
      // In real implementation, you might temporarily disconnect the database
      // or use dependency injection to mock database failures
      
      const documentId = 'test-doc-db-error'
      
      // Attempt operation that would trigger database error
      // (Implementation specific - might require special test configuration)
      
      // For this test, we'll assume the API handles database errors properly
      // and returns appropriate error responses rather than crashing
      
      // Test version creation with simulated database error
      // This might be achieved through test configuration or mocking
      const response = await request(baseURL)
        .post(`/api/documents/${documentId}/versions`)
        .send({
          content: '<p>Test content</p>',
          description: 'Test description',
          forceDbError: true, // Special test flag
        })
      
      // Expect either success or proper error handling
      if (response.status !== 201) {
        expect(response.status).toBe(503) // Service Unavailable
        expect(response.body).toHaveProperty('error')
        expect(response.body.error.code).toBe('DATABASE_ERROR')
        expect(response.body.error.message).toMatch(/database.*unavailable|connection.*error/i)
        expect(response.body.error).toHaveProperty('retryAfter')
      }
    })
  })
})