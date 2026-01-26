import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EditBoardSheet } from './EditBoardSheet'
import type { Board } from '../lib/types'

describe('EditBoardSheet', () => {
  const mockBoard: Board = {
    id: 'board-1',
    name: 'Test Board',
    coverImage: null,
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: null,
  }

  const defaultProps = {
    isOpen: true,
    board: mockBoard,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onDelete: vi.fn(),
    onChangePhoto: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders board name in input', () => {
      render(<EditBoardSheet {...defaultProps} />)
      const nameInput = screen.getByLabelText(/board name/i)
      expect(nameInput).toHaveValue('Test Board')
    })

    it('renders cover photo area', () => {
      render(<EditBoardSheet {...defaultProps} />)
      expect(screen.getByTestId('cover-photo-area')).toBeInTheDocument()
    })

    it('renders save button', () => {
      render(<EditBoardSheet {...defaultProps} />)
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('renders delete button', () => {
      render(<EditBoardSheet {...defaultProps} />)
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<EditBoardSheet {...defaultProps} isOpen={false} />)
      expect(screen.queryByLabelText(/board name/i)).not.toBeInTheDocument()
    })

    it('renders with title "Edit Board"', () => {
      render(<EditBoardSheet {...defaultProps} />)
      expect(screen.getByRole('heading', { name: /edit board/i })).toBeInTheDocument()
    })
  })

  describe('editing', () => {
    it('allows editing board name', () => {
      render(<EditBoardSheet {...defaultProps} />)
      const nameInput = screen.getByLabelText(/board name/i)

      fireEvent.change(nameInput, { target: { value: 'New Board Name' } })
      expect(nameInput).toHaveValue('New Board Name')
    })
  })

  describe('saving', () => {
    it('calls onSave with updated name', async () => {
      const onSave = vi.fn()
      render(<EditBoardSheet {...defaultProps} onSave={onSave} />)

      const nameInput = screen.getByLabelText(/board name/i)
      fireEvent.change(nameInput, { target: { value: 'Updated Board' } })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Board',
          })
        )
      })
    })

    it('closes modal after save', async () => {
      const onClose = vi.fn()
      render(<EditBoardSheet {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('does not save empty name', async () => {
      const onSave = vi.fn()
      render(<EditBoardSheet {...defaultProps} onSave={onSave} />)

      const nameInput = screen.getByLabelText(/board name/i)
      fireEvent.change(nameInput, { target: { value: '   ' } })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Board', // Falls back to original name
          })
        )
      })
    })
  })

  describe('deleting', () => {
    it('shows confirmation when delete clicked', () => {
      render(<EditBoardSheet {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /delete/i }))

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })

    it('calls onDelete when confirmed', () => {
      const onDelete = vi.fn()
      render(<EditBoardSheet {...defaultProps} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
      fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }))

      expect(onDelete).toHaveBeenCalledWith('board-1')
    })

    it('cancels delete when cancelled', () => {
      const onDelete = vi.fn()
      render(<EditBoardSheet {...defaultProps} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onDelete).not.toHaveBeenCalled()
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    })
  })

  describe('cover photo', () => {
    it('renders photo placeholder when no cover image', () => {
      render(<EditBoardSheet {...defaultProps} />)
      expect(screen.getByTestId('cover-photo-placeholder')).toBeInTheDocument()
    })

    it('renders cover image when coverImageUrl provided', () => {
      render(<EditBoardSheet {...defaultProps} coverImageUrl="test.jpg" />)
      const img = screen.getByRole('img', { name: /cover/i })
      expect(img).toHaveAttribute('src', 'test.jpg')
    })

    it('calls onChangePhoto when photo area clicked', () => {
      const onChangePhoto = vi.fn()
      render(<EditBoardSheet {...defaultProps} onChangePhoto={onChangePhoto} />)

      fireEvent.click(screen.getByTestId('cover-photo-placeholder'))

      expect(onChangePhoto).toHaveBeenCalled()
    })
  })

  describe('form reset', () => {
    it('resets form when board changes', () => {
      const { rerender } = render(<EditBoardSheet {...defaultProps} />)

      const nameInput = screen.getByLabelText(/board name/i)
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } })

      const newBoard: Board = {
        ...mockBoard,
        id: 'board-2',
        name: 'Different Board',
      }

      rerender(<EditBoardSheet {...defaultProps} board={newBoard} />)

      expect(screen.getByLabelText(/board name/i)).toHaveValue('Different Board')
    })
  })
})
