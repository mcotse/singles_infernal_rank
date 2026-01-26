/**
 * useBoardSync Hook Tests
 *
 * Tests for the board synchronization hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBoardSync, type SyncStatus } from './useBoardSync'
import type { Board } from '../lib/types'

// Mock the firestoreBoards module
vi.mock('../lib/firestoreBoards', () => ({
  fullBoardSync: vi.fn(),
  syncBoardsToCloud: vi.fn(),
  getCloudBoardsByOwner: vi.fn(),
  toCloudBoard: vi.fn((board, ownerId) => ({ ...board, ownerId, syncedAt: Date.now(), sharing: { visibility: 'private', publicLinkEnabled: false } })),
  fromCloudBoard: vi.fn((cloudBoard) => ({
    id: cloudBoard.id,
    name: cloudBoard.name,
    coverImage: cloudBoard.coverImage,
    createdAt: cloudBoard.createdAt,
    updatedAt: cloudBoard.updatedAt,
    deletedAt: cloudBoard.deletedAt,
  })),
  mergeBoardLists: vi.fn((local, cloud) => local),
}))

// Mock storage
vi.mock('../lib/storage', () => ({
  getBoards: vi.fn(() => []),
  saveBoards: vi.fn(),
}))

describe('useBoardSync', () => {
  const mockBoard: Board = {
    id: 'board-123',
    name: 'Test Board',
    coverImage: null,
    createdAt: Date.now() - 10000,
    updatedAt: Date.now(),
    deletedAt: null,
  }

  const mockUserId = 'user-abc'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should start with idle status when no user', () => {
      const { result } = renderHook(() => useBoardSync({ userId: null }))

      expect(result.current.status).toBe('idle')
      expect(result.current.error).toBeNull()
      expect(result.current.lastSyncedAt).toBeNull()
    })

    it('should have syncing functions available', () => {
      const { result } = renderHook(() => useBoardSync({ userId: null }))

      expect(typeof result.current.syncAll).toBe('function')
      expect(typeof result.current.syncBoard).toBe('function')
    })
  })

  describe('syncAll', () => {
    it('should not sync when no user ID', async () => {
      const { result } = renderHook(() => useBoardSync({ userId: null }))

      await act(async () => {
        await result.current.syncAll([mockBoard])
      })

      expect(result.current.status).toBe('idle')
    })

    it('should set status to syncing during sync', async () => {
      const { fullBoardSync } = await import('../lib/firestoreBoards')
      const mockFullBoardSync = fullBoardSync as ReturnType<typeof vi.fn>

      let resolveSync: (value: Board[]) => void
      mockFullBoardSync.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSync = resolve
          })
      )

      const { result } = renderHook(() => useBoardSync({ userId: mockUserId }))

      let syncPromise: Promise<Board[]>
      act(() => {
        syncPromise = result.current.syncAll([mockBoard])
      })

      // Should be syncing
      expect(result.current.status).toBe('syncing')

      // Resolve the sync
      await act(async () => {
        resolveSync!([mockBoard])
        await syncPromise
      })

      expect(result.current.status).toBe('synced')
    })

    it('should set status to error on failure', async () => {
      const { fullBoardSync } = await import('../lib/firestoreBoards')
      const mockFullBoardSync = fullBoardSync as ReturnType<typeof vi.fn>
      mockFullBoardSync.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useBoardSync({ userId: mockUserId }))

      await act(async () => {
        await result.current.syncAll([mockBoard])
      })

      expect(result.current.status).toBe('error')
      expect(result.current.error).toBe('Network error')
    })

    it('should update lastSyncedAt on successful sync', async () => {
      const { fullBoardSync } = await import('../lib/firestoreBoards')
      const mockFullBoardSync = fullBoardSync as ReturnType<typeof vi.fn>
      mockFullBoardSync.mockResolvedValue([mockBoard])

      const { result } = renderHook(() => useBoardSync({ userId: mockUserId }))

      const before = Date.now()
      await act(async () => {
        await result.current.syncAll([mockBoard])
      })
      const after = Date.now()

      expect(result.current.lastSyncedAt).not.toBeNull()
      expect(result.current.lastSyncedAt).toBeGreaterThanOrEqual(before)
      expect(result.current.lastSyncedAt).toBeLessThanOrEqual(after)
    })

    it('should return merged boards on success', async () => {
      const { fullBoardSync } = await import('../lib/firestoreBoards')
      const mockFullBoardSync = fullBoardSync as ReturnType<typeof vi.fn>
      const mergedBoards = [mockBoard, { ...mockBoard, id: 'board-456' }]
      mockFullBoardSync.mockResolvedValue(mergedBoards)

      const { result } = renderHook(() => useBoardSync({ userId: mockUserId }))

      let returnedBoards: Board[]
      await act(async () => {
        returnedBoards = await result.current.syncAll([mockBoard])
      })

      expect(returnedBoards!).toHaveLength(2)
      expect(returnedBoards!).toEqual(mergedBoards)
    })
  })

  describe('syncBoard', () => {
    it('should sync a single board', async () => {
      const { syncBoardsToCloud } = await import('../lib/firestoreBoards')
      const mockSyncBoardsToCloud = syncBoardsToCloud as ReturnType<typeof vi.fn>
      mockSyncBoardsToCloud.mockResolvedValue([{ ...mockBoard, ownerId: mockUserId, syncedAt: Date.now() }])

      const { result } = renderHook(() => useBoardSync({ userId: mockUserId }))

      await act(async () => {
        await result.current.syncBoard(mockBoard)
      })

      expect(mockSyncBoardsToCloud).toHaveBeenCalledWith([mockBoard], mockUserId)
      expect(result.current.status).toBe('synced')
    })

    it('should not sync when no user ID', async () => {
      const { syncBoardsToCloud } = await import('../lib/firestoreBoards')
      const mockSyncBoardsToCloud = syncBoardsToCloud as ReturnType<typeof vi.fn>

      const { result } = renderHook(() => useBoardSync({ userId: null }))

      await act(async () => {
        await result.current.syncBoard(mockBoard)
      })

      expect(mockSyncBoardsToCloud).not.toHaveBeenCalled()
    })
  })

  describe('clearError', () => {
    it('should clear error and reset to idle', async () => {
      const { fullBoardSync } = await import('../lib/firestoreBoards')
      const mockFullBoardSync = fullBoardSync as ReturnType<typeof vi.fn>
      mockFullBoardSync.mockRejectedValue(new Error('Test error'))

      const { result } = renderHook(() => useBoardSync({ userId: mockUserId }))

      await act(async () => {
        await result.current.syncAll([mockBoard])
      })

      expect(result.current.status).toBe('error')
      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.error).toBeNull()
    })
  })

  describe('isSyncing', () => {
    it('should be true when status is syncing', async () => {
      const { fullBoardSync } = await import('../lib/firestoreBoards')
      const mockFullBoardSync = fullBoardSync as ReturnType<typeof vi.fn>

      let resolveSync: (value: Board[]) => void
      mockFullBoardSync.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSync = resolve
          })
      )

      const { result } = renderHook(() => useBoardSync({ userId: mockUserId }))

      let syncPromise: Promise<Board[]>
      act(() => {
        syncPromise = result.current.syncAll([mockBoard])
      })

      expect(result.current.isSyncing).toBe(true)

      await act(async () => {
        resolveSync!([mockBoard])
        await syncPromise
      })

      expect(result.current.isSyncing).toBe(false)
    })
  })
})
