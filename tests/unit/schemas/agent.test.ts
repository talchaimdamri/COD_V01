import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { AgentSchema } from '../../../schemas/database/agent'

describe('AgentSchema', () => {
  describe('Given valid agent data', () => {
    const validAgent = {
      id: 'agent-123',
      name: 'Document Processor',
      prompt:
        'You are a document processing agent. Process the input document and extract key information.',
      model: 'gpt-4',
      tools: ['text-analyzer', 'summarizer', 'keyword-extractor'],
      config: {
        temperature: 0.7,
        maxTokens: 1000,
        timeout: 30000,
      },
      status: 'active',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    }

    it('should validate when all required fields are present', () => {
      const result = AgentSchema.safeParse(validAgent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('agent-123')
        expect(result.data.name).toBe('Document Processor')
        expect(result.data.prompt).toBe(
          'You are a document processing agent. Process the input document and extract key information.'
        )
        expect(result.data.model).toBe('gpt-4')
        expect(result.data.tools).toEqual([
          'text-analyzer',
          'summarizer',
          'keyword-extractor',
        ])
      }
    })

    it('should infer correct TypeScript type from schema', () => {
      type AgentType = z.infer<typeof AgentSchema>
      const agent: AgentType = validAgent

      // Type assertions to verify inference
      expect(typeof agent.id).toBe('string')
      expect(typeof agent.name).toBe('string')
      expect(typeof agent.prompt).toBe('string')
      expect(typeof agent.model).toBe('string')
      expect(Array.isArray(agent.tools)).toBe(true)
      expect(typeof agent.config).toBe('object')
      expect(agent.createdAt).toBeInstanceOf(Date)
      expect(agent.updatedAt).toBeInstanceOf(Date)
    })

    it('should validate with minimal required fields', () => {
      const minimalAgent = {
        id: 'agent-minimal',
        name: 'Minimal Agent',
        prompt: 'Basic prompt',
        model: 'gpt-3.5-turbo',
        tools: [],
      }

      const result = AgentSchema.safeParse(minimalAgent)
      expect(result.success).toBe(true)
    })

    it('should validate with empty tools array', () => {
      const agentWithoutTools = {
        id: 'agent-no-tools',
        name: 'Simple Agent',
        prompt: 'Simple processing agent',
        model: 'claude-3',
        tools: [],
      }

      const result = AgentSchema.safeParse(agentWithoutTools)
      expect(result.success).toBe(true)
    })

    it('should validate with various model types', () => {
      const modelVariants = [
        'gpt-4',
        'gpt-3.5-turbo',
        'claude-3-opus',
        'claude-3-sonnet',
        'claude-3-haiku',
        'gemini-pro',
        'custom-model-v1',
      ]

      modelVariants.forEach(model => {
        const agentWithModel = {
          id: `agent-${model}`,
          name: `Agent with ${model}`,
          prompt: 'Test prompt',
          model,
          tools: [],
        }

        const result = AgentSchema.safeParse(agentWithModel)
        expect(result.success).toBe(true)
      })
    })

    it('should validate with complex config object', () => {
      const complexConfig = {
        temperature: 0.8,
        maxTokens: 2000,
        timeout: 60000,
        retries: 3,
        systemMessage: 'You are a helpful assistant',
        stopSequences: ['\n\n', '###'],
        presencePenalty: 0.1,
        frequencyPenalty: 0.2,
        customSettings: {
          useCache: true,
          debugMode: false,
          outputFormat: 'json',
        },
      }

      const agentWithComplexConfig = {
        id: 'agent-complex',
        name: 'Complex Agent',
        prompt: 'Complex processing prompt',
        model: 'gpt-4',
        tools: ['tool1', 'tool2'],
        config: complexConfig,
      }

      const result = AgentSchema.safeParse(agentWithComplexConfig)
      expect(result.success).toBe(true)
    })
  })

  describe('Given invalid agent data', () => {
    it('should fail when id is missing', () => {
      const invalidAgent = {
        name: 'Test Agent',
        prompt: 'Test prompt',
        model: 'gpt-4',
        tools: [],
      }

      const result = AgentSchema.safeParse(invalidAgent)
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
      const invalidAgent = {
        id: 'agent-123',
        prompt: 'Test prompt',
        model: 'gpt-4',
        tools: [],
      }

      const result = AgentSchema.safeParse(invalidAgent)
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

    it('should fail when prompt is missing', () => {
      const invalidAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        model: 'gpt-4',
        tools: [],
      }

      const result = AgentSchema.safeParse(invalidAgent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['prompt'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when model is missing', () => {
      const invalidAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        prompt: 'Test prompt',
        tools: [],
      }

      const result = AgentSchema.safeParse(invalidAgent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['model'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when tools is missing', () => {
      const invalidAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        prompt: 'Test prompt',
        model: 'gpt-4',
      }

      const result = AgentSchema.safeParse(invalidAgent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['tools'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when id is empty string', () => {
      const invalidAgent = {
        id: '',
        name: 'Test Agent',
        prompt: 'Test prompt',
        model: 'gpt-4',
        tools: [],
      }

      const result = AgentSchema.safeParse(invalidAgent)
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
      const invalidAgent = {
        id: 'agent-123',
        name: '',
        prompt: 'Test prompt',
        model: 'gpt-4',
        tools: [],
      }

      const result = AgentSchema.safeParse(invalidAgent)
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

    it('should fail when prompt is empty string', () => {
      const invalidAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        prompt: '',
        model: 'gpt-4',
        tools: [],
      }

      const result = AgentSchema.safeParse(invalidAgent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['prompt'],
              code: 'too_small',
            }),
          ])
        )
      }
    })

    it('should fail when model is empty string', () => {
      const invalidAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        prompt: 'Test prompt',
        model: '',
        tools: [],
      }

      const result = AgentSchema.safeParse(invalidAgent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['model'],
              code: 'too_small',
            }),
          ])
        )
      }
    })

    it('should fail when tools is not an array', () => {
      const invalidAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        prompt: 'Test prompt',
        model: 'gpt-4',
        tools: 'not-an-array',
      }

      const result = AgentSchema.safeParse(invalidAgent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['tools'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when tools contains non-string values', () => {
      const invalidAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        prompt: 'Test prompt',
        model: 'gpt-4',
        tools: ['valid-tool', 123, null],
      }

      const result = AgentSchema.safeParse(invalidAgent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['tools', 1],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when fields have wrong types', () => {
      const invalidAgent = {
        id: 123,
        name: null,
        prompt: undefined,
        model: false,
        tools: {},
      }

      const result = AgentSchema.safeParse(invalidAgent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(5)
      }
    })
  })

  describe('Given edge cases', () => {
    it('should handle very long prompts within limits', () => {
      const longPrompt = 'A'.repeat(2000) // Large prompt
      const agentWithLongPrompt = {
        id: 'agent-long-prompt',
        name: 'Agent with Long Prompt',
        prompt: longPrompt,
        model: 'gpt-4',
        tools: [],
      }

      const result = AgentSchema.safeParse(agentWithLongPrompt)
      expect(result.success).toBe(true)
    })

    it('should fail with excessively long prompts', () => {
      const tooLongPrompt = 'A'.repeat(10000) // Assuming there's a limit
      const agentWithTooLongPrompt = {
        id: 'agent-too-long-prompt',
        name: 'Agent with Too Long Prompt',
        prompt: tooLongPrompt,
        model: 'gpt-4',
        tools: [],
      }

      const result = AgentSchema.safeParse(agentWithTooLongPrompt)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['prompt'],
              code: 'too_big',
            }),
          ])
        )
      }
    })

    it('should handle large tools arrays', () => {
      const manyTools = Array.from({ length: 50 }, (_, i) => `tool-${i}`)
      const agentWithManyTools = {
        id: 'agent-many-tools',
        name: 'Agent with Many Tools',
        prompt: 'Agent with lots of tools',
        model: 'gpt-4',
        tools: manyTools,
      }

      const result = AgentSchema.safeParse(agentWithManyTools)
      expect(result.success).toBe(true)
    })

    it('should handle special characters in names and prompts', () => {
      const agentWithSpecialChars = {
        id: 'agent-special',
        name: 'Agent™ with Spëcial Chars & Symbols! 🤖',
        prompt:
          'You are an agent with spëcial characters in your prompt: @#$%^&*()[]{}|\\:";\'<>?,./`~',
        model: 'gpt-4',
        tools: ['tool-with-hyphens', 'tool_with_underscores', 'tool.with.dots'],
      }

      const result = AgentSchema.safeParse(agentWithSpecialChars)
      expect(result.success).toBe(true)
    })

    it('should handle null input gracefully', () => {
      const result = AgentSchema.safeParse(null)
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
      const result = AgentSchema.safeParse(undefined)
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

    it('should handle config with various data types', () => {
      const configWithMixedTypes = {
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        arrayValue: [1, 2, 3],
        objectValue: { nested: 'value' },
        nullValue: null,
        dateValue: new Date('2024-01-01T00:00:00.000Z'),
      }

      const agentWithMixedConfig = {
        id: 'agent-mixed-config',
        name: 'Agent with Mixed Config',
        prompt: 'Test prompt',
        model: 'gpt-4',
        tools: [],
        config: configWithMixedTypes,
      }

      const result = AgentSchema.safeParse(agentWithMixedConfig)
      expect(result.success).toBe(true)
    })
  })

  describe('Schema exports', () => {
    it('should export AgentSchema as Zod schema', () => {
      expect(AgentSchema).toBeDefined()
      expect(typeof AgentSchema.parse).toBe('function')
      expect(typeof AgentSchema.safeParse).toBe('function')
    })

    it('should have correct schema structure', () => {
      expect(AgentSchema._def.typeName).toBe('ZodObject')
      expect(AgentSchema.shape).toBeDefined()
      expect(AgentSchema.shape.id).toBeDefined()
      expect(AgentSchema.shape.name).toBeDefined()
      expect(AgentSchema.shape.prompt).toBeDefined()
      expect(AgentSchema.shape.model).toBeDefined()
      expect(AgentSchema.shape.tools).toBeDefined()
    })
  })
})
