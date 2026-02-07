/**
 * useSpaceBoard Hook
 *
 * Fetches a single board and its cards from Firestore (space context).
 * Used when viewing another user's shared board.
 */

import { useState, useEffect, useCallback } from 'react'
import type { SpaceBoard, SpaceCard } from '../lib/spaceTypes'
import { getSpaceBoard, getSpaceCards } from '../lib/firestoreSpaces'

export interface UseSpaceBoardReturn {
  /** The board from Firestore */
  board: SpaceBoard | null
  /** Cards for the board from Firestore */
  cards: SpaceCard[]
  /** Whether data is loading */
  isLoading: boolean
  /** Error message if any */
  error: string | null
  /** Refresh data from Firestore */
  refresh: () => Promise<void>
}

/**
 * Fetch a board and its cards from a space in Firestore
 * @param spaceId - The space ID (null to skip)
 * @param boardId - The board ID (null to skip)
 */
export const useSpaceBoard = (
  spaceId: string | null,
  boardId: string | null
): UseSpaceBoardReturn => {
  const [board, setBoard] = useState<SpaceBoard | null>(null)
  const [cards, setCards] = useState<SpaceCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!spaceId || !boardId) {
      setBoard(null)
      setCards([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [boardData, cardsData] = await Promise.all([
        getSpaceBoard(spaceId, boardId),
        getSpaceCards(spaceId, boardId),
      ])

      setBoard(boardData)
      setCards(cardsData)
    } catch (err) {
      console.error('Error loading space board:', err)
      setError('Failed to load board')
    } finally {
      setIsLoading(false)
    }
  }, [spaceId, boardId])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    board,
    cards,
    isLoading,
    error,
    refresh: loadData,
  }
}
