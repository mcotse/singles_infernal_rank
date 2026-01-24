/**
 * useRankingComparison Hook
 *
 * Computes movement indicators and trajectories between snapshots.
 */

import { useMemo } from 'react'
import type { Snapshot, Card } from '../lib/types'

export interface MovementIndicator {
  cardId: string
  cardName: string
  currentRank: number
  baselineRank: number | null
  movement: number | null // positive = moved up, negative = moved down, null = new/removed
  isNew: boolean
  isRemoved: boolean
}

export interface TrajectoryPoint {
  episodeNumber: number
  rank: number | null // null if card wasn't in this snapshot
}

export interface CardTrajectory {
  cardId: string
  cardName: string
  trajectory: TrajectoryPoint[]
  summary: string // e.g., "3→1→2→1"
}

interface UseRankingComparisonReturn {
  /** Movement indicators for current vs baseline */
  movements: MovementIndicator[]
  /** Get trajectory for a specific card across all snapshots */
  getCardTrajectory: (cardId: string) => CardTrajectory | null
  /** Get trajectories for all current cards */
  allTrajectories: CardTrajectory[]
}

export const useRankingComparison = (
  currentCards: Card[],
  baselineSnapshot: Snapshot | null,
  allSnapshots: Snapshot[]
): UseRankingComparisonReturn => {
  // Compute movements between current and baseline
  const movements = useMemo((): MovementIndicator[] => {
    if (!baselineSnapshot) {
      // No baseline - show all cards with no movement data
      return currentCards.map((card) => ({
        cardId: card.id,
        cardName: card.name,
        currentRank: card.rank,
        baselineRank: null,
        movement: null,
        isNew: false,
        isRemoved: false,
      }))
    }

    const baselineMap = new Map(
      baselineSnapshot.rankings.map((r) => [r.cardId, r])
    )

    const results: MovementIndicator[] = []

    // Process current cards
    for (const card of currentCards) {
      const baseline = baselineMap.get(card.id)
      if (baseline) {
        results.push({
          cardId: card.id,
          cardName: card.name,
          currentRank: card.rank,
          baselineRank: baseline.rank,
          movement: baseline.rank - card.rank, // positive = moved up (lower rank number is better)
          isNew: false,
          isRemoved: false,
        })
        baselineMap.delete(card.id)
      } else {
        results.push({
          cardId: card.id,
          cardName: card.name,
          currentRank: card.rank,
          baselineRank: null,
          movement: null,
          isNew: true,
          isRemoved: false,
        })
      }
    }

    // Add removed cards (in baseline but not current)
    for (const [cardId, baseline] of baselineMap) {
      results.push({
        cardId,
        cardName: baseline.cardName,
        currentRank: -1,
        baselineRank: baseline.rank,
        movement: null,
        isNew: false,
        isRemoved: true,
      })
    }

    // Sort: current cards by rank first, then removed cards at end
    return results.sort((a, b) => {
      if (a.isRemoved && !b.isRemoved) return 1
      if (!a.isRemoved && b.isRemoved) return -1
      return a.currentRank - b.currentRank
    })
  }, [currentCards, baselineSnapshot])

  // Build trajectory for a specific card
  const getCardTrajectory = useMemo(() => {
    return (cardId: string): CardTrajectory | null => {
      const card = currentCards.find((c) => c.id === cardId)
      if (!card) return null

      const trajectory: TrajectoryPoint[] = allSnapshots.map((snapshot) => {
        const entry = snapshot.rankings.find((r) => r.cardId === cardId)
        return {
          episodeNumber: snapshot.episodeNumber,
          rank: entry?.rank ?? null,
        }
      })

      // Build summary string (e.g., "3→1→2→1")
      const ranksWithValues = trajectory.filter((t) => t.rank !== null)
      const summary =
        ranksWithValues.length > 0
          ? ranksWithValues.map((t) => t.rank).join('→')
          : 'New'

      return {
        cardId,
        cardName: card.name,
        trajectory,
        summary,
      }
    }
  }, [currentCards, allSnapshots])

  // Compute all trajectories for current cards
  const allTrajectories = useMemo((): CardTrajectory[] => {
    return currentCards
      .map((card) => getCardTrajectory(card.id))
      .filter((t): t is CardTrajectory => t !== null)
  }, [currentCards, getCardTrajectory])

  return {
    movements,
    getCardTrajectory,
    allTrajectories,
  }
}
