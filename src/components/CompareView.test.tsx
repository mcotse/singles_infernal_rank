import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CompareView } from './CompareView'
import type { Snapshot } from '../lib/types'

describe('CompareView', () => {
  const makeSnapshot = (
    id: string,
    episodeNumber: number,
    label: string,
    rankings: { cardId: string; cardName: string; rank: number; thumbnailKey: string | null }[]
  ): Snapshot => ({
    id,
    boardId: 'test-board',
    episodeNumber,
    label,
    notes: '',
    rankings,
    createdAt: Date.now(),
  })

  const leftSnapshot = makeSnapshot('s1', 1, 'Episode 1', [
    { cardId: 'c1', cardName: 'Alice', rank: 1, thumbnailKey: 'thumb-1' },
    { cardId: 'c2', cardName: 'Bob', rank: 2, thumbnailKey: null },
    { cardId: 'c3', cardName: 'Charlie', rank: 3, thumbnailKey: null },
  ])

  const rightSnapshot = makeSnapshot('s2', 2, 'Episode 2', [
    { cardId: 'c2', cardName: 'Bob', rank: 1, thumbnailKey: null }, // Moved up from 2 to 1
    { cardId: 'c1', cardName: 'Alice', rank: 2, thumbnailKey: 'thumb-1' }, // Moved down from 1 to 2
    { cardId: 'c4', cardName: 'Diana', rank: 3, thumbnailKey: null }, // New entry
    // c3 Charlie removed
  ])

  describe('column headers', () => {
    it('shows left snapshot label', () => {
      render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      expect(screen.getByText('Episode 1')).toBeInTheDocument()
    })

    it('shows right snapshot label', () => {
      render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      expect(screen.getByText('Episode 2')).toBeInTheDocument()
    })

    it('shows episode numbers', () => {
      render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      expect(screen.getByText('Ep. 1')).toBeInTheDocument()
      expect(screen.getByText('Ep. 2')).toBeInTheDocument()
    })
  })

  describe('ranking entries', () => {
    it('shows card names from both snapshots', () => {
      render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      // Left column cards
      expect(screen.getAllByText('Alice')).toHaveLength(2) // In both columns
      expect(screen.getAllByText('Bob')).toHaveLength(2)
      expect(screen.getByText('Charlie')).toBeInTheDocument() // Only in left
      expect(screen.getByText('Diana')).toBeInTheDocument() // Only in right
    })

    it('shows rank badges', () => {
      const { container } = render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      // Check that rank badges are rendered (they have specific styling)
      // Left: ranks 1, 2, 3; Right: ranks 1, 2, 3
      const rankBadges = container.querySelectorAll('.w-6.h-6')
      expect(rankBadges.length).toBe(6) // 3 in left + 3 in right
    })
  })

  describe('thumbnails', () => {
    it('shows placeholder when no thumbnail url', () => {
      render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      // Should have placeholders for cards without thumbnails
      expect(screen.getAllByText('👤').length).toBeGreaterThan(0)
    })

    it('shows image when thumbnail url provided', () => {
      render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{ 'thumb-1': 'http://example.com/alice.jpg' }}
        />
      )

      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
      expect(images[0]).toHaveAttribute('alt', 'Alice')
    })
  })

  describe('movement indicators', () => {
    it('shows movement on right column for improved rank', () => {
      render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      // Bob moved from rank 2 to rank 1 (improvement of 1)
      expect(screen.getByText('▲')).toBeInTheDocument()
    })

    it('shows down arrow for dropped rank', () => {
      render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      // Alice moved from rank 1 to rank 2 (drop of 1)
      expect(screen.getByText('▼')).toBeInTheDocument()
    })

    it('shows NEW badge for new entries', () => {
      render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      // Diana is new in right snapshot
      expect(screen.getByText('NEW')).toBeInTheDocument()
    })
  })

  describe('layout', () => {
    it('has two columns', () => {
      const { container } = render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      // The outer container has space-y-2, the inner container has flex
      const outerWrapper = container.firstChild as HTMLElement
      const innerWrapper = outerWrapper.querySelector('.flex') as HTMLElement
      expect(innerWrapper).toBeTruthy()
      expect(innerWrapper.className).toContain('flex')
    })

    it('has divider between columns', () => {
      const { container } = render(
        <CompareView
          leftSnapshot={leftSnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      // Should have a 3px wide divider
      const divider = container.querySelector('.w-\\[3px\\]')
      expect(divider).toBeInTheDocument()
    })
  })

  describe('empty rankings', () => {
    it('handles snapshot with no rankings', () => {
      const emptySnapshot = makeSnapshot('s0', 0, 'Empty', [])

      render(
        <CompareView
          leftSnapshot={emptySnapshot}
          rightSnapshot={rightSnapshot}
          thumbnailUrls={{}}
        />
      )

      // Should still render without error
      expect(screen.getByText('Empty')).toBeInTheDocument()
    })
  })
})
