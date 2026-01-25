import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

// Mock the firebase module
vi.mock('../lib/firebase', () => ({
  getFirebaseAuth: vi.fn(),
  getFirebaseDb: vi.fn(),
  isFirebaseConfigured: vi.fn(() => false),
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts with null user and profile', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
    })

    it('starts with loading false when Firebase not configured', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.isLoading).toBe(false)
    })

    it('has no error initially', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.error).toBeNull()
    })
  })

  describe('signIn', () => {
    it('sets error when Firebase is not configured', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn()
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Firebase is not configured')
      })
    })
  })

  describe('signOut', () => {
    it('does nothing when not signed in', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('needsUsername', () => {
    it('is false when not signed in', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.needsUsername).toBe(false)
    })
  })
})
