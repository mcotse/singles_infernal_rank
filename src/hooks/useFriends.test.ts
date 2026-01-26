/**
 * useFriends Hook Tests
 *
 * Tests for friend management state and operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFriends } from './useFriends'
import type { Friendship } from '../lib/socialTypes'

// Mock firestoreFriendships
vi.mock('../lib/firestoreFriendships', () => ({
  getFriendships: vi.fn().mockResolvedValue([]),
  getPendingRequests: vi.fn().mockResolvedValue([]),
  createFriendRequest: vi.fn().mockResolvedValue({ success: true, friendshipId: 'test-id' }),
  acceptFriendRequest: vi.fn().mockResolvedValue({ success: true }),
  declineFriendRequest: vi.fn().mockResolvedValue({ success: true }),
  unfriend: vi.fn().mockResolvedValue({ success: true }),
  blockUser: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock firestoreUsers (for fetching friend profiles)
vi.mock('../lib/firestoreUsers', () => ({
  getUsersByIds: vi.fn().mockResolvedValue([]),
  searchUsers: vi.fn().mockResolvedValue([]),
}))

describe('useFriends', () => {
  const mockUserId = 'user-abc'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have empty friends list initially', () => {
      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      expect(result.current.friends).toEqual([])
    })

    it('should have empty pending requests initially', () => {
      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      expect(result.current.incomingRequests).toEqual([])
      expect(result.current.outgoingRequests).toEqual([])
    })

    it('should start loading when userId is provided', () => {
      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      expect(result.current.isLoading).toBe(true)
    })

    it('should not load when userId is null', () => {
      const { result } = renderHook(() => useFriends({ userId: null }))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.friends).toEqual([])
    })
  })

  describe('sendRequest', () => {
    it('should call createFriendRequest', async () => {
      const { createFriendRequest } = await import('../lib/firestoreFriendships')
      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      await act(async () => {
        await result.current.sendRequest('user-xyz')
      })

      expect(createFriendRequest).toHaveBeenCalledWith(mockUserId, 'user-xyz')
    })

    it('should return success result', async () => {
      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      let response: { success: boolean; error?: string }
      await act(async () => {
        response = await result.current.sendRequest('user-xyz')
      })

      expect(response!.success).toBe(true)
    })

    it('should not send when userId is null', async () => {
      const { createFriendRequest } = await import('../lib/firestoreFriendships')
      const { result } = renderHook(() => useFriends({ userId: null }))

      await act(async () => {
        await result.current.sendRequest('user-xyz')
      })

      expect(createFriendRequest).not.toHaveBeenCalled()
    })
  })

  describe('acceptRequest', () => {
    it('should call acceptFriendRequest', async () => {
      const { acceptFriendRequest } = await import('../lib/firestoreFriendships')
      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      await act(async () => {
        await result.current.acceptRequest('friendship-123')
      })

      expect(acceptFriendRequest).toHaveBeenCalledWith('friendship-123', mockUserId)
    })
  })

  describe('declineRequest', () => {
    it('should call declineFriendRequest', async () => {
      const { declineFriendRequest } = await import('../lib/firestoreFriendships')
      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      await act(async () => {
        await result.current.declineRequest('friendship-123')
      })

      expect(declineFriendRequest).toHaveBeenCalledWith('friendship-123', mockUserId)
    })
  })

  describe('removeFriend', () => {
    it('should call unfriend', async () => {
      const { unfriend } = await import('../lib/firestoreFriendships')
      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      await act(async () => {
        await result.current.removeFriend('user-xyz')
      })

      expect(unfriend).toHaveBeenCalledWith(mockUserId, 'user-xyz')
    })
  })

  describe('blockFriend', () => {
    it('should call blockUser', async () => {
      const { blockUser } = await import('../lib/firestoreFriendships')
      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      await act(async () => {
        await result.current.blockFriend('user-xyz')
      })

      expect(blockUser).toHaveBeenCalledWith(mockUserId, 'user-xyz')
    })
  })

  describe('refresh', () => {
    it('should reload friends data', async () => {
      const { getFriendships, getPendingRequests } = await import('../lib/firestoreFriendships')
      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Clear mock counts
      vi.mocked(getFriendships).mockClear()
      vi.mocked(getPendingRequests).mockClear()

      // Trigger refresh
      await act(async () => {
        await result.current.refresh()
      })

      expect(getFriendships).toHaveBeenCalledWith(mockUserId)
      expect(getPendingRequests).toHaveBeenCalledWith(mockUserId, 'incoming')
      expect(getPendingRequests).toHaveBeenCalledWith(mockUserId, 'outgoing')
    })
  })

  describe('pendingCount', () => {
    it('should return count of incoming requests', async () => {
      const firestoreFriendships = await import('../lib/firestoreFriendships')
      const firestoreUsers = await import('../lib/firestoreUsers')

      const mockRequests: Friendship[] = [
        { id: 'f1', users: ['user-abc', 'user-def'], status: 'pending', requestedBy: 'user-def', createdAt: { toMillis: () => Date.now() } as never },
        { id: 'f2', users: ['user-abc', 'user-ghi'], status: 'pending', requestedBy: 'user-ghi', createdAt: { toMillis: () => Date.now() } as never },
      ]

      vi.mocked(firestoreFriendships.getPendingRequests).mockImplementation(async (_uid, direction) => {
        return direction === 'incoming' ? mockRequests : []
      })
      vi.mocked(firestoreFriendships.getFriendships).mockResolvedValue([])
      vi.mocked(firestoreUsers.getUsersByIds).mockResolvedValue([
        { uid: 'user-def', username: 'def', displayName: 'Def User', avatarUrl: '', isSearchable: true, blockedUsers: [], createdAt: { toMillis: () => Date.now() } as never, lastActive: { toMillis: () => Date.now() } as never },
        { uid: 'user-ghi', username: 'ghi', displayName: 'Ghi User', avatarUrl: '', isSearchable: true, blockedUsers: [], createdAt: { toMillis: () => Date.now() } as never, lastActive: { toMillis: () => Date.now() } as never },
      ])

      const { result } = renderHook(() => useFriends({ userId: mockUserId }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.pendingCount).toBe(2)
    })
  })
})
