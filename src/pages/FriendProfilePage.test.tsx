/**
 * FriendProfilePage Tests
 *
 * Tests for the friend profile view page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FriendProfilePage } from './FriendProfilePage'
import type { CloudBoard } from '../lib/firestoreBoards'

// Mock firestoreUsers
vi.mock('../lib/firestoreUsers', () => ({
  getUserById: vi.fn(),
}))

// Mock firestoreBoards
vi.mock('../lib/firestoreBoards', () => ({
  getCloudBoardsByOwner: vi.fn(),
  filterVisibleBoards: vi.fn(),
}))

describe('FriendProfilePage', () => {
  const mockOnBack = vi.fn()
  const mockOnViewBoard = vi.fn()

  const mockFriendProfile = {
    uid: 'friend-123',
    displayName: 'Test Friend',
    username: 'testfriend',
    avatarUrl: 'https://example.com/avatar.jpg',
    isSearchable: true,
    blockedUsers: [],
    createdAt: { toMillis: () => Date.now() },
    lastActive: { toMillis: () => Date.now() },
  }

  const mockBoards: CloudBoard[] = [
    {
      id: 'board-1',
      name: 'Board One',
      coverImage: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      ownerId: 'friend-123',
      sharing: { visibility: 'friends', publicLinkEnabled: false },
      syncedAt: Date.now(),
    },
    {
      id: 'board-2',
      name: 'Board Two',
      coverImage: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      ownerId: 'friend-123',
      sharing: { visibility: 'public', publicLinkEnabled: true, publicLinkId: 'abc123' },
      syncedAt: Date.now(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should show loading state initially', async () => {
      const { getUserById } = await import('../lib/firestoreUsers')
      vi.mocked(getUserById).mockImplementation(() => new Promise(() => {})) // Never resolves

      render(
        <FriendProfilePage
          friendId="friend-123"
          currentUserId="user-123"
          friendIds={['friend-123']}
          onBack={mockOnBack}
          onViewBoard={mockOnViewBoard}
        />
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should show friend profile after loading', async () => {
      const { getUserById } = await import('../lib/firestoreUsers')
      const { getCloudBoardsByOwner, filterVisibleBoards } = await import('../lib/firestoreBoards')

      vi.mocked(getUserById).mockResolvedValue(mockFriendProfile as never)
      vi.mocked(getCloudBoardsByOwner).mockResolvedValue(mockBoards)
      vi.mocked(filterVisibleBoards).mockReturnValue(mockBoards)

      render(
        <FriendProfilePage
          friendId="friend-123"
          currentUserId="user-123"
          friendIds={['friend-123']}
          onBack={mockOnBack}
          onViewBoard={mockOnViewBoard}
        />
      )

      // Wait for profile to load
      expect(await screen.findByText('Test Friend')).toBeInTheDocument()
      expect(await screen.findByText('@testfriend')).toBeInTheDocument()
    })

    it('should show friend boards', async () => {
      const { getUserById } = await import('../lib/firestoreUsers')
      const { getCloudBoardsByOwner, filterVisibleBoards } = await import('../lib/firestoreBoards')

      vi.mocked(getUserById).mockResolvedValue(mockFriendProfile as never)
      vi.mocked(getCloudBoardsByOwner).mockResolvedValue(mockBoards)
      vi.mocked(filterVisibleBoards).mockReturnValue(mockBoards)

      render(
        <FriendProfilePage
          friendId="friend-123"
          currentUserId="user-123"
          friendIds={['friend-123']}
          onBack={mockOnBack}
          onViewBoard={mockOnViewBoard}
        />
      )

      // Wait for boards to load
      expect(await screen.findByText('Board One')).toBeInTheDocument()
      expect(await screen.findByText('Board Two')).toBeInTheDocument()
    })

    it('should show empty state when friend has no shared boards', async () => {
      const { getUserById } = await import('../lib/firestoreUsers')
      const { getCloudBoardsByOwner, filterVisibleBoards } = await import('../lib/firestoreBoards')

      vi.mocked(getUserById).mockResolvedValue(mockFriendProfile as never)
      vi.mocked(getCloudBoardsByOwner).mockResolvedValue([])
      vi.mocked(filterVisibleBoards).mockReturnValue([])

      render(
        <FriendProfilePage
          friendId="friend-123"
          currentUserId="user-123"
          friendIds={['friend-123']}
          onBack={mockOnBack}
          onViewBoard={mockOnViewBoard}
        />
      )

      expect(await screen.findByText(/no shared boards/i)).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onBack when back button clicked', async () => {
      const user = userEvent.setup()
      const { getUserById } = await import('../lib/firestoreUsers')
      const { getCloudBoardsByOwner, filterVisibleBoards } = await import('../lib/firestoreBoards')

      vi.mocked(getUserById).mockResolvedValue(mockFriendProfile as never)
      vi.mocked(getCloudBoardsByOwner).mockResolvedValue(mockBoards)
      vi.mocked(filterVisibleBoards).mockReturnValue(mockBoards)

      render(
        <FriendProfilePage
          friendId="friend-123"
          currentUserId="user-123"
          friendIds={['friend-123']}
          onBack={mockOnBack}
          onViewBoard={mockOnViewBoard}
        />
      )

      // Wait for profile to load
      await screen.findByText('Test Friend')

      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      expect(mockOnBack).toHaveBeenCalled()
    })

    it('should call onViewBoard when board card clicked', async () => {
      const user = userEvent.setup()
      const { getUserById } = await import('../lib/firestoreUsers')
      const { getCloudBoardsByOwner, filterVisibleBoards } = await import('../lib/firestoreBoards')

      vi.mocked(getUserById).mockResolvedValue(mockFriendProfile as never)
      vi.mocked(getCloudBoardsByOwner).mockResolvedValue(mockBoards)
      vi.mocked(filterVisibleBoards).mockReturnValue(mockBoards)

      render(
        <FriendProfilePage
          friendId="friend-123"
          currentUserId="user-123"
          friendIds={['friend-123']}
          onBack={mockOnBack}
          onViewBoard={mockOnViewBoard}
        />
      )

      // Wait for boards to load
      const boardCard = await screen.findByText('Board One')
      await user.click(boardCard)

      expect(mockOnViewBoard).toHaveBeenCalledWith('board-1')
    })
  })
})
