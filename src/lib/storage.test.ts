import {
  getBoards,
  saveBoards,
  getBoard,
  saveBoard,
  deleteBoard,
  getCards,
  saveCards,
  getCardsByBoard,
  getCard,
  saveCard,
  deleteCard,
  deleteCardsByBoard,
  getSettings,
  saveSettings,
  clearAllData,
  exportData,
} from './storage'
import { createBoard, createCard } from './types'

describe('localStorage Storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Boards', () => {
    it('returns empty array when no boards exist', () => {
      expect(getBoards()).toEqual([])
    })

    it('saves and retrieves boards', () => {
      const board1 = createBoard('Board 1')
      const board2 = createBoard('Board 2')

      saveBoards([board1, board2])
      const boards = getBoards()

      expect(boards).toHaveLength(2)
      expect(boards[0].name).toBe('Board 1')
      expect(boards[1].name).toBe('Board 2')
    })

    it('gets a single board by ID', () => {
      const board = createBoard('Test Board')
      saveBoards([board])

      const retrieved = getBoard(board.id)
      expect(retrieved?.name).toBe('Test Board')
    })

    it('returns null for non-existent board', () => {
      expect(getBoard('non-existent')).toBeNull()
    })

    it('saves a new board', () => {
      const board = createBoard('New Board')
      saveBoard(board)

      expect(getBoards()).toHaveLength(1)
      expect(getBoard(board.id)?.name).toBe('New Board')
    })

    it('updates an existing board', () => {
      const board = createBoard('Original')
      saveBoard(board)

      const updated = { ...board, name: 'Updated', updatedAt: Date.now() }
      saveBoard(updated)

      expect(getBoards()).toHaveLength(1)
      expect(getBoard(board.id)?.name).toBe('Updated')
    })

    it('deletes a board', () => {
      const board = createBoard('To Delete')
      saveBoard(board)

      deleteBoard(board.id)
      expect(getBoards()).toHaveLength(0)
    })

    it('filters out invalid data', () => {
      localStorage.setItem('singles-infernal-rank:boards', JSON.stringify([
        { id: '1', name: 'Valid', createdAt: 1, updatedAt: 1, coverImage: null, deletedAt: null },
        { invalid: true },
        'not an object',
      ]))

      const boards = getBoards()
      expect(boards).toHaveLength(1)
      expect(boards[0].name).toBe('Valid')
    })
  })

  describe('Cards', () => {
    it('returns empty array when no cards exist', () => {
      expect(getCards()).toEqual([])
    })

    it('saves and retrieves cards', () => {
      const card1 = createCard('board-1', 'Card 1', 1)
      const card2 = createCard('board-1', 'Card 2', 2)

      saveCards([card1, card2])
      const cards = getCards()

      expect(cards).toHaveLength(2)
    })

    it('gets cards by board sorted by rank', () => {
      const card1 = createCard('board-1', 'Third', 3)
      const card2 = createCard('board-1', 'First', 1)
      const card3 = createCard('board-2', 'Other Board', 1)
      const card4 = createCard('board-1', 'Second', 2)

      saveCards([card1, card2, card3, card4])
      const boardCards = getCardsByBoard('board-1')

      expect(boardCards).toHaveLength(3)
      expect(boardCards[0].name).toBe('First')
      expect(boardCards[1].name).toBe('Second')
      expect(boardCards[2].name).toBe('Third')
    })

    it('gets a single card by ID', () => {
      const card = createCard('board-1', 'Test Card', 1)
      saveCards([card])

      expect(getCard(card.id)?.name).toBe('Test Card')
    })

    it('saves a new card', () => {
      const card = createCard('board-1', 'New Card', 1)
      saveCard(card)

      expect(getCards()).toHaveLength(1)
    })

    it('updates an existing card', () => {
      const card = createCard('board-1', 'Original', 1)
      saveCard(card)

      const updated = { ...card, name: 'Updated' }
      saveCard(updated)

      expect(getCards()).toHaveLength(1)
      expect(getCard(card.id)?.name).toBe('Updated')
    })

    it('deletes a card', () => {
      const card = createCard('board-1', 'To Delete', 1)
      saveCard(card)

      deleteCard(card.id)
      expect(getCards()).toHaveLength(0)
    })

    it('deletes all cards for a board', () => {
      const card1 = createCard('board-1', 'Card 1', 1)
      const card2 = createCard('board-1', 'Card 2', 2)
      const card3 = createCard('board-2', 'Other Board', 1)

      saveCards([card1, card2, card3])
      deleteCardsByBoard('board-1')

      const remaining = getCards()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].boardId).toBe('board-2')
    })
  })

  describe('Settings', () => {
    it('returns default settings when none exist', () => {
      const settings = getSettings()
      expect(settings.soundsEnabled).toBe(false)
    })

    it('saves and retrieves settings', () => {
      saveSettings({ soundsEnabled: true })

      const settings = getSettings()
      expect(settings.soundsEnabled).toBe(true)
    })

    it('merges with existing settings', () => {
      saveSettings({ soundsEnabled: true })
      // If we add more settings in the future, they should merge

      const settings = getSettings()
      expect(settings.soundsEnabled).toBe(true)
    })
  })

  describe('Utilities', () => {
    it('clears all data', () => {
      saveBoard(createBoard('Board'))
      saveCard(createCard('board-1', 'Card', 1))
      saveSettings({ soundsEnabled: true })

      clearAllData()

      expect(getBoards()).toEqual([])
      expect(getCards()).toEqual([])
      expect(getSettings().soundsEnabled).toBe(false) // Back to default
    })

    it('exports data as JSON', () => {
      const board = createBoard('Export Test')
      const card = createCard(board.id, 'Test Card', 1)
      saveBoard(board)
      saveCard(card)

      const exported = exportData()
      const parsed = JSON.parse(exported)

      expect(parsed.boards).toHaveLength(1)
      expect(parsed.cards).toHaveLength(1)
      expect(parsed.exportedAt).toBeDefined()
    })
  })
})
