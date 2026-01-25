import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CardDetailModal } from './CardDetailModal'
import type { Card } from '../lib/types'

describe('CardDetailModal', () => {
  const mockCard: Card = {
    id: 'card-1',
    boardId: 'board-1',
    name: 'Test Card',
    nickname: '',
    imageKey: null,
    thumbnailKey: null,
    imageCrop: null,
    notes: 'Some notes here',
    metadata: {},
    rank: 1,
    createdAt: 1000,
    updatedAt: 1000,
  }

  const defaultProps = {
    isOpen: true,
    card: mockCard,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onDelete: vi.fn(),
  }

  describe('rendering', () => {
    it('renders card name in input', () => {
      render(<CardDetailModal {...defaultProps} />)
      const nameInput = screen.getByLabelText(/^name$/i)
      expect(nameInput).toHaveValue('Test Card')
    })

    it('renders card notes in textarea', () => {
      render(<CardDetailModal {...defaultProps} />)
      const notesInput = screen.getByLabelText(/notes/i)
      expect(notesInput).toHaveValue('Some notes here')
    })

    it('renders photo area', () => {
      render(<CardDetailModal {...defaultProps} />)
      expect(screen.getByTestId('photo-area')).toBeInTheDocument()
    })

    it('renders save button', () => {
      render(<CardDetailModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('renders delete button', () => {
      render(<CardDetailModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<CardDetailModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByLabelText(/^name$/i)).not.toBeInTheDocument()
    })
  })

  describe('editing', () => {
    it('allows editing name', () => {
      render(<CardDetailModal {...defaultProps} />)
      const nameInput = screen.getByLabelText(/^name$/i)

      fireEvent.change(nameInput, { target: { value: 'New Name' } })
      expect(nameInput).toHaveValue('New Name')
    })

    it('allows editing notes', () => {
      render(<CardDetailModal {...defaultProps} />)
      const notesInput = screen.getByLabelText(/notes/i)

      fireEvent.change(notesInput, { target: { value: 'New notes' } })
      expect(notesInput).toHaveValue('New notes')
    })
  })

  describe('saving', () => {
    it('calls onSave with updated card data', async () => {
      const onSave = vi.fn()
      render(<CardDetailModal {...defaultProps} onSave={onSave} />)

      const nameInput = screen.getByLabelText(/^name$/i)
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Name',
          })
        )
      })
    })

    it('closes modal after save', async () => {
      const onClose = vi.fn()
      render(<CardDetailModal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })
  })

  describe('deleting', () => {
    it('shows confirmation when delete clicked', () => {
      render(<CardDetailModal {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /delete/i }))

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })

    it('calls onDelete when confirmed', () => {
      const onDelete = vi.fn()
      render(<CardDetailModal {...defaultProps} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
      fireEvent.click(screen.getByRole('button', { name: /confirm|yes/i }))

      expect(onDelete).toHaveBeenCalledWith('card-1')
    })

    it('cancels delete when cancelled', () => {
      const onDelete = vi.fn()
      render(<CardDetailModal {...defaultProps} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole('button', { name: /delete/i }))
      fireEvent.click(screen.getByRole('button', { name: /cancel|no/i }))

      expect(onDelete).not.toHaveBeenCalled()
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    })
  })

  describe('photo', () => {
    it('renders photo placeholder when no image', () => {
      render(<CardDetailModal {...defaultProps} />)
      expect(screen.getByTestId('photo-placeholder')).toBeInTheDocument()
    })

    it('renders photo when imageUrl provided', () => {
      render(<CardDetailModal {...defaultProps} imageUrl="test.jpg" />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', 'test.jpg')
    })

    it('has button to add/change photo', () => {
      render(<CardDetailModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /photo/i })).toBeInTheDocument()
    })
  })

  describe('add mode (isNewCard)', () => {
    it('shows "Add Card" title when isNewCard is true', () => {
      render(<CardDetailModal {...defaultProps} isNewCard />)
      expect(screen.getByRole('heading', { name: 'Add Card' })).toBeInTheDocument()
    })

    it('shows "Edit Card" title when isNewCard is false', () => {
      render(<CardDetailModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'Edit Card' })).toBeInTheDocument()
    })

    it('hides delete button when isNewCard is true', () => {
      render(<CardDetailModal {...defaultProps} isNewCard />)
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    })

    it('shows "Add Card" button text when isNewCard is true', () => {
      render(<CardDetailModal {...defaultProps} isNewCard />)
      expect(screen.getByRole('button', { name: 'Add Card' })).toBeInTheDocument()
    })

    it('shows "Save Changes" button text when isNewCard is false', () => {
      render(<CardDetailModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })
  })
})
