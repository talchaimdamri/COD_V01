import { expect, afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// extends Vitest's expect method with methods from react-testing-library
expected.extend(matchers)

// Polyfill Array.isArray for JSDOM environment
if (typeof Array.isArray !== 'function') {
  global.Array.isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]'
  }
}

// Mock ResizeObserver for virtualization
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(callback: ResizeObserverCallback) {
    // Immediately trigger callback with mock entries for initial setup
    setTimeout(() => {
      callback([
        {
          target: { 
            clientHeight: 400, 
            clientWidth: 300,
            offsetHeight: 400,
            offsetWidth: 300,
            scrollHeight: 400,
            scrollWidth: 300
          } as Element,
          contentRect: { 
            height: 400, 
            width: 300, 
            top: 0, 
            left: 0, 
            bottom: 400, 
            right: 300, 
            x: 0, 
            y: 0 
          },
          borderBoxSize: [{ blockSize: 400, inlineSize: 300 }],
          contentBoxSize: [{ blockSize: 400, inlineSize: 300 }],
          devicePixelContentBoxSize: [{ blockSize: 400, inlineSize: 300 }],
        }
      ] as ResizeObserverEntry[], this as ResizeObserver)
    }, 0)
  }
}

Object.defineProperty(global, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true,
  configurable: true
})

// Mock performance.now for timing tests
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  },
  writable: true,
  configurable: true
})

// Mock requestAnimationFrame/cancelAnimationFrame
Object.defineProperty(global, 'requestAnimationFrame', {
  value: vi.fn((cb: FrameRequestCallback) => {
    return setTimeout(() => cb(performance.now()), 16) // 60fps
  }),
  writable: true,
  configurable: true
})

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: vi.fn((id: number) => clearTimeout(id)),
  writable: true,
  configurable: true
})

// Setup DOM element properties that JSDOM doesn't provide
beforeEach(() => {
  // Mock scroll behavior for elements
  Element.prototype.scrollTo = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  
  // Mock getBoundingClientRect for virtual scrolling calculations
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 400,
    right: 300,
    width: 300,
    height: 400,
    x: 0,
    y: 0,
  }))
})

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
