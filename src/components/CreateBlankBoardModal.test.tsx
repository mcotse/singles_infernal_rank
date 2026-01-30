import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateBlankBoardModal } from './CreateBlankBoardModal'

describe('CreateBlankBoardModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCreate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the modal when open', () => {
      render(<CreateBlankBoardModal {...defaultProps} />)
      expect(screen.getByTestId('create-board-modal')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<CreateBlankBoardModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByTestId('create-board-modal')).not.toBeInTheDocument()
    })

    it('renders the modal title', () => {
      render(<CreateBlankBoardModal {...defaultProps} />)
      expect(screen.getByText('New Ranking Board')).toBeInTheDocument()
    })

    it('renders an input field with placeholder', () => {
      render(<CreateBlankBoardModal {...defaultProps} />)
      expect(screen.getByPlaceholderText('Enter board name...')).toBeInTheDocument()
    })

    it('renders cancel and create buttons', () => {
      render(<CreateBlankBoardModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
    })

    it('has create button disabled initially', () => {
      render(<CreateBlankBoardModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /create/i })).toBeDisabled()
    })
  })

  describe('input handling', () => {
    it('enables create button when name is entered', () => {
      render(<CreateBlankBoardModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('Enter board name...')
      fireEvent.change(input, { target: { value: 'My Board' } })

      expect(screen.getByRole('button', { name: /create/i })).not.toBeDisabled()
    })

    it('keeps create button disabled for whitespace-only input', () => {
      render(<CreateBlankBoardModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('Enter board name...')
      fireEvent.change(input, { target: { value: '   ' } })

      expect(screen.getByRole('button', { name: /create/i })).toBeDisabled()
    })
  })

  describe('form submission', () => {
    it('calls onCreate with trimmed name and closes on submit', () => {
      const onCreate = vi.fn()
      const onClose = vi.fn()

      render(<CreateBlankBoardModal {...defaultProps} onCreate={onCreate} onClose={onClose} />)

      const input = screen.getByPlaceholderText('Enter board name...')
      fireEvent.change(input, { target: { value: '  My Board  ' } })

      const form = input.closest('form')!
      fireEvent.submit(form)

      expect(onCreate).toHaveBeenCalledWith('My Board')
      expect(onClose).toHaveBeenCalled()
    })

    it('does not call onCreate for empty input', () => {
      const onCreate = vi.fn()

      render(<CreateBlankBoardModal {...defaultProps} onCreate={onCreate} />)

      const input = screen.getByPlaceholderText('Enter board name...')
      const form = input.closest('form')!
      fireEvent.submit(form)

      expect(onCreate).not.toHaveBeenCalled()
    })

    it('clears input after successful submission', () => {
      render(<CreateBlankBoardModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('Enter board name...')
      fireEvent.change(input, { target: { value: 'My Board' } })

      const form = input.closest('form')!
      fireEvent.submit(form)

      expect(input).toHaveValue('')
    })
  })

  describe('cancel handling', () => {
    it('calls onClose and clears input when cancel is clicked', () => {
      const onClose = vi.fn()

      render(<CreateBlankBoardModal {...defaultProps} onClose={onClose} />)

      const input = screen.getByPlaceholderText('Enter board name...')
      fireEvent.change(input, { target: { value: 'My Board' } })

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onClose).toHaveBeenCalled()
    })

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn()

      render(<CreateBlankBoardModal {...defaultProps} onClose={onClose} />)

      // Click on the backdrop (the outer div)
      const modal = screen.getByTestId('create-board-modal')
      const backdrop = modal.querySelector('.absolute.inset-0')
      fireEvent.click(backdrop!)

      expect(onClose).toHaveBeenCalled()
    })
  })
})
