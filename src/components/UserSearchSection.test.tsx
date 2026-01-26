/**
 * UserSearchSection Tests
 *
 * Tests for the username search component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserSearchSection } from './UserSearchSection'
import type { UserProfile } from '../lib/socialTypes'

// Mock firestoreUsers
vi.mock('../lib/firestoreUsers', () => ({
  searchUsers: vi.fn(),
}))

describe('UserSearchSection', () => {
  const mockOnSendRequest = vi.fn().mockResolvedValue({ success: true })
  const defaultProps = {
    currentUserId: 'current-user-123',
    onSendRequest: mockOnSendRequest,
    existingFriendIds: [] as string[],
    pendingRequestIds: [] as string[],
  }

  const mockSearchResults: UserProfile[] = [
    {
      uid: 'user-1',
      username: 'testuser1',
      displayName: 'Test User 1',
      avatarUrl: 'https://example.com/avatar1.jpg',
      isSearchable: true,
      blockedUsers: [],
      createdAt: { toMillis: () => Date.now() } as never,
      lastActive: { toMillis: () => Date.now() } as never,
    },
    {
      uid: 'user-2',
      username: 'testuser2',
      displayName: 'Test User 2',
      avatarUrl: '',
      isSearchable: true,
      blockedUsers: [],
      createdAt: { toMillis: () => Date.now() } as never,
      lastActive: { toMillis: () => Date.now() } as never,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render search input', () => {
      render(<UserSearchSection {...defaultProps} />)

      expect(screen.getByPlaceholderText(/search by username/i)).toBeInTheDocument()
    })

    it('should show search results when query matches', async () => {
      const { searchUsers } = await import('../lib/firestoreUsers')
      vi.mocked(searchUsers).mockResolvedValue(mockSearchResults)

      const user = userEvent.setup()
      render(<UserSearchSection {...defaultProps} />)

      const input = screen.getByPlaceholderText(/search by username/i)
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument()
        expect(screen.getByText('Test User 2')).toBeInTheDocument()
      })
    })

    it('should show no results message when search returns empty', async () => {
      const { searchUsers } = await import('../lib/firestoreUsers')
      vi.mocked(searchUsers).mockResolvedValue([])

      const user = userEvent.setup()
      render(<UserSearchSection {...defaultProps} />)

      const input = screen.getByPlaceholderText(/search by username/i)
      await user.type(input, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument()
      })
    })
  })

  describe('interactions', () => {
    it('should call onSendRequest when add friend clicked', async () => {
      const { searchUsers } = await import('../lib/firestoreUsers')
      vi.mocked(searchUsers).mockResolvedValue(mockSearchResults)

      const user = userEvent.setup()
      render(<UserSearchSection {...defaultProps} />)

      const input = screen.getByPlaceholderText(/search by username/i)
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: /add/i })
      await user.click(addButtons[0])

      expect(mockOnSendRequest).toHaveBeenCalledWith('user-1')
    })

    it('should debounce search queries', async () => {
      const { searchUsers } = await import('../lib/firestoreUsers')
      vi.mocked(searchUsers).mockResolvedValue([])

      const user = userEvent.setup()
      render(<UserSearchSection {...defaultProps} />)

      const input = screen.getByPlaceholderText(/search by username/i)

      // Type quickly
      await user.type(input, 'abc')

      // Search should only be called once after debounce, not 3 times
      await waitFor(() => {
        expect(searchUsers).toHaveBeenCalled()
      })

      // Should have been called with full query
      expect(searchUsers).toHaveBeenLastCalledWith('abc', 'current-user-123')
    })
  })

  describe('existing relationships', () => {
    it('should show "Already Friends" for existing friends', async () => {
      const { searchUsers } = await import('../lib/firestoreUsers')
      vi.mocked(searchUsers).mockResolvedValue(mockSearchResults)

      const user = userEvent.setup()
      render(
        <UserSearchSection
          {...defaultProps}
          existingFriendIds={['user-1']}
        />
      )

      const input = screen.getByPlaceholderText(/search by username/i)
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText(/already friends/i)).toBeInTheDocument()
      })
    })

    it('should show "Pending" for pending requests', async () => {
      const { searchUsers } = await import('../lib/firestoreUsers')
      vi.mocked(searchUsers).mockResolvedValue(mockSearchResults)

      const user = userEvent.setup()
      render(
        <UserSearchSection
          {...defaultProps}
          pendingRequestIds={['user-1']}
        />
      )

      const input = screen.getByPlaceholderText(/search by username/i)
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument()
      })
    })
  })
})
