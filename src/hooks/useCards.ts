/**
 * useCards Hook
 *
 * Manages card state for a specific board with localStorage persistence.
 * Handles CRUD operations and drag-drop reordering.
 */

import { useState, useCallback, useEffect } from 'react'
import { getCardsByBoard, saveCard, deleteCard, saveCardsForBoard } from '../lib/storage'
import { createCard as createCardEntity, type Card } from '../lib/types'

interface UseCardsReturn {
  /** Cards for the board, sorted by rank */
  cards: Card[]
  /** Create a new card at the bottom of the list */
  createCard: (name: string, imageKey?: string | null, thumbnailKey?: string | null) => Card
  /** Update an existing card */
  updateCard: (id: string, updates: Partial<Omit<Card, 'id' | 'boardId' | 'createdAt'>>) => void
  /** Delete a card */
  deleteCard: (id: string) => void
  /** Reorder cards by moving from one index to another */
  reorderCards: (fromIndex: number, toIndex: number) => void
  /** Get a specific card by ID */
  getCard: (id: string) => Card | undefined
  /** Refresh cards from storage */
  refresh: () => void
}

export const useCards = (boardId: string): UseCardsReturn => {
  // Load initial cards from storage, sorted by rank
  const [cards, setCards] = useState<Card[]>(() =>
    getCardsByBoard(boardId).sort((a, b) => a.rank - b.rank)
  )

  // Reload when boardId changes
  useEffect(() => {
    setCards(getCardsByBoard(boardId).sort((a, b) => a.rank - b.rank))
  }, [boardId])

  const createCardFn = useCallback(
    (name: string, imageKey: string | null = null, thumbnailKey: string | null = null): Card => {
      // Calculate next rank (max rank + 1, or 1 if no cards)
      const maxRank = cards.length > 0 ? Math.max(...cards.map((c) => c.rank)) : 0
      const nextRank = maxRank + 1

      const card = createCardEntity(boardId, name, nextRank)
      card.imageKey = imageKey
      card.thumbnailKey = thumbnailKey

      saveCard(card)
      setCards((prev) => [...prev, card].sort((a, b) => a.rank - b.rank))
      return card
    },
    [boardId, cards]
  )

  const updateCardFn = useCallback((id: string, updates: Partial<Omit<Card, 'id' | 'boardId' | 'createdAt'>>) => {
    setCards((prev) => {
      const index = prev.findIndex((c) => c.id === id)
      if (index === -1) return prev

      const updated: Card = {
        ...prev[index],
        ...updates,
        updatedAt: Date.now(),
      }

      saveCard(updated)

      const newCards = [...prev]
      newCards[index] = updated
      return newCards.sort((a, b) => a.rank - b.rank)
    })
  }, [])

  const deleteCardFn = useCallback((id: string) => {
    deleteCard(id)
    setCards((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const reorderCards = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    setCards((prev) => {
      // Create a new array with the reordered items
      const newCards = [...prev]
      const [movedCard] = newCards.splice(fromIndex, 1)
      newCards.splice(toIndex, 0, movedCard)

      // Update ranks to match new order
      const updatedCards = newCards.map((card, index) => ({
        ...card,
        rank: index + 1,
        updatedAt: Date.now(),
      }))

      // Persist cards for this board only (preserves other boards' cards)
      saveCardsForBoard(boardId, updatedCards)

      return updatedCards
    })
  }, [boardId])

  const getCardFn = useCallback(
    (id: string): Card | undefined => {
      return cards.find((c) => c.id === id)
    },
    [cards]
  )

  const refresh = useCallback(() => {
    setCards(getCardsByBoard(boardId).sort((a, b) => a.rank - b.rank))
  }, [boardId])

  return {
    cards,
    createCard: createCardFn,
    updateCard: updateCardFn,
    deleteCard: deleteCardFn,
    reorderCards,
    getCard: getCardFn,
    refresh,
  }
}
