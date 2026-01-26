/**
 * useFriendBoards Hook Tests
 *
 * Tests for the friend boards fetching hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFriendBoards } from './useFriendBoards'

// Mock firestoreBoards
vi.mock('../lib/firestoreBoards', () => ({
  getCloudBoardsByOwner: vi.fn(),
  canUserViewBoard: vi.fn(),
  getSharedBoardCountByFriend: vi.fn(),
  filterVisibleBoards: vi.fn(),
}))

describe('useFriendBoards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when not signed in', () => {
    it('should return empty data', async () => {
      const { result } = renderHook(() =>
        useFriendBoards({ userId: null, friendIds: [] })
      )

      expect(result.current.sharedBoardCounts).toEqual({})
      expect(result.current.friendBoards).toEqual({})
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('when signed in with no friends', () => {
    it('should return empty data', async () => {
      const { result } = renderHook(() =>
        useFriendBoards({ userId: 'user-123', friendIds: [] })
      )

      expect(result.current.sharedBoardCounts).toEqual({})
      expect(result.current.friendBoards).toEqual({})
    })
  })

  describe('when signed in with friends', () => {
    it('should fetch boards for each friend', async () => {
      const { getCloudBoardsByOwner, filterVisibleBoards } = await import('../lib/firestoreBoards')

      const mockBoards = [
        { id: 'board-1', ownerId: 'friend-1', sharing: { visibility: 'friends', publicLinkEnabled: false } },
        { id: 'board-2', ownerId: 'friend-1', sharing: { visibility: 'private', publicLinkEnabled: false } },
      ]

      vi.mocked(getCloudBoardsByOwner).mockResolvedValue(mockBoards as never)
      vi.mocked(filterVisibleBoards).mockReturnValue([mockBoards[0]] as never)

      const { result } = renderHook(() =>
        useFriendBoards({ userId: 'user-123', friendIds: ['friend-1'] })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(getCloudBoardsByOwner).toHaveBeenCalledWith('friend-1')
    })

    it('should compute shared board counts correctly', async () => {
      const { getCloudBoardsByOwner, filterVisibleBoards } = await import('../lib/firestoreBoards')

      const mockBoards = [
        { id: 'board-1', ownerId: 'friend-1', sharing: { visibility: 'friends', publicLinkEnabled: false } },
        { id: 'board-2', ownerId: 'friend-1', sharing: { visibility: 'friends', publicLinkEnabled: false } },
      ]

      vi.mocked(getCloudBoardsByOwner).mockResolvedValue(mockBoards as never)
      vi.mocked(filterVisibleBoards).mockReturnValue(mockBoards as never)

      const { result } = renderHook(() =>
        useFriendBoards({ userId: 'user-123', friendIds: ['friend-1'] })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.sharedBoardCounts['friend-1']).toBe(2)
    })

    it('should store friend boards by friend ID', async () => {
      const { getCloudBoardsByOwner, filterVisibleBoards } = await import('../lib/firestoreBoards')

      const mockBoards = [
        { id: 'board-1', ownerId: 'friend-1', sharing: { visibility: 'friends', publicLinkEnabled: false } },
      ]

      vi.mocked(getCloudBoardsByOwner).mockResolvedValue(mockBoards as never)
      vi.mocked(filterVisibleBoards).mockReturnValue(mockBoards as never)

      const { result } = renderHook(() =>
        useFriendBoards({ userId: 'user-123', friendIds: ['friend-1'] })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.friendBoards['friend-1']).toHaveLength(1)
    })
  })
})
