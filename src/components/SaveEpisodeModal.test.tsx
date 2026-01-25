import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SaveEpisodeModal } from './SaveEpisodeModal'

describe('SaveEpisodeModal', () => {
  const defaultProps = {
    isOpen: true,
    suggestedEpisodeNumber: 5,
    boardName: 'Test Board',
    onClose: vi.fn(),
    onSave: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders when open', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      expect(screen.getByText('Save Episode Rankings')).toBeInTheDocument()
    })

    it('shows board name', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      expect(screen.getByText('Test Board')).toBeInTheDocument()
    })

    it('shows suggested episode number in input', () => {
      render(<SaveEpisodeModal {...defaultProps} suggestedEpisodeNumber={7} />)

      const input = screen.getByDisplayValue('7')
      expect(input).toBeInTheDocument()
    })

    it('renders label input with placeholder', () => {
      render(<SaveEpisodeModal {...defaultProps} suggestedEpisodeNumber={3} />)

      expect(screen.getByPlaceholderText('Episode 3')).toBeInTheDocument()
    })

    it('renders notes textarea', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      expect(
        screen.getByPlaceholderText("e.g., 'After the pool date disaster'")
      ).toBeInTheDocument()
    })

    it('renders Cancel button', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('renders Save Snapshot button', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /save snapshot/i })).toBeInTheDocument()
    })
  })

  describe('episode number input', () => {
    it('updates episode number when changed', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      const input = screen.getByDisplayValue('5')
      fireEvent.change(input, { target: { value: '10' } })

      expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    })

    it('ignores non-numeric input', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      const input = screen.getByDisplayValue('5')
      fireEvent.change(input, { target: { value: 'abc' } })

      expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    })

    it('ignores zero or negative values', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      const input = screen.getByDisplayValue('5')
      fireEvent.change(input, { target: { value: '0' } })

      expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    })
  })

  describe('label and notes inputs', () => {
    it('allows entering custom label', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      const labelInput = screen.getByPlaceholderText('Episode 5')
      fireEvent.change(labelInput, { target: { value: 'The Big Reveal' } })

      expect(screen.getByDisplayValue('The Big Reveal')).toBeInTheDocument()
    })

    it('allows entering notes', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      const notesInput = screen.getByPlaceholderText(
        "e.g., 'After the pool date disaster'"
      )
      fireEvent.change(notesInput, { target: { value: 'Some notes here' } })

      expect(screen.getByDisplayValue('Some notes here')).toBeInTheDocument()
    })
  })

  describe('save action', () => {
    it('calls onSave with episode number and default label', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /save snapshot/i }))

      expect(defaultProps.onSave).toHaveBeenCalledWith(5, 'Episode 5', '')
    })

    it('calls onSave with custom label', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      const labelInput = screen.getByPlaceholderText('Episode 5')
      fireEvent.change(labelInput, { target: { value: 'Custom Label' } })
      fireEvent.click(screen.getByRole('button', { name: /save snapshot/i }))

      expect(defaultProps.onSave).toHaveBeenCalledWith(5, 'Custom Label', '')
    })

    it('calls onSave with notes', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      const notesInput = screen.getByPlaceholderText(
        "e.g., 'After the pool date disaster'"
      )
      fireEvent.change(notesInput, { target: { value: 'Test notes' } })
      fireEvent.click(screen.getByRole('button', { name: /save snapshot/i }))

      expect(defaultProps.onSave).toHaveBeenCalledWith(5, 'Episode 5', 'Test notes')
    })

    it('trims whitespace from label and notes', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      const labelInput = screen.getByPlaceholderText('Episode 5')
      const notesInput = screen.getByPlaceholderText(
        "e.g., 'After the pool date disaster'"
      )
      fireEvent.change(labelInput, { target: { value: '  My Label  ' } })
      fireEvent.change(notesInput, { target: { value: '  My Notes  ' } })
      fireEvent.click(screen.getByRole('button', { name: /save snapshot/i }))

      expect(defaultProps.onSave).toHaveBeenCalledWith(5, 'My Label', 'My Notes')
    })

    it('calls onClose after save', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /save snapshot/i }))

      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('cancel action', () => {
    it('calls onClose when cancel clicked', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('does not call onSave when cancel clicked', () => {
      render(<SaveEpisodeModal {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(defaultProps.onSave).not.toHaveBeenCalled()
    })
  })

  describe('form reset on open', () => {
    it('resets episode number when modal opens', async () => {
      const { rerender } = render(
        <SaveEpisodeModal {...defaultProps} isOpen={false} />
      )

      // Modal opens with episode 5
      rerender(
        <SaveEpisodeModal {...defaultProps} isOpen={true} suggestedEpisodeNumber={5} />
      )

      // Change to 10
      const input = screen.getByDisplayValue('5')
      fireEvent.change(input, { target: { value: '10' } })
      expect(screen.getByDisplayValue('10')).toBeInTheDocument()

      // Close and reopen with episode 7
      rerender(
        <SaveEpisodeModal {...defaultProps} isOpen={false} suggestedEpisodeNumber={7} />
      )
      rerender(
        <SaveEpisodeModal {...defaultProps} isOpen={true} suggestedEpisodeNumber={7} />
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('7')).toBeInTheDocument()
      })
    })

    it('clears label when modal reopens', async () => {
      const { rerender } = render(<SaveEpisodeModal {...defaultProps} isOpen={true} />)

      // Enter a label
      const labelInput = screen.getByPlaceholderText('Episode 5')
      fireEvent.change(labelInput, { target: { value: 'My Label' } })

      // Close and reopen
      rerender(<SaveEpisodeModal {...defaultProps} isOpen={false} />)
      rerender(<SaveEpisodeModal {...defaultProps} isOpen={true} />)

      await waitFor(() => {
        expect(screen.queryByDisplayValue('My Label')).not.toBeInTheDocument()
      })
    })
  })
})
