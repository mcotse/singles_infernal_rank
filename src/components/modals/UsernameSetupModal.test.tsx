import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsernameSetupModal } from './UsernameSetupModal'

// Mock the username validation module
vi.mock('../../lib/usernameValidation', () => ({
  validateUsername: vi.fn((username: string) => {
    if (!username.trim()) return { isValid: false, error: 'Username is required' }
    if (username.length < 3) return { isValid: false, error: 'Username must be at least 3 characters' }
    if (username.length > 20) return { isValid: false, error: 'Username must be at most 20 characters' }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' }
    return { isValid: true }
  }),
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
}))

describe('UsernameSetupModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders when open', () => {
      render(<UsernameSetupModal {...defaultProps} />)
      expect(screen.getByText(/choose your username/i)).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<UsernameSetupModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText(/choose your username/i)).not.toBeInTheDocument()
    })

    it('shows input field for username', () => {
      render(<UsernameSetupModal {...defaultProps} />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('shows submit button', () => {
      render(<UsernameSetupModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('shows error for empty username on submit', async () => {
      const user = userEvent.setup()
      render(<UsernameSetupModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByText('Username is required')).toBeInTheDocument()
      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })

    it('shows error for too short username', async () => {
      const user = userEvent.setup()
      render(<UsernameSetupModal {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'ab')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument()
    })

    it('shows error for invalid characters', async () => {
      const user = userEvent.setup()
      render(<UsernameSetupModal {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'john@doe')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByText('Username can only contain letters, numbers, and underscores')).toBeInTheDocument()
    })

    it('clears validation error when typing', async () => {
      const user = userEvent.setup()
      render(<UsernameSetupModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByText('Username is required')).toBeInTheDocument()

      await user.type(screen.getByRole('textbox'), 'j')
      expect(screen.queryByText('Username is required')).not.toBeInTheDocument()
    })
  })

  describe('submission', () => {
    it('calls onSubmit with valid username', async () => {
      const user = userEvent.setup()
      render(<UsernameSetupModal {...defaultProps} />)

      await user.type(screen.getByRole('textbox'), 'johndoe')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(defaultProps.onSubmit).toHaveBeenCalledWith('johndoe')
    })

    it('disables button when loading', () => {
      render(<UsernameSetupModal {...defaultProps} isLoading={true} />)

      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    })

    it('shows external error', () => {
      render(<UsernameSetupModal {...defaultProps} error="Username is already taken" />)

      expect(screen.getByText('Username is already taken')).toBeInTheDocument()
    })
  })

  describe('close behavior', () => {
    it('calls onClose when backdrop clicked (allowDismiss=true)', () => {
      render(<UsernameSetupModal {...defaultProps} />)

      fireEvent.click(screen.getByTestId('backdrop'))

      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('calls onClose on escape key (allowDismiss=true)', () => {
      render(<UsernameSetupModal {...defaultProps} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('does not call onClose when backdrop clicked if allowDismiss=false', () => {
      render(<UsernameSetupModal {...defaultProps} allowDismiss={false} />)

      fireEvent.click(screen.getByTestId('backdrop'))

      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('does not call onClose on escape key if allowDismiss=false', () => {
      render(<UsernameSetupModal {...defaultProps} allowDismiss={false} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })
})
