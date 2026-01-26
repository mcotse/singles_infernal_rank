import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FriendsPage } from './FriendsPage'

// Mock useAuth hook
const mockSignIn = vi.fn()
const mockCreateProfile = vi.fn()

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    profile: null,
    isLoading: false,
    error: null,
    needsUsername: false,
    signIn: mockSignIn,
    signOut: vi.fn(),
    createProfile: mockCreateProfile,
    clearError: vi.fn(),
    isMockAuth: true,
  })),
}))

describe('FriendsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signed out state', () => {
    it('renders sign-in prompt when not authenticated', () => {
      render(<FriendsPage />)

      expect(screen.getByText(/sign in to connect/i)).toBeInTheDocument()
    })

    it('shows sign in button', () => {
      render(<FriendsPage />)

      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
    })

    it('calls signIn when button clicked', async () => {
      const user = userEvent.setup()
      render(<FriendsPage />)

      await user.click(screen.getByRole('button', { name: /sign in with google/i }))

      expect(mockSignIn).toHaveBeenCalled()
    })

    it('shows Google icon in button', () => {
      render(<FriendsPage />)

      // The button should have Google branding
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading state during sign in', async () => {
      const { useAuth } = await import('../hooks/useAuth')
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        profile: null,
        isLoading: true,
        error: null,
        needsUsername: false,
        signIn: mockSignIn,
        signOut: vi.fn(),
        createProfile: mockCreateProfile,
        clearError: vi.fn(),
        isMockAuth: true,
      })

      render(<FriendsPage />)

      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })
  })

  describe('error state', () => {
    it('shows error message when auth fails', async () => {
      const { useAuth } = await import('../hooks/useAuth')
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        profile: null,
        isLoading: false,
        error: 'Failed to sign in',
        needsUsername: false,
        signIn: mockSignIn,
        signOut: vi.fn(),
        createProfile: mockCreateProfile,
        clearError: vi.fn(),
        isMockAuth: true,
      })

      render(<FriendsPage />)

      expect(screen.getByText('Failed to sign in')).toBeInTheDocument()
    })
  })

  describe('needs username state', () => {
    it('shows username modal when needsUsername is true', async () => {
      const mockUser = { uid: 'test-uid', displayName: 'Test User', photoURL: null }
      const { useAuth } = await import('../hooks/useAuth')
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as never,
        profile: null,
        isLoading: false,
        error: null,
        needsUsername: true,
        signIn: mockSignIn,
        signOut: vi.fn(),
        createProfile: mockCreateProfile,
        clearError: vi.fn(),
        isMockAuth: true,
      })

      render(<FriendsPage />)

      expect(screen.getByText(/choose your username/i)).toBeInTheDocument()
    })
  })

  describe('signed in state', () => {
    it('shows friends content when signed in with profile', async () => {
      const mockUser = { uid: 'test-uid', displayName: 'Test User', photoURL: null }
      const mockProfile = {
        uid: 'test-uid',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: '',
        isSearchable: true,
        blockedUsers: [],
      }
      const { useAuth } = await import('../hooks/useAuth')
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as never,
        profile: mockProfile as never,
        isLoading: false,
        error: null,
        needsUsername: false,
        signIn: mockSignIn,
        signOut: vi.fn(),
        createProfile: mockCreateProfile,
        clearError: vi.fn(),
        isMockAuth: true,
      })

      render(<FriendsPage />)

      expect(screen.getByText(/friends/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /sign in with google/i })).not.toBeInTheDocument()
    })
  })
})
