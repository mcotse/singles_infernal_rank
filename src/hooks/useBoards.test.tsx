import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBoards } from './useBoards'
import * as storage from '../lib/storage'
import type { Board } from '../lib/types'

// Mock the storage module
vi.mock('../lib/storage')

const mockStorage = storage as unknown as {
  getBoards: ReturnType<typeof vi.fn>
  saveBoard: ReturnType<typeof vi.fn>
  deleteBoard: ReturnType<typeof vi.fn>
}

describe('useBoards', () => {
  const mockBoard1: Board = {
    id: 'board-1',
    name: 'Test Board 1',
    coverImage: null,
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: null,
  }

  const mockBoard2: Board = {
    id: 'board-2',
    name: 'Test Board 2',
    coverImage: 'img-key',
    createdAt: 2000,
    updatedAt: 2000,
    deletedAt: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage.getBoards.mockReturnValue([])
  })

  describe('initial state', () => {
    it('loads boards on mount', () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1, mockBoard2])

      const { result } = renderHook(() => useBoards())

      expect(result.current.boards).toHaveLength(2)
      expect(result.current.boards[0].name).toBe('Test Board 1')
    })

    it('returns empty array when no boards exist', () => {
      mockStorage.getBoards.mockReturnValue([])

      const { result } = renderHook(() => useBoards())

      expect(result.current.boards).toEqual([])
    })

    it('filters out soft-deleted boards by default', () => {
      const deletedBoard: Board = { ...mockBoard1, deletedAt: Date.now() }
      mockStorage.getBoards.mockReturnValue([deletedBoard, mockBoard2])

      const { result } = renderHook(() => useBoards())

      expect(result.current.boards).toHaveLength(1)
      expect(result.current.boards[0].id).toBe('board-2')
    })
  })

  describe('createBoard', () => {
    it('creates a new board with given name', async () => {
      mockStorage.getBoards.mockReturnValue([])

      const { result } = renderHook(() => useBoards())

      act(() => {
        result.current.createBoard('New Board')
      })

      await waitFor(() => {
        expect(mockStorage.saveBoard).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Board',
            coverImage: null,
            deletedAt: null,
          })
        )
      })
    })

    it('creates board with cover image', async () => {
      mockStorage.getBoards.mockReturnValue([])

      const { result } = renderHook(() => useBoards())

      act(() => {
        result.current.createBoard('Board With Cover', { coverImage: 'cover-key' })
      })

      await waitFor(() => {
        expect(mockStorage.saveBoard).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Board With Cover',
            coverImage: 'cover-key',
          })
        )
      })
    })

    it('returns the created board', () => {
      mockStorage.getBoards.mockReturnValue([])

      const { result } = renderHook(() => useBoards())

      let createdBoard: Board | undefined
      act(() => {
        createdBoard = result.current.createBoard('New Board')
      })

      expect(createdBoard).toBeDefined()
      expect(createdBoard?.name).toBe('New Board')
    })

    it('adds new board to state', () => {
      mockStorage.getBoards.mockReturnValue([])

      const { result } = renderHook(() => useBoards())

      act(() => {
        result.current.createBoard('New Board')
      })

      expect(result.current.boards).toHaveLength(1)
      expect(result.current.boards[0].name).toBe('New Board')
    })
  })

  describe('updateBoard', () => {
    it('updates an existing board', async () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1])

      const { result } = renderHook(() => useBoards())

      act(() => {
        result.current.updateBoard(mockBoard1.id, { name: 'Updated Name' })
      })

      await waitFor(() => {
        expect(mockStorage.saveBoard).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'board-1',
            name: 'Updated Name',
          })
        )
      })
    })

    it('updates board in state', () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1])

      const { result } = renderHook(() => useBoards())

      act(() => {
        result.current.updateBoard(mockBoard1.id, { name: 'Updated Name' })
      })

      expect(result.current.boards[0].name).toBe('Updated Name')
    })

    it('updates the updatedAt timestamp', async () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1])
      const beforeUpdate = Date.now()

      const { result } = renderHook(() => useBoards())

      act(() => {
        result.current.updateBoard(mockBoard1.id, { name: 'Updated' })
      })

      await waitFor(() => {
        const savedBoard = mockStorage.saveBoard.mock.calls[0][0] as Board
        expect(savedBoard.updatedAt).toBeGreaterThanOrEqual(beforeUpdate)
      })
    })

    it('does nothing for non-existent board', () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1])

      const { result } = renderHook(() => useBoards())

      act(() => {
        result.current.updateBoard('non-existent', { name: 'Test' })
      })

      expect(mockStorage.saveBoard).not.toHaveBeenCalled()
    })
  })

  describe('softDeleteBoard', () => {
    it('sets deletedAt timestamp', async () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1])
      const beforeDelete = Date.now()

      const { result } = renderHook(() => useBoards())

      act(() => {
        result.current.softDeleteBoard(mockBoard1.id)
      })

      await waitFor(() => {
        const savedBoard = mockStorage.saveBoard.mock.calls[0][0] as Board
        expect(savedBoard.deletedAt).toBeGreaterThanOrEqual(beforeDelete)
      })
    })

    it('removes board from visible list', () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1, mockBoard2])

      const { result } = renderHook(() => useBoards())

      expect(result.current.boards).toHaveLength(2)

      act(() => {
        result.current.softDeleteBoard(mockBoard1.id)
      })

      expect(result.current.boards).toHaveLength(1)
      expect(result.current.boards[0].id).toBe('board-2')
    })
  })

  describe('restoreBoard', () => {
    it('clears deletedAt timestamp', async () => {
      const deletedBoard: Board = { ...mockBoard1, deletedAt: Date.now() }
      mockStorage.getBoards.mockReturnValue([deletedBoard])

      const { result } = renderHook(() => useBoards({ includeDeleted: true }))

      act(() => {
        result.current.restoreBoard(mockBoard1.id)
      })

      await waitFor(() => {
        const savedBoard = mockStorage.saveBoard.mock.calls[0][0] as Board
        expect(savedBoard.deletedAt).toBeNull()
      })
    })
  })

  describe('permanentlyDeleteBoard', () => {
    it('calls storage deleteBoard', () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1])

      const { result } = renderHook(() => useBoards())

      act(() => {
        result.current.permanentlyDeleteBoard(mockBoard1.id)
      })

      expect(mockStorage.deleteBoard).toHaveBeenCalledWith('board-1')
    })

    it('removes board from state', () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1])

      const { result } = renderHook(() => useBoards())

      act(() => {
        result.current.permanentlyDeleteBoard(mockBoard1.id)
      })

      expect(result.current.boards).toHaveLength(0)
    })
  })

  describe('getBoard', () => {
    it('returns board by id', () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1, mockBoard2])

      const { result } = renderHook(() => useBoards())

      const board = result.current.getBoard('board-2')

      expect(board?.name).toBe('Test Board 2')
    })

    it('returns undefined for non-existent board', () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1])

      const { result } = renderHook(() => useBoards())

      const board = result.current.getBoard('non-existent')

      expect(board).toBeUndefined()
    })
  })

  describe('includeDeleted option', () => {
    it('includes deleted boards when enabled', () => {
      const deletedBoard: Board = { ...mockBoard1, deletedAt: Date.now() }
      mockStorage.getBoards.mockReturnValue([deletedBoard, mockBoard2])

      const { result } = renderHook(() => useBoards({ includeDeleted: true }))

      expect(result.current.boards).toHaveLength(2)
    })

    it('provides deletedBoards separately', () => {
      const deletedBoard: Board = { ...mockBoard1, deletedAt: Date.now() }
      mockStorage.getBoards.mockReturnValue([deletedBoard, mockBoard2])

      const { result } = renderHook(() => useBoards())

      expect(result.current.boards).toHaveLength(1)
      expect(result.current.deletedBoards).toHaveLength(1)
      expect(result.current.deletedBoards[0].id).toBe('board-1')
    })
  })

  describe('refresh', () => {
    it('reloads boards from storage', () => {
      mockStorage.getBoards.mockReturnValue([mockBoard1])

      const { result } = renderHook(() => useBoards())

      expect(result.current.boards).toHaveLength(1)

      // Simulate external change
      mockStorage.getBoards.mockReturnValue([mockBoard1, mockBoard2])

      act(() => {
        result.current.refresh()
      })

      expect(result.current.boards).toHaveLength(2)
    })
  })
})
