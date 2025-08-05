import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ChainSchema } from '../../../schemas/database/chain'

describe('ChainSchema', () => {
  describe('Given valid chain data', () => {
    const validChain = {
      id: 'chain-123',
      name: 'My Test Chain',
      nodes: [
        {
          id: 'node-1',
          type: 'document',
          position: { x: 100, y: 200 },
          data: { title: 'Input Document' },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          type: 'default',
        },
      ],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    }

    it('should validate when all required fields are present', () => {
      const result = ChainSchema.safeParse(validChain)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('chain-123')
        expect(result.data.name).toBe('My Test Chain')
        expect(result.data.nodes).toHaveLength(1)
        expect(result.data.edges).toHaveLength(1)
      }
    })

    it('should infer correct TypeScript type from schema', () => {
      type ChainType = z.infer<typeof ChainSchema>
      const chain: ChainType = validChain

      // Type assertions to verify inference
      expect(typeof chain.id).toBe('string')
      expect(typeof chain.name).toBe('string')
      expect(Array.isArray(chain.nodes)).toBe(true)
      expect(Array.isArray(chain.edges)).toBe(true)
      expect(chain.createdAt).toBeInstanceOf(Date)
      expect(chain.updatedAt).toBeInstanceOf(Date)
    })

    it('should validate with empty nodes and edges arrays', () => {
      const emptyChain = {
        ...validChain,
        nodes: [],
        edges: [],
      }

      const result = ChainSchema.safeParse(emptyChain)
      expect(result.success).toBe(true)
    })

    it('should validate with optional fields omitted', () => {
      const minimalChain = {
        id: 'chain-minimal',
        name: 'Minimal Chain',
        nodes: [],
        edges: [],
      }

      const result = ChainSchema.safeParse(minimalChain)
      expect(result.success).toBe(true)
    })
  })

  describe('Given invalid chain data', () => {
    it('should fail when id is missing', () => {
      const invalidChain = {
        name: 'Test Chain',
        nodes: [],
        edges: [],
      }

      const result = ChainSchema.safeParse(invalidChain)
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

    it('should fail when name is missing', () => {
      const invalidChain = {
        id: 'chain-123',
        nodes: [],
        edges: [],
      }

      const result = ChainSchema.safeParse(invalidChain)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['name'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when nodes is not an array', () => {
      const invalidChain = {
        id: 'chain-123',
        name: 'Test Chain',
        nodes: 'not-an-array',
        edges: [],
      }

      const result = ChainSchema.safeParse(invalidChain)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['nodes'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when edges is not an array', () => {
      const invalidChain = {
        id: 'chain-123',
        name: 'Test Chain',
        nodes: [],
        edges: 'not-an-array',
      }

      const result = ChainSchema.safeParse(invalidChain)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['edges'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when id is empty string', () => {
      const invalidChain = {
        id: '',
        name: 'Test Chain',
        nodes: [],
        edges: [],
      }

      const result = ChainSchema.safeParse(invalidChain)
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

    it('should fail when name is empty string', () => {
      const invalidChain = {
        id: 'chain-123',
        name: '',
        nodes: [],
        edges: [],
      }

      const result = ChainSchema.safeParse(invalidChain)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['name'],
              code: 'too_small',
            }),
          ])
        )
      }
    })

    it('should fail when id is not a string', () => {
      const invalidChain = {
        id: 123,
        name: 'Test Chain',
        nodes: [],
        edges: [],
      }

      const result = ChainSchema.safeParse(invalidChain)
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

    it('should fail when name is not a string', () => {
      const invalidChain = {
        id: 'chain-123',
        name: null,
        nodes: [],
        edges: [],
      }

      const result = ChainSchema.safeParse(invalidChain)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['name'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })
  })

  describe('Given edge cases', () => {
    it('should handle nodes with complex nested data', () => {
      const complexChain = {
        id: 'chain-complex',
        name: 'Complex Chain',
        nodes: [
          {
            id: 'node-1',
            type: 'document',
            position: { x: 0, y: 0 },
            data: {
              title: 'Complex Document',
              content: 'Some content',
              metadata: {
                author: 'Test Author',
                tags: ['tag1', 'tag2'],
              },
            },
          },
        ],
        edges: [],
      }

      const result = ChainSchema.safeParse(complexChain)
      expect(result.success).toBe(true)
    })

    it('should handle very long names within limits', () => {
      const longName = 'A'.repeat(200) // Assuming 255 char limit
      const chainWithLongName = {
        id: 'chain-long',
        name: longName,
        nodes: [],
        edges: [],
      }

      const result = ChainSchema.safeParse(chainWithLongName)
      expect(result.success).toBe(true)
    })

    it('should fail with excessively long names', () => {
      const tooLongName = 'A'.repeat(300) // Exceeding assumed limit
      const chainWithTooLongName = {
        id: 'chain-too-long',
        name: tooLongName,
        nodes: [],
        edges: [],
      }

      const result = ChainSchema.safeParse(chainWithTooLongName)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['name'],
              code: 'too_big',
            }),
          ])
        )
      }
    })

    it('should handle null input gracefully', () => {
      const result = ChainSchema.safeParse(null)
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
      const result = ChainSchema.safeParse(undefined)
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
  })

  describe('Schema exports', () => {
    it('should export ChainSchema as Zod schema', () => {
      expect(ChainSchema).toBeDefined()
      expect(typeof ChainSchema.parse).toBe('function')
      expect(typeof ChainSchema.safeParse).toBe('function')
    })

    it('should have correct schema structure', () => {
      expect(ChainSchema._def.typeName).toBe('ZodObject')
      expect(ChainSchema.shape).toBeDefined()
      expect(ChainSchema.shape.id).toBeDefined()
      expect(ChainSchema.shape.name).toBeDefined()
      expect(ChainSchema.shape.nodes).toBeDefined()
      expect(ChainSchema.shape.edges).toBeDefined()
    })
  })
})
