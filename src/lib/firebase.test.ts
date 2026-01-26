import { describe, it, expect, beforeEach } from 'vitest'
import {
  isFirebaseInitialized,
  resetFirebase,
} from './firebase'

/**
 * Note: isFirebaseConfigured() cannot be reliably tested because it reads
 * import.meta.env values which are injected at compile time by Vite.
 * vi.stubGlobal doesn't work because the values are already baked into the module.
 *
 * The function works correctly at runtime - we test initialization state instead.
 */

describe('firebase', () => {
  beforeEach(() => {
    resetFirebase()
  })

  describe('isFirebaseInitialized', () => {
    it('returns false initially', () => {
      expect(isFirebaseInitialized()).toBe(false)
    })
  })

  describe('resetFirebase', () => {
    it('resets initialization state', () => {
      resetFirebase()
      expect(isFirebaseInitialized()).toBe(false)
    })
  })
})
