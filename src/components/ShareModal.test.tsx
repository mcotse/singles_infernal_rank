/**
 * ShareModal Tests
 *
 * Tests for the quick share modal component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareModal } from './ShareModal'
import type { BoardSharing } from '../lib/socialTypes'

describe('ShareModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  const defaultSharing: BoardSharing = {
    visibility: 'private',
    publicLinkEnabled: false,
  }

  const mockFriends = [
    { uid: 'friend-1', displayName: 'Friend One', username: 'friend1', avatarUrl: '' },
    { uid: 'friend-2', displayName: 'Friend Two', username: 'friend2', avatarUrl: '' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSave.mockResolvedValue(undefined)
  })

  describe('rendering', () => {
    it('should render the modal with title', () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          currentSharing={defaultSharing}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText(/share board/i)).toBeInTheDocument()
    })

    it('should render quick share options', () => {
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          currentSharing={defaultSharing}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByRole('button', { name: /keep private/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /friends only/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /public link/i })).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(
        <ShareModal
          isOpen={false}
          onClose={mockOnClose}
          currentSharing={defaultSharing}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      expect(screen.queryByText(/share board/i)).not.toBeInTheDocument()
    })

    it('should highlight current sharing option', () => {
      const friendsSharing: BoardSharing = {
        visibility: 'friends',
        publicLinkEnabled: false,
      }

      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          currentSharing={friendsSharing}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      // The friends button should be visually different (checked)
      const friendsButton = screen.getByRole('button', { name: /friends only/i })
      expect(friendsButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('interactions', () => {
    it('should call onSave with private visibility when Keep Private clicked', async () => {
      const user = userEvent.setup()
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          currentSharing={{ visibility: 'friends', publicLinkEnabled: false }}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      await user.click(screen.getByRole('button', { name: /keep private/i }))

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'private' })
      )
    })

    it('should call onSave with friends visibility when Friends Only clicked', async () => {
      const user = userEvent.setup()
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          currentSharing={defaultSharing}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      await user.click(screen.getByRole('button', { name: /friends only/i }))

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'friends' })
      )
    })

    it('should call onSave with public visibility when Public Link clicked', async () => {
      const user = userEvent.setup()
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          currentSharing={defaultSharing}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      await user.click(screen.getByRole('button', { name: /public link/i }))

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'public', publicLinkEnabled: true })
      )
    })

    it('should close modal after successful save', async () => {
      const user = userEvent.setup()
      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          currentSharing={defaultSharing}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      await user.click(screen.getByRole('button', { name: /friends only/i }))

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should show copy link button when public link is enabled', async () => {
      const publicSharing: BoardSharing = {
        visibility: 'public',
        publicLinkEnabled: true,
        publicLinkId: 'abc123',
      }

      render(
        <ShareModal
          isOpen={true}
          onClose={mockOnClose}
          currentSharing={publicSharing}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    })
  })
})
