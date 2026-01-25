import { createBoard, createCard, isBoard, isCard, type Board, type Card } from './types'

describe('Data Model Types', () => {
  describe('createBoard', () => {
    it('creates a board with required fields', () => {
      const board = createBoard('My Rankings')

      expect(board.name).toBe('My Rankings')
      expect(board.id).toBeDefined()
      expect(board.id.length).toBeGreaterThan(0)
      expect(board.coverImage).toBeNull()
      expect(board.deletedAt).toBeNull()
    })

    it('generates unique UUIDs', () => {
      const board1 = createBoard('Board 1')
      const board2 = createBoard('Board 2')

      expect(board1.id).not.toBe(board2.id)
    })

    it('sets timestamps', () => {
      const before = Date.now()
      const board = createBoard('Test')
      const after = Date.now()

      expect(board.createdAt).toBeGreaterThanOrEqual(before)
      expect(board.createdAt).toBeLessThanOrEqual(after)
      expect(board.updatedAt).toBe(board.createdAt)
    })

    it('accepts optional cover image', () => {
      const board = createBoard('Test', 'image-key-123')

      expect(board.coverImage).toBe('image-key-123')
    })
  })

  describe('createCard', () => {
    it('creates a card with required fields', () => {
      const card = createCard('board-123', 'Item Name', 1)

      expect(card.boardId).toBe('board-123')
      expect(card.name).toBe('Item Name')
      expect(card.rank).toBe(1)
      expect(card.id).toBeDefined()
    })

    it('sets default values for optional fields', () => {
      const card = createCard('board-123', 'Item', 1)

      expect(card.imageKey).toBeNull()
      expect(card.thumbnailKey).toBeNull()
      expect(card.imageCrop).toBeNull()
      expect(card.notes).toBe('')
      expect(card.metadata).toEqual({})
    })

    it('accepts optional fields', () => {
      const card = createCard('board-123', 'Item', 1, {
        imageKey: 'img-key',
        thumbnailKey: 'thumb-key',
        imageCrop: { x: 0.5, y: 0.5, scale: 1.5 },
        notes: 'Some notes',
        metadata: { age: 25 },
      })

      expect(card.imageKey).toBe('img-key')
      expect(card.thumbnailKey).toBe('thumb-key')
      expect(card.imageCrop).toEqual({ x: 0.5, y: 0.5, scale: 1.5 })
      expect(card.notes).toBe('Some notes')
      expect(card.metadata).toEqual({ age: 25 })
    })

    it('generates unique UUIDs', () => {
      const card1 = createCard('board-123', 'Card 1', 1)
      const card2 = createCard('board-123', 'Card 2', 2)

      expect(card1.id).not.toBe(card2.id)
    })
  })

  describe('isBoard', () => {
    it('returns true for valid board', () => {
      const board = createBoard('Test')
      expect(isBoard(board)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isBoard(null)).toBe(false)
    })

    it('returns false for non-object', () => {
      expect(isBoard('string')).toBe(false)
      expect(isBoard(123)).toBe(false)
    })

    it('returns false for object missing required fields', () => {
      expect(isBoard({ id: '123' })).toBe(false)
      expect(isBoard({ id: '123', name: 'Test' })).toBe(false)
    })

    it('returns true for object with all required fields', () => {
      const board: Board = {
        id: '123',
        name: 'Test',
        coverImage: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      }
      expect(isBoard(board)).toBe(true)
    })
  })

  describe('isCard', () => {
    it('returns true for valid card', () => {
      const card = createCard('board-123', 'Test', 1)
      expect(isCard(card)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isCard(null)).toBe(false)
    })

    it('returns false for object missing required fields', () => {
      expect(isCard({ id: '123' })).toBe(false)
      expect(isCard({ id: '123', boardId: 'board-1' })).toBe(false)
    })

    it('returns true for object with all required fields', () => {
      const card: Card = {
        id: '123',
        boardId: 'board-1',
        name: 'Test',
        nickname: '',
        imageKey: null,
        thumbnailKey: null,
        imageCrop: null,
        notes: '',
        metadata: {},
        rank: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      expect(isCard(card)).toBe(true)
    })
  })
})
