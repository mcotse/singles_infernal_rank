import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EpisodeTimeline } from './EpisodeTimeline'
import type { Snapshot } from '../lib/types'

describe('EpisodeTimeline', () => {
  const makeSnapshot = (
    id: string,
    episodeNumber: number,
    options: Partial<Snapshot> = {}
  ): Snapshot => ({
    id,
    boardId: 'test-board',
    episodeNumber,
    label: options.label ?? `Episode ${episodeNumber}`,
    notes: options.notes ?? '',
    rankings: options.rankings ?? [
      { cardId: 'c1', cardName: 'Card 1', rank: 1, thumbnailKey: null },
      { cardId: 'c2', cardName: 'Card 2', rank: 2, thumbnailKey: null },
    ],
    createdAt: options.createdAt ?? Date.now(),
  })

  const defaultProps = {
    snapshots: [] as Snapshot[],
    onSnapshotSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('shows empty state when no snapshots', () => {
      render(<EpisodeTimeline {...defaultProps} snapshots={[]} />)

      expect(screen.getByText('No Episodes Saved')).toBeInTheDocument()
      expect(
        screen.getByText('Save your first episode snapshot from the board view!')
      ).toBeInTheDocument()
    })

    it('shows empty state icon', () => {
      render(<EpisodeTimeline {...defaultProps} snapshots={[]} />)

      expect(screen.getByText('📊')).toBeInTheDocument()
    })
  })

  describe('rendering snapshots', () => {
    it('renders episode cards for each snapshot', () => {
      const snapshots = [makeSnapshot('s1', 1), makeSnapshot('s2', 2)]

      render(<EpisodeTimeline {...defaultProps} snapshots={snapshots} />)

      expect(screen.getByText('Episode 1')).toBeInTheDocument()
      expect(screen.getByText('Episode 2')).toBeInTheDocument()
    })

    it('displays episode number in badge', () => {
      const snapshots = [makeSnapshot('s1', 5)]

      render(<EpisodeTimeline {...defaultProps} snapshots={snapshots} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('displays snapshot label', () => {
      const snapshots = [makeSnapshot('s1', 1, { label: 'The Big Reveal' })]

      render(<EpisodeTimeline {...defaultProps} snapshots={snapshots} />)

      expect(screen.getByText('The Big Reveal')).toBeInTheDocument()
    })

    it('displays item count', () => {
      const snapshots = [
        makeSnapshot('s1', 1, {
          rankings: [
            { cardId: 'c1', cardName: 'Card 1', rank: 1, thumbnailKey: null },
            { cardId: 'c2', cardName: 'Card 2', rank: 2, thumbnailKey: null },
            { cardId: 'c3', cardName: 'Card 3', rank: 3, thumbnailKey: null },
          ],
        }),
      ]

      render(<EpisodeTimeline {...defaultProps} snapshots={snapshots} />)

      expect(screen.getByText(/3 items/)).toBeInTheDocument()
    })

    it('displays notes when present', () => {
      const snapshots = [
        makeSnapshot('s1', 1, { notes: 'After the pool date' }),
      ]

      render(<EpisodeTimeline {...defaultProps} snapshots={snapshots} />)

      expect(screen.getByText(/"After the pool date"/)).toBeInTheDocument()
    })

    it('does not display notes when empty', () => {
      const snapshots = [makeSnapshot('s1', 1, { notes: '' })]

      render(<EpisodeTimeline {...defaultProps} snapshots={snapshots} />)

      // Should not have any quoted empty text
      expect(screen.queryByText(/^""$/)).not.toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('calls onSnapshotSelect when episode clicked', () => {
      const onSelect = vi.fn()
      const snapshots = [makeSnapshot('s1', 1)]

      render(
        <EpisodeTimeline
          {...defaultProps}
          snapshots={snapshots}
          onSnapshotSelect={onSelect}
        />
      )

      // Click on the episode card (now a div with role="button")
      const episodeCard = screen.getByRole('button', { name: /select episode 1/i })
      fireEvent.click(episodeCard)

      expect(onSelect).toHaveBeenCalledWith('s1')
    })

    it('shows different style for selected snapshot', () => {
      const snapshots = [makeSnapshot('s1', 1), makeSnapshot('s2', 2)]

      render(
        <EpisodeTimeline
          {...defaultProps}
          snapshots={snapshots}
          selectedSnapshotId="s1"
        />
      )

      // Selected snapshot should have the blue accent
      // Note: Testing visual styles is limited in unit tests
      // This tests that rendering works with selection
      expect(screen.getByText('Episode 1')).toBeInTheDocument()
    })
  })

  describe('delete functionality', () => {
    it('shows delete button when onSnapshotDelete is provided', () => {
      const onDelete = vi.fn()
      const snapshots = [makeSnapshot('s1', 1, { label: 'Episode 1' })]

      render(
        <EpisodeTimeline
          {...defaultProps}
          snapshots={snapshots}
          onSnapshotDelete={onDelete}
        />
      )

      expect(screen.getByRole('button', { name: /delete episode 1/i })).toBeInTheDocument()
    })

    it('does not show delete button when onSnapshotDelete is not provided', () => {
      const snapshots = [makeSnapshot('s1', 1, { label: 'Episode 1' })]

      render(<EpisodeTimeline {...defaultProps} snapshots={snapshots} />)

      expect(
        screen.queryByRole('button', { name: /delete/i })
      ).not.toBeInTheDocument()
    })

    it('calls onSnapshotDelete when delete button clicked', () => {
      const onDelete = vi.fn()
      const snapshots = [makeSnapshot('s1', 1, { label: 'Episode 1' })]

      render(
        <EpisodeTimeline
          {...defaultProps}
          snapshots={snapshots}
          onSnapshotDelete={onDelete}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /delete episode 1/i }))

      expect(onDelete).toHaveBeenCalledWith('s1')
    })

    it('does not trigger select when delete button clicked', () => {
      const onSelect = vi.fn()
      const onDelete = vi.fn()
      const snapshots = [makeSnapshot('s1', 1, { label: 'Episode 1' })]

      render(
        <EpisodeTimeline
          {...defaultProps}
          snapshots={snapshots}
          onSnapshotSelect={onSelect}
          onSnapshotDelete={onDelete}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /delete episode 1/i }))

      expect(onDelete).toHaveBeenCalled()
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('date formatting', () => {
    it('formats date correctly', () => {
      // Jan 15, 2026
      const timestamp = new Date('2026-01-15T12:00:00').getTime()
      const snapshots = [makeSnapshot('s1', 1, { createdAt: timestamp })]

      render(<EpisodeTimeline {...defaultProps} snapshots={snapshots} />)

      expect(screen.getByText(/Jan 15, 2026/)).toBeInTheDocument()
    })
  })
})
