import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCards } from './useCards'
import * as storage from '../lib/storage'
import type { Card } from '../lib/types'

// Mock the storage module
vi.mock('../lib/storage')

const mockStorage = storage as unknown as {
  getCardsByBoard: ReturnType<typeof vi.fn>
  saveCard: ReturnType<typeof vi.fn>
  deleteCard: ReturnType<typeof vi.fn>
  saveCardsForBoard: ReturnType<typeof vi.fn>
}

describe('useCards', () => {
  const boardId = 'test-board'

  const mockCard1: Card = {
    id: 'card-1',
    boardId,
    name: 'Card 1',
    nickname: '',
    imageKey: null,
    thumbnailKey: null,
    imageCrop: null,
    notes: '',
    metadata: {},
    rank: 1,
    createdAt: 1000,
    updatedAt: 1000,
  }

  const mockCard2: Card = {
    id: 'card-2',
    boardId,
    name: 'Card 2',
    nickname: '',
    imageKey: 'img-key',
    thumbnailKey: 'thumb-key',
    imageCrop: null,
    notes: 'Some notes',
    metadata: {},
    rank: 2,
    createdAt: 2000,
    updatedAt: 2000,
  }

  const mockCard3: Card = {
    id: 'card-3',
    boardId,
    name: 'Card 3',
    nickname: '',
    imageKey: null,
    thumbnailKey: null,
    imageCrop: null,
    notes: '',
    metadata: {},
    rank: 3,
    createdAt: 3000,
    updatedAt: 3000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage.getCardsByBoard.mockReturnValue([])
  })

  describe('initial state', () => {
    it('loads cards for the board on mount', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1, mockCard2])

      const { result } = renderHook(() => useCards(boardId))

      expect(mockStorage.getCardsByBoard).toHaveBeenCalledWith(boardId)
      expect(result.current.cards).toHaveLength(2)
    })

    it('returns empty array when no cards exist', () => {
      mockStorage.getCardsByBoard.mockReturnValue([])

      const { result } = renderHook(() => useCards(boardId))

      expect(result.current.cards).toEqual([])
    })

    it('cards are sorted by rank', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard2, mockCard1, mockCard3])

      const { result } = renderHook(() => useCards(boardId))

      expect(result.current.cards[0].rank).toBe(1)
      expect(result.current.cards[1].rank).toBe(2)
      expect(result.current.cards[2].rank).toBe(3)
    })
  })

  describe('createCard', () => {
    it('creates a new card at the bottom of the list', async () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1, mockCard2])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.createCard('New Card')
      })

      await waitFor(() => {
        expect(mockStorage.saveCard).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Card',
            boardId,
            rank: 3, // Next rank after 2
          })
        )
      })
    })

    it('creates card with image keys', async () => {
      mockStorage.getCardsByBoard.mockReturnValue([])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.createCard('Card With Image', 'full-key', 'thumb-key')
      })

      await waitFor(() => {
        expect(mockStorage.saveCard).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Card With Image',
            imageKey: 'full-key',
            thumbnailKey: 'thumb-key',
          })
        )
      })
    })

    it('assigns rank 1 to first card', async () => {
      mockStorage.getCardsByBoard.mockReturnValue([])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.createCard('First Card')
      })

      await waitFor(() => {
        expect(mockStorage.saveCard).toHaveBeenCalledWith(
          expect.objectContaining({
            rank: 1,
          })
        )
      })
    })

    it('returns the created card', () => {
      mockStorage.getCardsByBoard.mockReturnValue([])

      const { result } = renderHook(() => useCards(boardId))

      let createdCard: Card | undefined
      act(() => {
        createdCard = result.current.createCard('New Card')
      })

      expect(createdCard).toBeDefined()
      expect(createdCard?.name).toBe('New Card')
    })

    it('adds new card to state', () => {
      mockStorage.getCardsByBoard.mockReturnValue([])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.createCard('New Card')
      })

      expect(result.current.cards).toHaveLength(1)
    })
  })

  describe('updateCard', () => {
    it('updates an existing card', async () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.updateCard(mockCard1.id, { name: 'Updated Name' })
      })

      await waitFor(() => {
        expect(mockStorage.saveCard).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'card-1',
            name: 'Updated Name',
          })
        )
      })
    })

    it('updates card in state', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.updateCard(mockCard1.id, { notes: 'New notes' })
      })

      expect(result.current.cards[0].notes).toBe('New notes')
    })

    it('updates the updatedAt timestamp', async () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1])
      const beforeUpdate = Date.now()

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.updateCard(mockCard1.id, { name: 'Updated' })
      })

      await waitFor(() => {
        const savedCard = mockStorage.saveCard.mock.calls[0][0] as Card
        expect(savedCard.updatedAt).toBeGreaterThanOrEqual(beforeUpdate)
      })
    })

    it('does nothing for non-existent card', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.updateCard('non-existent', { name: 'Test' })
      })

      expect(mockStorage.saveCard).not.toHaveBeenCalled()
    })
  })

  describe('deleteCard', () => {
    it('deletes a card', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1, mockCard2])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.deleteCard(mockCard1.id)
      })

      expect(mockStorage.deleteCard).toHaveBeenCalledWith('card-1')
    })

    it('removes card from state', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1, mockCard2])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.deleteCard(mockCard1.id)
      })

      expect(result.current.cards).toHaveLength(1)
      expect(result.current.cards[0].id).toBe('card-2')
    })
  })

  describe('reorderCards', () => {
    it('reorders cards by moving card to new position', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1, mockCard2, mockCard3])

      const { result } = renderHook(() => useCards(boardId))

      // Move card at index 2 (Card 3) to index 0
      act(() => {
        result.current.reorderCards(2, 0)
      })

      expect(result.current.cards[0].id).toBe('card-3')
      expect(result.current.cards[1].id).toBe('card-1')
      expect(result.current.cards[2].id).toBe('card-2')
    })

    it('updates ranks after reorder', async () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1, mockCard2, mockCard3])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.reorderCards(2, 0)
      })

      await waitFor(() => {
        expect(mockStorage.saveCardsForBoard).toHaveBeenCalled()
        const savedCards = mockStorage.saveCardsForBoard.mock.calls[0][1] as Card[]

        // After reorder: Card 3 -> rank 1, Card 1 -> rank 2, Card 2 -> rank 3
        const card3 = savedCards.find((c) => c.id === 'card-3')
        const card1 = savedCards.find((c) => c.id === 'card-1')
        const card2 = savedCards.find((c) => c.id === 'card-2')

        expect(card3?.rank).toBe(1)
        expect(card1?.rank).toBe(2)
        expect(card2?.rank).toBe(3)
      })
    })

    it('handles moving down in list', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1, mockCard2, mockCard3])

      const { result } = renderHook(() => useCards(boardId))

      // Move card at index 0 (Card 1) to index 2
      act(() => {
        result.current.reorderCards(0, 2)
      })

      expect(result.current.cards[0].id).toBe('card-2')
      expect(result.current.cards[1].id).toBe('card-3')
      expect(result.current.cards[2].id).toBe('card-1')
    })

    it('does nothing when from and to are the same', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1, mockCard2])

      const { result } = renderHook(() => useCards(boardId))

      act(() => {
        result.current.reorderCards(1, 1)
      })

      expect(mockStorage.saveCardsForBoard).not.toHaveBeenCalled()
    })
  })

  describe('getCard', () => {
    it('returns card by id', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1, mockCard2])

      const { result } = renderHook(() => useCards(boardId))

      const card = result.current.getCard('card-2')

      expect(card?.name).toBe('Card 2')
    })

    it('returns undefined for non-existent card', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1])

      const { result } = renderHook(() => useCards(boardId))

      const card = result.current.getCard('non-existent')

      expect(card).toBeUndefined()
    })
  })

  describe('refresh', () => {
    it('reloads cards from storage', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1])

      const { result } = renderHook(() => useCards(boardId))

      expect(result.current.cards).toHaveLength(1)

      // Simulate external change
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1, mockCard2])

      act(() => {
        result.current.refresh()
      })

      expect(result.current.cards).toHaveLength(2)
    })
  })

  describe('board change', () => {
    it('reloads cards when boardId changes', () => {
      mockStorage.getCardsByBoard.mockReturnValue([mockCard1])

      const { rerender } = renderHook(
        ({ boardId }) => useCards(boardId),
        { initialProps: { boardId: 'board-1' } }
      )

      expect(mockStorage.getCardsByBoard).toHaveBeenCalledWith('board-1')

      mockStorage.getCardsByBoard.mockReturnValue([mockCard2])

      rerender({ boardId: 'board-2' })

      expect(mockStorage.getCardsByBoard).toHaveBeenCalledWith('board-2')
    })
  })
})
