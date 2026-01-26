/**
 * useBoards Hook
 *
 * Manages board state with localStorage persistence.
 * Handles CRUD operations, soft delete, and restore.
 */

import { useState, useCallback, useMemo } from 'react'
import { getBoards, saveBoard, deleteBoard } from '../lib/storage'
import { createBoard as createBoardEntity, type Board } from '../lib/types'

interface UseBoardsOptions {
  /** Include soft-deleted boards in the main list */
  includeDeleted?: boolean
}

interface CreateBoardOptions {
  /** Cover image key (from IndexedDB) */
  coverImage?: string | null
  /** Template ID if creating from a template */
  templateId?: string
}

interface UseBoardsReturn {
  /** Active boards (excludes deleted unless includeDeleted is true) */
  boards: Board[]
  /** Soft-deleted boards awaiting permanent deletion */
  deletedBoards: Board[]
  /** Create a new board */
  createBoard: (name: string, options?: CreateBoardOptions) => Board
  /** Update an existing board */
  updateBoard: (id: string, updates: Partial<Omit<Board, 'id' | 'createdAt'>>) => void
  /** Soft delete a board (can be restored) */
  softDeleteBoard: (id: string) => void
  /** Restore a soft-deleted board */
  restoreBoard: (id: string) => void
  /** Permanently delete a board */
  permanentlyDeleteBoard: (id: string) => void
  /** Get a specific board by ID */
  getBoard: (id: string) => Board | undefined
  /** Refresh boards from storage */
  refresh: () => void
}

export const useBoards = (options: UseBoardsOptions = {}): UseBoardsReturn => {
  const { includeDeleted = false } = options

  // Load initial boards from storage
  const [allBoards, setAllBoards] = useState<Board[]>(() => getBoards())

  // Split active and deleted boards
  const { boards, deletedBoards } = useMemo(() => {
    const active: Board[] = []
    const deleted: Board[] = []

    for (const board of allBoards) {
      if (board.deletedAt !== null) {
        deleted.push(board)
      } else {
        active.push(board)
      }
    }

    return {
      boards: includeDeleted ? allBoards : active,
      deletedBoards: deleted,
    }
  }, [allBoards, includeDeleted])

  const createBoardFn = useCallback((name: string, options?: CreateBoardOptions): Board => {
    const board = createBoardEntity(name, options?.coverImage ?? null, options?.templateId)
    saveBoard(board)
    setAllBoards((prev) => [...prev, board])
    return board
  }, [])

  const updateBoard = useCallback((id: string, updates: Partial<Omit<Board, 'id' | 'createdAt'>>) => {
    setAllBoards((prev) => {
      const index = prev.findIndex((b) => b.id === id)
      if (index === -1) return prev

      const updated: Board = {
        ...prev[index],
        ...updates,
        updatedAt: Date.now(),
      }

      saveBoard(updated)

      const newBoards = [...prev]
      newBoards[index] = updated
      return newBoards
    })
  }, [])

  const softDeleteBoard = useCallback((id: string) => {
    updateBoard(id, { deletedAt: Date.now() })
  }, [updateBoard])

  const restoreBoard = useCallback((id: string) => {
    updateBoard(id, { deletedAt: null })
  }, [updateBoard])

  const permanentlyDeleteBoard = useCallback((id: string) => {
    deleteBoard(id)
    setAllBoards((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const getBoardFn = useCallback((id: string): Board | undefined => {
    return allBoards.find((b) => b.id === id)
  }, [allBoards])

  const refresh = useCallback(() => {
    setAllBoards(getBoards())
  }, [])

  return {
    boards,
    deletedBoards,
    createBoard: createBoardFn,
    updateBoard,
    softDeleteBoard,
    restoreBoard,
    permanentlyDeleteBoard,
    getBoard: getBoardFn,
    refresh,
  }
}
