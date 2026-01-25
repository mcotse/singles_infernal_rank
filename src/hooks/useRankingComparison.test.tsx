import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useRankingComparison } from './useRankingComparison'
import type { Snapshot, Card } from '../lib/types'

describe('useRankingComparison', () => {
  const boardId = 'test-board'

  const makeCard = (id: string, name: string, rank: number): Card => ({
    id,
    boardId,
    name,
    nickname: '',
    imageKey: null,
    thumbnailKey: null,
    imageCrop: null,
    notes: '',
    metadata: {},
    rank,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  const makeSnapshot = (
    id: string,
    episodeNumber: number,
    rankings: { cardId: string; cardName: string; rank: number }[]
  ): Snapshot => ({
    id,
    boardId,
    episodeNumber,
    label: `Episode ${episodeNumber}`,
    notes: '',
    rankings: rankings.map((r) => ({ ...r, thumbnailKey: null })),
    createdAt: Date.now(),
  })

  describe('movements', () => {
    it('returns empty movements for empty cards', () => {
      const { result } = renderHook(() =>
        useRankingComparison([], null, [])
      )

      expect(result.current.movements).toHaveLength(0)
    })

    it('returns movements with no baseline when baseline is null', () => {
      const cards = [makeCard('c1', 'Card 1', 1), makeCard('c2', 'Card 2', 2)]

      const { result } = renderHook(() =>
        useRankingComparison(cards, null, [])
      )

      expect(result.current.movements).toHaveLength(2)
      expect(result.current.movements[0]).toEqual({
        cardId: 'c1',
        cardName: 'Card 1',
        currentRank: 1,
        baselineRank: null,
        movement: null,
        isNew: false,
        isRemoved: false,
      })
    })

    it('calculates positive movement when rank improved', () => {
      const cards = [makeCard('c1', 'Card 1', 1)] // Now rank 1
      const baseline = makeSnapshot('s1', 1, [
        { cardId: 'c1', cardName: 'Card 1', rank: 3 }, // Was rank 3
      ])

      const { result } = renderHook(() =>
        useRankingComparison(cards, baseline, [])
      )

      expect(result.current.movements[0].movement).toBe(2) // 3 - 1 = 2 (moved up)
    })

    it('calculates negative movement when rank dropped', () => {
      const cards = [makeCard('c1', 'Card 1', 5)] // Now rank 5
      const baseline = makeSnapshot('s1', 1, [
        { cardId: 'c1', cardName: 'Card 1', rank: 2 }, // Was rank 2
      ])

      const { result } = renderHook(() =>
        useRankingComparison(cards, baseline, [])
      )

      expect(result.current.movements[0].movement).toBe(-3) // 2 - 5 = -3 (moved down)
    })

    it('calculates zero movement for unchanged rank', () => {
      const cards = [makeCard('c1', 'Card 1', 2)]
      const baseline = makeSnapshot('s1', 1, [
        { cardId: 'c1', cardName: 'Card 1', rank: 2 },
      ])

      const { result } = renderHook(() =>
        useRankingComparison(cards, baseline, [])
      )

      expect(result.current.movements[0].movement).toBe(0)
    })

    it('marks new cards with isNew flag', () => {
      const cards = [
        makeCard('c1', 'Card 1', 1),
        makeCard('c2', 'Card 2', 2), // Not in baseline
      ]
      const baseline = makeSnapshot('s1', 1, [
        { cardId: 'c1', cardName: 'Card 1', rank: 1 },
      ])

      const { result } = renderHook(() =>
        useRankingComparison(cards, baseline, [])
      )

      const newCard = result.current.movements.find((m) => m.cardId === 'c2')
      expect(newCard?.isNew).toBe(true)
      expect(newCard?.movement).toBeNull()
    })

    it('marks removed cards with isRemoved flag', () => {
      const cards = [makeCard('c1', 'Card 1', 1)]
      const baseline = makeSnapshot('s1', 1, [
        { cardId: 'c1', cardName: 'Card 1', rank: 1 },
        { cardId: 'c2', cardName: 'Card 2', rank: 2 }, // Removed
      ])

      const { result } = renderHook(() =>
        useRankingComparison(cards, baseline, [])
      )

      const removedCard = result.current.movements.find((m) => m.cardId === 'c2')
      expect(removedCard?.isRemoved).toBe(true)
      expect(removedCard?.currentRank).toBe(-1)
      expect(removedCard?.baselineRank).toBe(2)
    })

    it('sorts movements with removed cards at end', () => {
      const cards = [
        makeCard('c1', 'Card 1', 2),
        makeCard('c3', 'Card 3', 1),
      ]
      const baseline = makeSnapshot('s1', 1, [
        { cardId: 'c1', cardName: 'Card 1', rank: 1 },
        { cardId: 'c2', cardName: 'Card 2', rank: 2 },
        { cardId: 'c3', cardName: 'Card 3', rank: 3 },
      ])

      const { result } = renderHook(() =>
        useRankingComparison(cards, baseline, [])
      )

      expect(result.current.movements[0].cardId).toBe('c3') // rank 1
      expect(result.current.movements[1].cardId).toBe('c1') // rank 2
      expect(result.current.movements[2].cardId).toBe('c2') // removed, at end
    })
  })

  describe('getCardTrajectory', () => {
    it('returns null for non-existent card', () => {
      const cards = [makeCard('c1', 'Card 1', 1)]

      const { result } = renderHook(() =>
        useRankingComparison(cards, null, [])
      )

      const trajectory = result.current.getCardTrajectory('non-existent')
      expect(trajectory).toBeNull()
    })

    it('returns trajectory across all snapshots', () => {
      const cards = [makeCard('c1', 'Card 1', 1)]
      const snapshots = [
        makeSnapshot('s1', 1, [{ cardId: 'c1', cardName: 'Card 1', rank: 3 }]),
        makeSnapshot('s2', 2, [{ cardId: 'c1', cardName: 'Card 1', rank: 1 }]),
        makeSnapshot('s3', 3, [{ cardId: 'c1', cardName: 'Card 1', rank: 2 }]),
      ]

      const { result } = renderHook(() =>
        useRankingComparison(cards, null, snapshots)
      )

      const trajectory = result.current.getCardTrajectory('c1')
      expect(trajectory?.trajectory).toHaveLength(3)
      expect(trajectory?.trajectory[0]).toEqual({ episodeNumber: 1, rank: 3 })
      expect(trajectory?.trajectory[1]).toEqual({ episodeNumber: 2, rank: 1 })
      expect(trajectory?.trajectory[2]).toEqual({ episodeNumber: 3, rank: 2 })
    })

    it('includes null for episodes where card was absent', () => {
      const cards = [makeCard('c1', 'Card 1', 1)]
      const snapshots = [
        makeSnapshot('s1', 1, [{ cardId: 'c1', cardName: 'Card 1', rank: 2 }]),
        makeSnapshot('s2', 2, [{ cardId: 'c2', cardName: 'Card 2', rank: 1 }]), // c1 not present
        makeSnapshot('s3', 3, [{ cardId: 'c1', cardName: 'Card 1', rank: 1 }]),
      ]

      const { result } = renderHook(() =>
        useRankingComparison(cards, null, snapshots)
      )

      const trajectory = result.current.getCardTrajectory('c1')
      expect(trajectory?.trajectory[0].rank).toBe(2)
      expect(trajectory?.trajectory[1].rank).toBeNull()
      expect(trajectory?.trajectory[2].rank).toBe(1)
    })

    it('generates summary string from ranks', () => {
      const cards = [makeCard('c1', 'Card 1', 1)]
      const snapshots = [
        makeSnapshot('s1', 1, [{ cardId: 'c1', cardName: 'Card 1', rank: 3 }]),
        makeSnapshot('s2', 2, [{ cardId: 'c1', cardName: 'Card 1', rank: 1 }]),
        makeSnapshot('s3', 3, [{ cardId: 'c1', cardName: 'Card 1', rank: 2 }]),
        makeSnapshot('s4', 4, [{ cardId: 'c1', cardName: 'Card 1', rank: 1 }]),
      ]

      const { result } = renderHook(() =>
        useRankingComparison(cards, null, snapshots)
      )

      const trajectory = result.current.getCardTrajectory('c1')
      expect(trajectory?.summary).toBe('3→1→2→1')
    })

    it('returns "New" for cards with no snapshot history', () => {
      const cards = [makeCard('c1', 'Card 1', 1)]
      const snapshots = [
        makeSnapshot('s1', 1, [{ cardId: 'c2', cardName: 'Card 2', rank: 1 }]),
      ]

      const { result } = renderHook(() =>
        useRankingComparison(cards, null, snapshots)
      )

      const trajectory = result.current.getCardTrajectory('c1')
      expect(trajectory?.summary).toBe('New')
    })
  })

  describe('allTrajectories', () => {
    it('returns trajectories for all current cards', () => {
      const cards = [
        makeCard('c1', 'Card 1', 1),
        makeCard('c2', 'Card 2', 2),
      ]
      const snapshots = [
        makeSnapshot('s1', 1, [
          { cardId: 'c1', cardName: 'Card 1', rank: 2 },
          { cardId: 'c2', cardName: 'Card 2', rank: 1 },
        ]),
      ]

      const { result } = renderHook(() =>
        useRankingComparison(cards, null, snapshots)
      )

      expect(result.current.allTrajectories).toHaveLength(2)
      expect(result.current.allTrajectories[0].cardId).toBe('c1')
      expect(result.current.allTrajectories[1].cardId).toBe('c2')
    })

    it('returns empty array for no cards', () => {
      const { result } = renderHook(() => useRankingComparison([], null, []))

      expect(result.current.allTrajectories).toHaveLength(0)
    })

    it('each trajectory has correct summary', () => {
      const cards = [
        makeCard('c1', 'Card 1', 1),
        makeCard('c2', 'Card 2', 2),
      ]
      const snapshots = [
        makeSnapshot('s1', 1, [
          { cardId: 'c1', cardName: 'Card 1', rank: 2 },
          { cardId: 'c2', cardName: 'Card 2', rank: 1 },
        ]),
        makeSnapshot('s2', 2, [
          { cardId: 'c1', cardName: 'Card 1', rank: 1 },
          { cardId: 'c2', cardName: 'Card 2', rank: 2 },
        ]),
      ]

      const { result } = renderHook(() =>
        useRankingComparison(cards, null, snapshots)
      )

      expect(result.current.allTrajectories[0].summary).toBe('2→1')
      expect(result.current.allTrajectories[1].summary).toBe('1→2')
    })
  })
})
