/**
 * SyncMigrationModal Tests
 *
 * Tests for the first-time sync migration modal.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SyncMigrationModal } from './SyncMigrationModal'
import type { Board } from '../../lib/types'

describe('SyncMigrationModal', () => {
  const mockBoards: Board[] = [
    {
      id: 'board-1',
      name: 'Test Board 1',
      coverImage: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    },
    {
      id: 'board-2',
      name: 'Test Board 2',
      coverImage: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    },
  ]

  const defaultProps = {
    isOpen: true,
    boards: mockBoards,
    onSync: vi.fn().mockResolvedValue(undefined),
    onSkip: vi.fn(),
    isSyncing: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when isOpen is true', () => {
      render(<SyncMigrationModal {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<SyncMigrationModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should display board count', () => {
      render(<SyncMigrationModal {...defaultProps} />)

      expect(screen.getByText(/2 boards/i)).toBeInTheDocument()
    })

    it('should display singular "board" for one board', () => {
      render(<SyncMigrationModal {...defaultProps} boards={[mockBoards[0]]} />)

      expect(screen.getByText(/1 board/i)).toBeInTheDocument()
    })

    it('should have a sync button', () => {
      render(<SyncMigrationModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /sync/i })).toBeInTheDocument()
    })

    it('should have a skip button', () => {
      render(<SyncMigrationModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /skip|later|not now/i })).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onSync when sync button clicked', async () => {
      const user = userEvent.setup()
      render(<SyncMigrationModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /sync/i }))

      expect(defaultProps.onSync).toHaveBeenCalled()
    })

    it('should call onSkip when skip button clicked', async () => {
      const user = userEvent.setup()
      render(<SyncMigrationModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /skip|later|not now/i }))

      expect(defaultProps.onSkip).toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('should disable buttons when syncing', () => {
      render(<SyncMigrationModal {...defaultProps} isSyncing={true} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })

    it('should show loading indicator when syncing', () => {
      render(<SyncMigrationModal {...defaultProps} isSyncing={true} />)

      // Look for the specific syncing message indicator
      expect(screen.getByText(/syncing your boards/i)).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should display error message when error prop is set', () => {
      render(<SyncMigrationModal {...defaultProps} error="Network error" />)

      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    it('should show retry option when error occurs', () => {
      render(<SyncMigrationModal {...defaultProps} error="Sync failed" />)

      // Error state should still allow sync (retry)
      expect(screen.getByRole('button', { name: /sync|retry/i })).not.toBeDisabled()
    })
  })

  describe('empty state', () => {
    it('should not render for empty boards array', () => {
      render(<SyncMigrationModal {...defaultProps} boards={[]} />)

      // Modal should not appear if there are no boards to sync
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
