// Quick debug script to check model selector issues
import { availableModels } from './tests/fixtures/inspector.js'

console.log('Available models:')
availableModels.forEach((model, i) => {
  console.log(`[${i}] ${model.id}: ${model.name} - Available: ${model.isAvailable}`)
})

console.log('\nTarget model (index 1):', availableModels[1])