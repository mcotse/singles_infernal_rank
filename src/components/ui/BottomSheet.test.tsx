import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BottomSheet } from './BottomSheet'

describe('BottomSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Sheet Content</div>,
  }

  describe('rendering', () => {
    it('renders children when open', () => {
      render(<BottomSheet {...defaultProps} />)
      expect(screen.getByText('Sheet Content')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<BottomSheet {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Sheet Content')).not.toBeInTheDocument()
    })

    it('renders title when provided', () => {
      render(<BottomSheet {...defaultProps} title="Modal Title" />)
      expect(screen.getByText('Modal Title')).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(<BottomSheet {...defaultProps} />)
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })
  })

  describe('backdrop', () => {
    it('renders backdrop when open', () => {
      render(<BottomSheet {...defaultProps} />)
      expect(screen.getByTestId('backdrop')).toBeInTheDocument()
    })

    it('calls onClose when backdrop clicked', () => {
      const onClose = vi.fn()
      render(<BottomSheet {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByTestId('backdrop'))
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('close button', () => {
    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn()
      render(<BottomSheet {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: /close/i }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('keyboard', () => {
    it('calls onClose when Escape pressed', () => {
      const onClose = vi.fn()
      render(<BottomSheet {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('styling', () => {
    it('has rounded top corners', () => {
      render(<BottomSheet {...defaultProps} />)
      const sheet = screen.getByTestId('bottom-sheet')
      expect(sheet.className).toContain('rounded-t')
    })

    it('has custom border radius style', () => {
      render(<BottomSheet {...defaultProps} />)
      const sheet = screen.getByTestId('bottom-sheet')
      const style = sheet.getAttribute('style') || ''
      // Should have top border radius (either border-radius or border-top-*-radius)
      expect(style).toMatch(/border.*radius/i)
    })
  })

  describe('accessibility', () => {
    it('has dialog role', () => {
      render(<BottomSheet {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal attribute', () => {
      render(<BottomSheet {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby when title provided', () => {
      render(<BottomSheet {...defaultProps} title="Test Title" />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })
  })
})
