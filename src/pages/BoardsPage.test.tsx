import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BoardsPage } from './BoardsPage'
import * as useBoardsModule from '../hooks/useBoards'
import * as useCardsModule from '../hooks/useCards'

// Mock the hooks
vi.mock('../hooks/useBoards')
vi.mock('../hooks/useCards')

const mockUseBoards = vi.mocked(useBoardsModule.useBoards)
const mockUseCards = vi.mocked(useCardsModule.useCards)

describe('BoardsPage', () => {
  const mockBoard1 = {
    id: 'board-1',
    name: 'Test Board 1',
    coverImage: null,
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: null,
  }

  const mockBoard2 = {
    id: 'board-2',
    name: 'Test Board 2',
    coverImage: null,
    createdAt: 2000,
    updatedAt: 2000,
    deletedAt: null,
  }

  const defaultBoardsHook = {
    boards: [],
    deletedBoards: [],
    createBoard: vi.fn(),
    updateBoard: vi.fn(),
    softDeleteBoard: vi.fn(),
    restoreBoard: vi.fn(),
    permanentlyDeleteBoard: vi.fn(),
    getBoard: vi.fn(),
    refresh: vi.fn(),
  }

  const defaultCardsHook = {
    cards: [],
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    reorderCards: vi.fn(),
    getCard: vi.fn(),
    refresh: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseBoards.mockReturnValue(defaultBoardsHook)
    mockUseCards.mockReturnValue(defaultCardsHook)
  })

  describe('header', () => {
    it('renders the page title', () => {
      render(<BoardsPage />)
      expect(screen.getByText('My Rankings')).toBeInTheDocument()
    })

    it('renders the create board button in header', () => {
      render(<BoardsPage />)
      expect(screen.getByRole('button', { name: /create new board/i })).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty state when no boards exist', () => {
      mockUseBoards.mockReturnValue({
        ...defaultBoardsHook,
        boards: [],
      })

      render(<BoardsPage />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText(/no rankings yet/i)).toBeInTheDocument()
    })
  })

  describe('with boards', () => {
    beforeEach(() => {
      mockUseBoards.mockReturnValue({
        ...defaultBoardsHook,
        boards: [mockBoard1, mockBoard2],
      })
    })

    it('renders board grid when boards exist', () => {
      render(<BoardsPage />)

      expect(screen.getByText('Test Board 1')).toBeInTheDocument()
      expect(screen.getByText('Test Board 2')).toBeInTheDocument()
    })

    it('does not show empty state when boards exist', () => {
      render(<BoardsPage />)

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    })
  })

  describe('create board', () => {
    it('opens create modal when header create button clicked', () => {
      render(<BoardsPage />)

      fireEvent.click(screen.getByRole('button', { name: /create new board/i }))

      expect(screen.getByTestId('create-board-modal')).toBeInTheDocument()
    })

    it('opens create modal when empty state button clicked', () => {
      mockUseBoards.mockReturnValue({
        ...defaultBoardsHook,
        boards: [],
      })

      render(<BoardsPage />)

      fireEvent.click(screen.getByRole('button', { name: /create your first/i }))

      expect(screen.getByTestId('create-board-modal')).toBeInTheDocument()
    })
  })

  describe('board navigation', () => {
    it('calls onBoardSelect when a board is clicked', () => {
      const onBoardSelect = vi.fn()
      mockUseBoards.mockReturnValue({
        ...defaultBoardsHook,
        boards: [mockBoard1],
      })

      render(<BoardsPage onBoardSelect={onBoardSelect} />)

      fireEvent.click(screen.getByText('Test Board 1'))

      expect(onBoardSelect).toHaveBeenCalledWith('board-1')
    })
  })
})
