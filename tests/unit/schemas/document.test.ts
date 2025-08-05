import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { DocumentSchema } from '../../../schemas/database/document'

describe('DocumentSchema', () => {
  describe('Given valid document data', () => {
    const validDocument = {
      id: 'doc-123',
      title: 'My Test Document',
      content: 'This is the document content with some text.',
      metadata: {
        author: 'John Doe',
        tags: ['important', 'draft'],
        version: 1,
        lastModified: new Date('2024-01-01T00:00:00.000Z'),
      },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    }

    it('should validate when all required fields are present', () => {
      const result = DocumentSchema.safeParse(validDocument)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('doc-123')
        expect(result.data.title).toBe('My Test Document')
        expect(result.data.content).toBe(
          'This is the document content with some text.'
        )
        expect(result.data.metadata).toEqual(validDocument.metadata)
      }
    })

    it('should infer correct TypeScript type from schema', () => {
      type DocumentType = z.infer<typeof DocumentSchema>
      const document: DocumentType = validDocument

      // Type assertions to verify inference
      expect(typeof document.id).toBe('string')
      expect(typeof document.title).toBe('string')
      expect(typeof document.content).toBe('string')
      expect(typeof document.metadata).toBe('object')
      expect(document.createdAt).toBeInstanceOf(Date)
      expect(document.updatedAt).toBeInstanceOf(Date)
    })

    it('should validate with minimal required fields', () => {
      const minimalDocument = {
        id: 'doc-minimal',
        title: 'Minimal Document',
        content: 'Basic content',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(minimalDocument)
      expect(result.success).toBe(true)
    })

    it('should validate with empty content', () => {
      const emptyContentDoc = {
        id: 'doc-empty',
        title: 'Empty Document',
        content: '',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(emptyContentDoc)
      expect(result.success).toBe(true)
    })

    it('should validate with complex metadata', () => {
      const complexMetadata = {
        author: 'Jane Smith',
        tags: ['research', 'published', 'peer-reviewed'],
        version: 3,
        lastModified: new Date('2024-01-15T10:30:00.000Z'),
        wordCount: 1250,
        language: 'en',
        category: 'academic',
        references: ['ref1', 'ref2', 'ref3'],
      }

      const documentWithComplexMetadata = {
        id: 'doc-complex',
        title: 'Complex Document',
        content: 'Complex document content...',
        metadata: complexMetadata,
      }

      const result = DocumentSchema.safeParse(documentWithComplexMetadata)
      expect(result.success).toBe(true)
    })
  })

  describe('Given invalid document data', () => {
    it('should fail when id is missing', () => {
      const invalidDocument = {
        title: 'Test Document',
        content: 'Some content',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['id'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when title is missing', () => {
      const invalidDocument = {
        id: 'doc-123',
        content: 'Some content',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when content is missing', () => {
      const invalidDocument = {
        id: 'doc-123',
        title: 'Test Document',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['content'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when metadata is missing', () => {
      const invalidDocument = {
        id: 'doc-123',
        title: 'Test Document',
        content: 'Some content',
      }

      const result = DocumentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['metadata'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when id is empty string', () => {
      const invalidDocument = {
        id: '',
        title: 'Test Document',
        content: 'Some content',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['id'],
              code: 'too_small',
            }),
          ])
        )
      }
    })

    it('should fail when title is empty string', () => {
      const invalidDocument = {
        id: 'doc-123',
        title: '',
        content: 'Some content',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              code: 'too_small',
            }),
          ])
        )
      }
    })

    it('should fail when id is not a string', () => {
      const invalidDocument = {
        id: 123,
        title: 'Test Document',
        content: 'Some content',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['id'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when title is not a string', () => {
      const invalidDocument = {
        id: 'doc-123',
        title: null,
        content: 'Some content',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when content is not a string', () => {
      const invalidDocument = {
        id: 'doc-123',
        title: 'Test Document',
        content: 123,
        metadata: {},
      }

      const result = DocumentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['content'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when metadata is not an object', () => {
      const invalidDocument = {
        id: 'doc-123',
        title: 'Test Document',
        content: 'Some content',
        metadata: 'not-an-object',
      }

      const result = DocumentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['metadata'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })
  })

  describe('Given edge cases', () => {
    it('should handle very long titles within limits', () => {
      const longTitle = 'A'.repeat(200) // Assuming 255 char limit
      const documentWithLongTitle = {
        id: 'doc-long-title',
        title: longTitle,
        content: 'Some content',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(documentWithLongTitle)
      expect(result.success).toBe(true)
    })

    it('should fail with excessively long titles', () => {
      const tooLongTitle = 'A'.repeat(300) // Exceeding assumed limit
      const documentWithTooLongTitle = {
        id: 'doc-too-long-title',
        title: tooLongTitle,
        content: 'Some content',
        metadata: {},
      }

      const result = DocumentSchema.safeParse(documentWithTooLongTitle)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              code: 'too_big',
            }),
          ])
        )
      }
    })

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000) // Large content
      const documentWithLongContent = {
        id: 'doc-long-content',
        title: 'Document with Long Content',
        content: longContent,
        metadata: {},
      }

      const result = DocumentSchema.safeParse(documentWithLongContent)
      expect(result.success).toBe(true)
    })

    it('should handle metadata with nested objects', () => {
      const nestedMetadata = {
        author: {
          name: 'John Doe',
          email: 'john@example.com',
          profile: {
            bio: 'Software developer',
            skills: ['JavaScript', 'TypeScript'],
          },
        },
        document: {
          type: 'technical',
          classification: 'public',
          approval: {
            status: 'approved',
            approver: 'Jane Smith',
            date: new Date('2024-01-01T00:00:00.000Z'),
          },
        },
      }

      const documentWithNestedMetadata = {
        id: 'doc-nested',
        title: 'Document with Nested Metadata',
        content: 'Content here',
        metadata: nestedMetadata,
      }

      const result = DocumentSchema.safeParse(documentWithNestedMetadata)
      expect(result.success).toBe(true)
    })

    it('should handle null input gracefully', () => {
      const result = DocumentSchema.safeParse(null)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should handle undefined input gracefully', () => {
      const result = DocumentSchema.safeParse(undefined)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should handle metadata with null values', () => {
      const metadataWithNulls = {
        author: null,
        tags: null,
        version: null,
      }

      const documentWithNullMetadata = {
        id: 'doc-null-meta',
        title: 'Document with Null Metadata',
        content: 'Content here',
        metadata: metadataWithNulls,
      }

      const result = DocumentSchema.safeParse(documentWithNullMetadata)
      expect(result.success).toBe(true)
    })
  })

  describe('Schema exports', () => {
    it('should export DocumentSchema as Zod schema', () => {
      expect(DocumentSchema).toBeDefined()
      expect(typeof DocumentSchema.parse).toBe('function')
      expect(typeof DocumentSchema.safeParse).toBe('function')
    })

    it('should have correct schema structure', () => {
      expect(DocumentSchema._def.typeName).toBe('ZodObject')
      expect(DocumentSchema.shape).toBeDefined()
      expect(DocumentSchema.shape.id).toBeDefined()
      expect(DocumentSchema.shape.title).toBeDefined()
      expect(DocumentSchema.shape.content).toBeDefined()
      expect(DocumentSchema.shape.metadata).toBeDefined()
    })
  })
})
