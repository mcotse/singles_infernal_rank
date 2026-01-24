/**
 * useSnapshots Hook
 *
 * Manages snapshot state for a specific board with localStorage persistence.
 * Handles CRUD operations for episode ranking history.
 */

import { useState, useCallback, useEffect } from 'react'
import {
  getSnapshotsByBoard,
  saveSnapshot,
  deleteSnapshot as deleteSnapshotFromStorage,
  getNextEpisodeNumber,
} from '../lib/storage'
import { createSnapshot, type Snapshot, type RankingEntry, type Card } from '../lib/types'

interface UseSnapshotsReturn {
  /** Snapshots for the board, sorted by episode number */
  snapshots: Snapshot[]
  /** Create a new snapshot from current card rankings */
  createSnapshot: (
    cards: Card[],
    options?: { episodeNumber?: number; label?: string; notes?: string }
  ) => Snapshot
  /** Update an existing snapshot's metadata (not rankings) */
  updateSnapshot: (id: string, updates: Partial<Pick<Snapshot, 'label' | 'notes'>>) => void
  /** Delete a snapshot */
  deleteSnapshot: (id: string) => void
  /** Get a specific snapshot by ID */
  getSnapshot: (id: string) => Snapshot | undefined
  /** Get the suggested next episode number */
  nextEpisodeNumber: number
  /** Refresh snapshots from storage */
  refresh: () => void
}

export const useSnapshots = (boardId: string): UseSnapshotsReturn => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() =>
    getSnapshotsByBoard(boardId)
  )

  const [nextEpisodeNumber, setNextEpisodeNumber] = useState(() =>
    getNextEpisodeNumber(boardId)
  )

  // Reload when boardId changes
  useEffect(() => {
    setSnapshots(getSnapshotsByBoard(boardId))
    setNextEpisodeNumber(getNextEpisodeNumber(boardId))
  }, [boardId])

  const createSnapshotFn = useCallback(
    (
      cards: Card[],
      options: { episodeNumber?: number; label?: string; notes?: string } = {}
    ): Snapshot => {
      const episodeNum = options.episodeNumber ?? nextEpisodeNumber

      // Convert current cards to ranking entries (sorted by rank)
      const rankings: RankingEntry[] = [...cards]
        .sort((a, b) => a.rank - b.rank)
        .map((card) => ({
          cardId: card.id,
          cardName: card.name,
          rank: card.rank,
          thumbnailKey: card.thumbnailKey,
        }))

      const snapshot = createSnapshot(boardId, episodeNum, rankings, {
        label: options.label,
        notes: options.notes,
      })

      saveSnapshot(snapshot)
      setSnapshots((prev) =>
        [...prev, snapshot].sort((a, b) => a.episodeNumber - b.episodeNumber)
      )
      setNextEpisodeNumber(episodeNum + 1)

      return snapshot
    },
    [boardId, nextEpisodeNumber]
  )

  const updateSnapshotFn = useCallback(
    (id: string, updates: Partial<Pick<Snapshot, 'label' | 'notes'>>) => {
      setSnapshots((prev) => {
        const index = prev.findIndex((s) => s.id === id)
        if (index === -1) return prev

        const updated: Snapshot = {
          ...prev[index],
          ...updates,
        }
        saveSnapshot(updated)

        const newSnapshots = [...prev]
        newSnapshots[index] = updated
        return newSnapshots
      })
    },
    []
  )

  const deleteSnapshotFn = useCallback((id: string) => {
    deleteSnapshotFromStorage(id)
    setSnapshots((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const getSnapshotFn = useCallback(
    (id: string): Snapshot | undefined => {
      return snapshots.find((s) => s.id === id)
    },
    [snapshots]
  )

  const refresh = useCallback(() => {
    setSnapshots(getSnapshotsByBoard(boardId))
    setNextEpisodeNumber(getNextEpisodeNumber(boardId))
  }, [boardId])

  return {
    snapshots,
    createSnapshot: createSnapshotFn,
    updateSnapshot: updateSnapshotFn,
    deleteSnapshot: deleteSnapshotFn,
    getSnapshot: getSnapshotFn,
    nextEpisodeNumber,
    refresh,
  }
}
