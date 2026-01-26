/**
 * useBoardSync Hook
 *
 * Manages board synchronization state and operations with Firestore.
 *
 * Features:
 * - Sync all boards to cloud
 * - Sync individual board
 * - Track sync status (idle, syncing, synced, error)
 * - Error handling with retry capability
 *
 * Sync strategy:
 * - Local always wins conflicts
 * - Full sync on sign-in
 * - Individual sync on board updates
 */

import { useState, useCallback, useMemo } from 'react'
import type { Board } from '../lib/types'
import {
  fullBoardSync,
  syncBoardsToCloud,
} from '../lib/firestoreBoards'

/**
 * Sync status states
 */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

/**
 * useBoardSync options
 */
export interface UseBoardSyncOptions {
  /** Firebase user ID (null if not signed in) */
  userId: string | null
}

/**
 * useBoardSync return type
 */
export interface UseBoardSyncReturn {
  /** Current sync status */
  status: SyncStatus
  /** Error message if status is 'error' */
  error: string | null
  /** Timestamp of last successful sync */
  lastSyncedAt: number | null
  /** Convenience flag for status === 'syncing' */
  isSyncing: boolean
  /** Sync all boards with cloud (full merge) */
  syncAll: (localBoards: Board[]) => Promise<Board[]>
  /** Sync a single board to cloud */
  syncBoard: (board: Board) => Promise<void>
  /** Clear error and reset to idle */
  clearError: () => void
}

/**
 * Hook for managing board sync with Firestore
 *
 * @param options - Configuration options
 * @returns Sync state and functions
 */
export const useBoardSync = (options: UseBoardSyncOptions): UseBoardSyncReturn => {
  const { userId } = options

  const [status, setStatus] = useState<SyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)

  // Convenience flag
  const isSyncing = useMemo(() => status === 'syncing', [status])

  /**
   * Sync all boards - performs full merge with cloud
   */
  const syncAll = useCallback(
    async (localBoards: Board[]): Promise<Board[]> => {
      // No-op if not signed in
      if (!userId) {
        return localBoards
      }

      setStatus('syncing')
      setError(null)

      try {
        const mergedBoards = await fullBoardSync(localBoards, userId)
        setStatus('synced')
        setLastSyncedAt(Date.now())
        return mergedBoards
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed'
        setStatus('error')
        setError(message)
        return localBoards // Return original on error
      }
    },
    [userId]
  )

  /**
   * Sync a single board to cloud
   */
  const syncBoard = useCallback(
    async (board: Board): Promise<void> => {
      // No-op if not signed in
      if (!userId) {
        return
      }

      setStatus('syncing')
      setError(null)

      try {
        await syncBoardsToCloud([board], userId)
        setStatus('synced')
        setLastSyncedAt(Date.now())
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed'
        setStatus('error')
        setError(message)
      }
    },
    [userId]
  )

  /**
   * Clear error and reset to idle
   */
  const clearError = useCallback(() => {
    setError(null)
    setStatus('idle')
  }, [])

  return {
    status,
    error,
    lastSyncedAt,
    isSyncing,
    syncAll,
    syncBoard,
    clearError,
  }
}
