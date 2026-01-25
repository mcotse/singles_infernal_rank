import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSnapshots } from './useSnapshots'
import * as storage from '../lib/storage'
import type { Snapshot, Card } from '../lib/types'

// Mock the storage module
vi.mock('../lib/storage')

const mockStorage = storage as unknown as {
  getSnapshotsByBoard: ReturnType<typeof vi.fn>
  saveSnapshot: ReturnType<typeof vi.fn>
  deleteSnapshot: ReturnType<typeof vi.fn>
  getNextEpisodeNumber: ReturnType<typeof vi.fn>
}

describe('useSnapshots', () => {
  const boardId = 'test-board'

  const mockSnapshot1: Snapshot = {
    id: 'snapshot-1',
    boardId,
    episodeNumber: 1,
    label: 'Episode 1',
    notes: 'First episode',
    rankings: [
      { cardId: 'card-1', cardName: 'Card 1', rank: 1, thumbnailKey: null },
      { cardId: 'card-2', cardName: 'Card 2', rank: 2, thumbnailKey: null },
    ],
    createdAt: 1000,
  }

  const mockSnapshot2: Snapshot = {
    id: 'snapshot-2',
    boardId,
    episodeNumber: 2,
    label: 'Episode 2',
    notes: '',
    rankings: [
      { cardId: 'card-2', cardName: 'Card 2', rank: 1, thumbnailKey: null },
      { cardId: 'card-1', cardName: 'Card 1', rank: 2, thumbnailKey: null },
    ],
    createdAt: 2000,
  }

  const mockCards: Card[] = [
    {
      id: 'card-1',
      boardId,
      name: 'Card 1',
      nickname: '',
      imageKey: null,
      thumbnailKey: 'thumb-1',
      imageCrop: null,
      notes: '',
      metadata: {},
      rank: 1,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'card-2',
      boardId,
      name: 'Card 2',
      nickname: '',
      imageKey: null,
      thumbnailKey: 'thumb-2',
      imageCrop: null,
      notes: '',
      metadata: {},
      rank: 2,
      createdAt: 2000,
      updatedAt: 2000,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage.getSnapshotsByBoard.mockReturnValue([])
    mockStorage.getNextEpisodeNumber.mockReturnValue(1)
  })

  describe('initial state', () => {
    it('loads snapshots for the board on mount', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1, mockSnapshot2])
      mockStorage.getNextEpisodeNumber.mockReturnValue(3)

      const { result } = renderHook(() => useSnapshots(boardId))

      expect(mockStorage.getSnapshotsByBoard).toHaveBeenCalledWith(boardId)
      expect(result.current.snapshots).toHaveLength(2)
    })

    it('returns empty array when no snapshots exist', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([])

      const { result } = renderHook(() => useSnapshots(boardId))

      expect(result.current.snapshots).toHaveLength(0)
    })

    it('returns next episode number from storage', () => {
      mockStorage.getNextEpisodeNumber.mockReturnValue(5)

      const { result } = renderHook(() => useSnapshots(boardId))

      expect(result.current.nextEpisodeNumber).toBe(5)
    })

    it('reloads snapshots when boardId changes', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1])

      const { rerender } = renderHook(({ id }) => useSnapshots(id), {
        initialProps: { id: 'board-1' },
      })

      expect(mockStorage.getSnapshotsByBoard).toHaveBeenCalledWith('board-1')

      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot2])
      rerender({ id: 'board-2' })

      expect(mockStorage.getSnapshotsByBoard).toHaveBeenCalledWith('board-2')
    })
  })

  describe('createSnapshot', () => {
    it('creates a snapshot from cards', () => {
      mockStorage.getNextEpisodeNumber.mockReturnValue(1)

      const { result } = renderHook(() => useSnapshots(boardId))

      let createdSnapshot: Snapshot | undefined
      act(() => {
        createdSnapshot = result.current.createSnapshot(mockCards)
      })

      expect(createdSnapshot).toBeDefined()
      expect(createdSnapshot!.boardId).toBe(boardId)
      expect(createdSnapshot!.episodeNumber).toBe(1)
      expect(createdSnapshot!.rankings).toHaveLength(2)
    })

    it('converts cards to ranking entries sorted by rank', () => {
      const unsortedCards = [mockCards[1], mockCards[0]] // Card 2 first, Card 1 second

      const { result } = renderHook(() => useSnapshots(boardId))

      let createdSnapshot: Snapshot | undefined
      act(() => {
        createdSnapshot = result.current.createSnapshot(unsortedCards)
      })

      // Should be sorted by rank
      expect(createdSnapshot!.rankings[0].cardName).toBe('Card 1')
      expect(createdSnapshot!.rankings[1].cardName).toBe('Card 2')
    })

    it('uses provided episode number', () => {
      const { result } = renderHook(() => useSnapshots(boardId))

      let createdSnapshot: Snapshot | undefined
      act(() => {
        createdSnapshot = result.current.createSnapshot(mockCards, { episodeNumber: 5 })
      })

      expect(createdSnapshot!.episodeNumber).toBe(5)
    })

    it('uses provided label and notes', () => {
      const { result } = renderHook(() => useSnapshots(boardId))

      let createdSnapshot: Snapshot | undefined
      act(() => {
        createdSnapshot = result.current.createSnapshot(mockCards, {
          label: 'Custom Label',
          notes: 'Custom notes',
        })
      })

      expect(createdSnapshot!.label).toBe('Custom Label')
      expect(createdSnapshot!.notes).toBe('Custom notes')
    })

    it('saves snapshot to storage', () => {
      const { result } = renderHook(() => useSnapshots(boardId))

      act(() => {
        result.current.createSnapshot(mockCards)
      })

      expect(mockStorage.saveSnapshot).toHaveBeenCalled()
    })

    it('adds snapshot to state', () => {
      const { result } = renderHook(() => useSnapshots(boardId))

      expect(result.current.snapshots).toHaveLength(0)

      act(() => {
        result.current.createSnapshot(mockCards)
      })

      expect(result.current.snapshots).toHaveLength(1)
    })

    it('increments next episode number after creation', () => {
      mockStorage.getNextEpisodeNumber.mockReturnValue(3)

      const { result } = renderHook(() => useSnapshots(boardId))

      expect(result.current.nextEpisodeNumber).toBe(3)

      act(() => {
        result.current.createSnapshot(mockCards)
      })

      expect(result.current.nextEpisodeNumber).toBe(4)
    })

    it('includes thumbnail keys from cards', () => {
      const { result } = renderHook(() => useSnapshots(boardId))

      let createdSnapshot: Snapshot | undefined
      act(() => {
        createdSnapshot = result.current.createSnapshot(mockCards)
      })

      expect(createdSnapshot!.rankings[0].thumbnailKey).toBe('thumb-1')
      expect(createdSnapshot!.rankings[1].thumbnailKey).toBe('thumb-2')
    })
  })

  describe('updateSnapshot', () => {
    it('updates snapshot label', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1])

      const { result } = renderHook(() => useSnapshots(boardId))

      act(() => {
        result.current.updateSnapshot('snapshot-1', { label: 'New Label' })
      })

      expect(result.current.snapshots[0].label).toBe('New Label')
    })

    it('updates snapshot notes', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1])

      const { result } = renderHook(() => useSnapshots(boardId))

      act(() => {
        result.current.updateSnapshot('snapshot-1', { notes: 'New notes' })
      })

      expect(result.current.snapshots[0].notes).toBe('New notes')
    })

    it('saves updated snapshot to storage', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1])

      const { result } = renderHook(() => useSnapshots(boardId))

      act(() => {
        result.current.updateSnapshot('snapshot-1', { label: 'New Label' })
      })

      expect(mockStorage.saveSnapshot).toHaveBeenCalled()
    })

    it('does nothing for non-existent snapshot', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1])

      const { result } = renderHook(() => useSnapshots(boardId))
      const originalSnapshots = result.current.snapshots

      act(() => {
        result.current.updateSnapshot('non-existent', { label: 'New Label' })
      })

      expect(result.current.snapshots).toBe(originalSnapshots)
      expect(mockStorage.saveSnapshot).not.toHaveBeenCalled()
    })
  })

  describe('deleteSnapshot', () => {
    it('removes snapshot from state', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1, mockSnapshot2])

      const { result } = renderHook(() => useSnapshots(boardId))

      expect(result.current.snapshots).toHaveLength(2)

      act(() => {
        result.current.deleteSnapshot('snapshot-1')
      })

      expect(result.current.snapshots).toHaveLength(1)
      expect(result.current.snapshots[0].id).toBe('snapshot-2')
    })

    it('calls storage delete', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1])

      const { result } = renderHook(() => useSnapshots(boardId))

      act(() => {
        result.current.deleteSnapshot('snapshot-1')
      })

      expect(mockStorage.deleteSnapshot).toHaveBeenCalledWith('snapshot-1')
    })
  })

  describe('getSnapshot', () => {
    it('returns snapshot by id', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1, mockSnapshot2])

      const { result } = renderHook(() => useSnapshots(boardId))

      const snapshot = result.current.getSnapshot('snapshot-2')

      expect(snapshot).toBe(mockSnapshot2)
    })

    it('returns undefined for non-existent id', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1])

      const { result } = renderHook(() => useSnapshots(boardId))

      const snapshot = result.current.getSnapshot('non-existent')

      expect(snapshot).toBeUndefined()
    })
  })

  describe('refresh', () => {
    it('reloads snapshots from storage', () => {
      mockStorage.getSnapshotsByBoard.mockReturnValue([])

      const { result } = renderHook(() => useSnapshots(boardId))

      expect(result.current.snapshots).toHaveLength(0)

      mockStorage.getSnapshotsByBoard.mockReturnValue([mockSnapshot1])

      act(() => {
        result.current.refresh()
      })

      expect(result.current.snapshots).toHaveLength(1)
    })

    it('updates next episode number', () => {
      mockStorage.getNextEpisodeNumber.mockReturnValue(1)

      const { result } = renderHook(() => useSnapshots(boardId))

      expect(result.current.nextEpisodeNumber).toBe(1)

      mockStorage.getNextEpisodeNumber.mockReturnValue(5)

      act(() => {
        result.current.refresh()
      })

      expect(result.current.nextEpisodeNumber).toBe(5)
    })
  })
})
