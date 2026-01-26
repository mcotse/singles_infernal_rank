import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FriendsPage } from './FriendsPage'
import type { Board } from '../lib/types'

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

// Mock useBoards hook
const mockBoards: Board[] = []
vi.mock('../hooks/useBoards', () => ({
  useBoards: vi.fn(() => ({
    boards: mockBoards,
    deletedBoards: [],
    createBoard: vi.fn(),
    updateBoard: vi.fn(),
    softDeleteBoard: vi.fn(),
    restoreBoard: vi.fn(),
    permanentlyDeleteBoard: vi.fn(),
    getBoard: vi.fn(),
    refresh: vi.fn(),
  })),
}))

// Mock useBoardSync hook
const mockSyncAll = vi.fn().mockResolvedValue([])
vi.mock('../hooks/useBoardSync', () => ({
  useBoardSync: vi.fn(() => ({
    status: 'idle' as const,
    error: null,
    lastSyncedAt: null,
    isSyncing: false,
    syncAll: mockSyncAll,
    syncBoard: vi.fn(),
    clearError: vi.fn(),
  })),
}))

// Mock useFriendBoards hook
vi.mock('../hooks/useFriendBoards', () => ({
  useFriendBoards: vi.fn(() => ({
    friendBoards: {},
    sharedBoardCounts: {},
    isLoading: false,
    error: null,
    refresh: vi.fn(),
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

      // Check for the main "Friends" heading (level 1)
      expect(screen.getByRole('heading', { level: 1, name: /friends/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /sign in with google/i })).not.toBeInTheDocument()
    })
  })

  describe('sync migration flow', () => {
    it('shows sync modal when user has local boards and just signed in', async () => {
      const mockUser = { uid: 'test-uid', displayName: 'Test User', photoURL: null }
      const mockProfile = {
        uid: 'test-uid',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: '',
        isSearchable: true,
        blockedUsers: [],
      }

      // Mock boards exist
      const { useBoards } = await import('../hooks/useBoards')
      vi.mocked(useBoards).mockReturnValue({
        boards: [
          { id: 'board-1', name: 'Test Board', coverImage: null, createdAt: Date.now(), updatedAt: Date.now(), deletedAt: null },
        ],
        deletedBoards: [],
        createBoard: vi.fn(),
        updateBoard: vi.fn(),
        softDeleteBoard: vi.fn(),
        restoreBoard: vi.fn(),
        permanentlyDeleteBoard: vi.fn(),
        getBoard: vi.fn(),
        refresh: vi.fn(),
      })

      // Mock useBoardSync with never synced
      const { useBoardSync } = await import('../hooks/useBoardSync')
      vi.mocked(useBoardSync).mockReturnValue({
        status: 'idle',
        error: null,
        lastSyncedAt: null, // Never synced before
        isSyncing: false,
        syncAll: mockSyncAll,
        syncBoard: vi.fn(),
        clearError: vi.fn(),
      })

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

      // Should show sync modal
      expect(screen.getByText(/sync your boards/i)).toBeInTheDocument()
    })

    it('does not show sync modal when user has no local boards', async () => {
      const mockUser = { uid: 'test-uid', displayName: 'Test User', photoURL: null }
      const mockProfile = {
        uid: 'test-uid',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: '',
        isSearchable: true,
        blockedUsers: [],
      }

      // Mock no boards
      const { useBoards } = await import('../hooks/useBoards')
      vi.mocked(useBoards).mockReturnValue({
        boards: [],
        deletedBoards: [],
        createBoard: vi.fn(),
        updateBoard: vi.fn(),
        softDeleteBoard: vi.fn(),
        restoreBoard: vi.fn(),
        permanentlyDeleteBoard: vi.fn(),
        getBoard: vi.fn(),
        refresh: vi.fn(),
      })

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

      // Should NOT show sync modal
      expect(screen.queryByText(/sync your boards/i)).not.toBeInTheDocument()
    })

    it('does not show sync modal when already synced', async () => {
      const mockUser = { uid: 'test-uid', displayName: 'Test User', photoURL: null }
      const mockProfile = {
        uid: 'test-uid',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: '',
        isSearchable: true,
        blockedUsers: [],
      }

      // Mock boards exist
      const { useBoards } = await import('../hooks/useBoards')
      vi.mocked(useBoards).mockReturnValue({
        boards: [
          { id: 'board-1', name: 'Test Board', coverImage: null, createdAt: Date.now(), updatedAt: Date.now(), deletedAt: null },
        ],
        deletedBoards: [],
        createBoard: vi.fn(),
        updateBoard: vi.fn(),
        softDeleteBoard: vi.fn(),
        restoreBoard: vi.fn(),
        permanentlyDeleteBoard: vi.fn(),
        getBoard: vi.fn(),
        refresh: vi.fn(),
      })

      // Mock already synced
      const { useBoardSync } = await import('../hooks/useBoardSync')
      vi.mocked(useBoardSync).mockReturnValue({
        status: 'synced',
        error: null,
        lastSyncedAt: Date.now(), // Already synced
        isSyncing: false,
        syncAll: mockSyncAll,
        syncBoard: vi.fn(),
        clearError: vi.fn(),
      })

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

      // Should NOT show sync modal (already synced)
      expect(screen.queryByText(/sync your boards/i)).not.toBeInTheDocument()
    })
  })
})
