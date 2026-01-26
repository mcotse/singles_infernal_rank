/**
 * ConfirmModal Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConfirmModal } from './ConfirmModal'

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn().mockResolvedValue(undefined),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when open', () => {
    render(<ConfirmModal {...defaultProps} />)

    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
  })

  it('should show default button labels', () => {
    render(<ConfirmModal {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should show custom button labels', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    )

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
  })

  it('should call onClose when cancel is clicked', () => {
    render(<ConfirmModal {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should call onConfirm when confirm is clicked', async () => {
    render(<ConfirmModal {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalled()
    })
  })

  it('should show loading state during confirm', async () => {
    const slowConfirm = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<ConfirmModal {...defaultProps} onConfirm={slowConfirm} />)

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    // Should show loading text
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\.\.\./i })).toBeInTheDocument()
    })
  })

  it('should close backdrop on click when not loading', () => {
    render(<ConfirmModal {...defaultProps} />)

    const backdrop = screen.getByTestId('backdrop')
    fireEvent.click(backdrop)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should apply danger variant styling', () => {
    render(<ConfirmModal {...defaultProps} variant="danger" />)

    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmButton).toHaveClass('bg-[#ff4d4d]')
  })

  it('should have accessible role dialog', () => {
    render(<ConfirmModal {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
