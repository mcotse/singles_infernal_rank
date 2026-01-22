import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BoardGrid } from './BoardGrid'
import type { Board } from '../lib/types'

describe('BoardGrid', () => {
  const createMockBoard = (id: string, name: string): Board => ({
    id,
    name,
    coverImage: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
  })

  const mockBoards: Board[] = [
    createMockBoard('1', 'Board One'),
    createMockBoard('2', 'Board Two'),
    createMockBoard('3', 'Board Three'),
  ]

  const defaultProps = {
    boards: mockBoards,
    cardCounts: { '1': 5, '2': 3, '3': 0 },
    onBoardClick: vi.fn(),
  }

  describe('rendering', () => {
    it('renders all boards', () => {
      render(<BoardGrid {...defaultProps} />)

      expect(screen.getByText('Board One')).toBeInTheDocument()
      expect(screen.getByText('Board Two')).toBeInTheDocument()
      expect(screen.getByText('Board Three')).toBeInTheDocument()
    })

    it('renders as a 2-column grid', () => {
      render(<BoardGrid {...defaultProps} />)

      const grid = screen.getByTestId('board-grid')
      expect(grid.className).toContain('grid-cols-2')
    })

    it('displays correct card counts', () => {
      render(<BoardGrid {...defaultProps} />)

      expect(screen.getByText('5 cards')).toBeInTheDocument()
      expect(screen.getByText('3 cards')).toBeInTheDocument()
      expect(screen.getByText('No cards')).toBeInTheDocument()
    })

    it('handles missing card counts gracefully', () => {
      render(<BoardGrid {...defaultProps} cardCounts={{}} />)

      // All boards should show 0 cards when count not provided
      expect(screen.getAllByText('No cards')).toHaveLength(3)
    })

    it('renders nothing when boards array is empty', () => {
      render(<BoardGrid {...defaultProps} boards={[]} />)

      const grid = screen.getByTestId('board-grid')
      expect(grid.children).toHaveLength(0)
    })
  })

  describe('preview URLs', () => {
    it('passes preview URLs to board cards', () => {
      const previewUrls = {
        '1': ['url1', 'url2'],
        '2': ['url3'],
      }

      render(<BoardGrid {...defaultProps} previewUrls={previewUrls} />)

      // Board 1 should have 2 preview photos
      const board1Button = screen.getByRole('button', { name: /board one/i })
      const board1Photos = board1Button.querySelectorAll('[data-testid="preview-photo"]')
      expect(board1Photos).toHaveLength(2)

      // Board 2 should have 1 preview photo
      const board2Button = screen.getByRole('button', { name: /board two/i })
      const board2Photos = board2Button.querySelectorAll('[data-testid="preview-photo"]')
      expect(board2Photos).toHaveLength(1)

      // Board 3 should have empty preview (no URLs provided)
      const board3Button = screen.getByRole('button', { name: /board three/i })
      expect(board3Button.querySelector('[data-testid="empty-preview"]')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onBoardClick with board id when board is clicked', () => {
      const onBoardClick = vi.fn()
      render(<BoardGrid {...defaultProps} onBoardClick={onBoardClick} />)

      fireEvent.click(screen.getByText('Board Two'))
      expect(onBoardClick).toHaveBeenCalledWith('2')
    })

    it('calls onBoardClick for each board independently', () => {
      const onBoardClick = vi.fn()
      render(<BoardGrid {...defaultProps} onBoardClick={onBoardClick} />)

      fireEvent.click(screen.getByText('Board One'))
      fireEvent.click(screen.getByText('Board Three'))

      expect(onBoardClick).toHaveBeenCalledTimes(2)
      expect(onBoardClick).toHaveBeenNthCalledWith(1, '1')
      expect(onBoardClick).toHaveBeenNthCalledWith(2, '3')
    })
  })

  describe('styling', () => {
    it('has appropriate gap between cards', () => {
      render(<BoardGrid {...defaultProps} />)

      const grid = screen.getByTestId('board-grid')
      expect(grid.className).toContain('gap-4')
    })

    it('has padding around the grid', () => {
      render(<BoardGrid {...defaultProps} />)

      const grid = screen.getByTestId('board-grid')
      expect(grid.className).toContain('p-4')
    })
  })
})
