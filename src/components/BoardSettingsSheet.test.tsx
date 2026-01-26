/**
 * BoardSettingsSheet Tests
 *
 * Tests for the board sharing settings sheet component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoardSettingsSheet } from './BoardSettingsSheet'
import type { CloudBoard } from '../lib/firestoreBoards'
import type { BoardSharing } from '../lib/socialTypes'

describe('BoardSettingsSheet', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  const defaultSharing: BoardSharing = {
    visibility: 'private',
    publicLinkEnabled: false,
  }

  const mockCloudBoard: CloudBoard = {
    id: 'board-123',
    name: 'Test Board',
    coverImage: null,
    createdAt: Date.now() - 10000,
    updatedAt: Date.now(),
    deletedAt: null,
    ownerId: 'user-123',
    sharing: defaultSharing,
    syncedAt: Date.now(),
  }

  const mockFriends = [
    { uid: 'friend-1', displayName: 'Friend One', username: 'friend1', avatarUrl: '' },
    { uid: 'friend-2', displayName: 'Friend Two', username: 'friend2', avatarUrl: '' },
    { uid: 'friend-3', displayName: 'Friend Three', username: 'friend3', avatarUrl: '' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSave.mockResolvedValue(undefined)
  })

  describe('rendering', () => {
    it('should render the sheet with title', () => {
      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText(/sharing settings/i)).toBeInTheDocument()
    })

    it('should render visibility options', () => {
      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      // Use getAllBy and check that the radio buttons exist
      expect(screen.getByRole('radio', { name: /private/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /^friends$/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /specific friends/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /public/i })).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(
        <BoardSettingsSheet
          isOpen={false}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      expect(screen.queryByText(/sharing settings/i)).not.toBeInTheDocument()
    })
  })

  describe('visibility selection', () => {
    it('should select private by default for private board', () => {
      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      const privateRadio = screen.getByRole('radio', { name: /private/i })
      expect(privateRadio).toBeChecked()
    })

    it('should allow changing visibility', async () => {
      const user = userEvent.setup()
      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      const friendsRadio = screen.getByRole('radio', { name: /^friends$/i })
      await user.click(friendsRadio)

      expect(friendsRadio).toBeChecked()
    })
  })

  describe('specific friends selection', () => {
    it('should show friend picker when specific visibility is selected', async () => {
      const user = userEvent.setup()
      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      const specificRadio = screen.getByRole('radio', { name: /specific friends/i })
      await user.click(specificRadio)

      expect(screen.getByText('Friend One')).toBeInTheDocument()
      expect(screen.getByText('Friend Two')).toBeInTheDocument()
    })

    it('should allow selecting specific friends', async () => {
      const user = userEvent.setup()
      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      const specificRadio = screen.getByRole('radio', { name: /specific friends/i })
      await user.click(specificRadio)

      const friendCheckbox = screen.getByRole('checkbox', { name: /friend one/i })
      await user.click(friendCheckbox)

      expect(friendCheckbox).toBeChecked()
    })
  })

  describe('public link settings', () => {
    it('should show public link toggle when public visibility is selected', async () => {
      const user = userEvent.setup()
      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      const publicRadio = screen.getByRole('radio', { name: /public/i })
      await user.click(publicRadio)

      expect(screen.getByText(/enable public link/i)).toBeInTheDocument()
    })

    it('should show copy link button when public link is enabled', async () => {
      const boardWithPublicLink: CloudBoard = {
        ...mockCloudBoard,
        sharing: {
          visibility: 'public',
          publicLinkEnabled: true,
          publicLinkId: 'abc123',
        },
      }

      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={boardWithPublicLink}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    })

    it('should show revoke link button when public link is enabled', async () => {
      const boardWithPublicLink: CloudBoard = {
        ...mockCloudBoard,
        sharing: {
          visibility: 'public',
          publicLinkEnabled: true,
          publicLinkId: 'abc123',
        },
      }

      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={boardWithPublicLink}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByRole('button', { name: /revoke link/i })).toBeInTheDocument()
    })
  })

  describe('saving changes', () => {
    it('should call onSave with updated sharing when save is clicked', async () => {
      const user = userEvent.setup()
      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      const friendsRadio = screen.getByRole('radio', { name: /^friends$/i })
      await user.click(friendsRadio)

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'friends',
        })
      )
    })

    it('should include selected friends when saving specific visibility', async () => {
      const user = userEvent.setup()
      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      const specificRadio = screen.getByRole('radio', { name: /specific friends/i })
      await user.click(specificRadio)

      const friendCheckbox = screen.getByRole('checkbox', { name: /friend one/i })
      await user.click(friendCheckbox)

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'specific',
          allowedFriends: ['friend-1'],
        })
      )
    })

    it('should close sheet after successful save', async () => {
      const user = userEvent.setup()
      render(
        <BoardSettingsSheet
          isOpen={true}
          onClose={mockOnClose}
          board={mockCloudBoard}
          friends={mockFriends}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })
})
