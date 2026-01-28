/**
 * useSpaceBoards Hook
 *
 * Board CRUD within a space context.
 * Handles draft filtering, limit enforcement, and syncing.
 */

import { useState, useEffect, useCallback } from 'react'
import type { Board } from '../lib/types'
import type { SpaceBoard } from '../lib/spaceTypes'
import { SPACE_LIMITS } from '../lib/spaceTypes'
import { getDeviceToken } from '../lib/deviceToken'
import { isAllowlisted } from '../lib/allowlist'
import { getAnonUid } from '../lib/firebase'
import {
  saveSpaceBoard,
  getSpaceBoards,
  getSpaceBoardsByOwner,
  deleteSpaceBoard,
  updateSpaceBoardDraft,
} from '../lib/firestoreSpaces'
import { getSpaceMembership } from '../lib/spaceStorage'

export interface UseSpaceBoardsReturn {
  /** All non-draft boards in the space (visible to everyone) */
  allBoards: SpaceBoard[]
  /** Current user's boards (including drafts) */
  myBoards: SpaceBoard[]
  isLoading: boolean
  error: string | null
  canCreateBoard: boolean
  syncBoard: (board: Board, isDraft?: boolean) => Promise<SpaceBoard | null>
  removeBoard: (boardId: string) => Promise<void>
  toggleDraft: (boardId: string, isDraft: boolean) => Promise<void>
  refresh: () => Promise<void>
}

export const useSpaceBoards = (spaceId: string | null): UseSpaceBoardsReturn => {
  const [allBoards, setAllBoards] = useState<SpaceBoard[]>([])
  const [myBoards, setMyBoards] = useState<SpaceBoard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deviceToken = getDeviceToken()
  const allowlisted = isAllowlisted(deviceToken)

  const loadBoards = useCallback(async () => {
    if (!spaceId) return

    setIsLoading(true)
    try {
      const uid = await getAnonUid()
      const [all, mine] = await Promise.all([
        getSpaceBoards(spaceId),
        uid ? getSpaceBoardsByOwner(spaceId, uid) : Promise.resolve([]),
      ])

      // All boards: exclude drafts from other users
      setAllBoards(all.filter((b) => !b.isDraft || b.ownerId === uid))
      setMyBoards(mine)
    } catch (err) {
      console.error('Error loading space boards:', err)
      setError('Failed to load boards')
    } finally {
      setIsLoading(false)
    }
  }, [spaceId])

  useEffect(() => {
    loadBoards()
  }, [loadBoards])

  const canCreateBoard =
    allowlisted ||
    myBoards.length < SPACE_LIMITS.maxBoardsPerUserPerSpace

  const syncBoard = useCallback(
    async (board: Board, isDraft = false): Promise<SpaceBoard | null> => {
      if (!spaceId) return null

      if (!canCreateBoard && !myBoards.some((b) => b.id === board.id)) {
        setError(`You can have up to ${SPACE_LIMITS.maxBoardsPerUserPerSpace} boards per space`)
        return null
      }

      try {
        const uid = await getAnonUid()
        if (!uid) {
          setError('Authentication failed')
          return null
        }

        const membership = getSpaceMembership(spaceId)
        const ownerName = membership?.displayName ?? 'Unknown'

        const result = await saveSpaceBoard(spaceId, board, uid, ownerName, isDraft)
        await loadBoards()
        return result
      } catch (err) {
        console.error('Error syncing board:', err)
        setError('Failed to sync board')
        return null
      }
    },
    [spaceId, canCreateBoard, myBoards, loadBoards]
  )

  const removeBoard = useCallback(
    async (boardId: string) => {
      if (!spaceId) return
      try {
        await deleteSpaceBoard(spaceId, boardId)
        await loadBoards()
      } catch (err) {
        console.error('Error deleting board:', err)
        setError('Failed to delete board')
      }
    },
    [spaceId, loadBoards]
  )

  const toggleDraft = useCallback(
    async (boardId: string, isDraft: boolean) => {
      if (!spaceId) return
      try {
        await updateSpaceBoardDraft(spaceId, boardId, isDraft)
        await loadBoards()
      } catch (err) {
        console.error('Error updating draft status:', err)
        setError('Failed to update board')
      }
    },
    [spaceId, loadBoards]
  )

  return {
    allBoards,
    myBoards,
    isLoading,
    error,
    canCreateBoard,
    syncBoard,
    removeBoard,
    toggleDraft,
    refresh: loadBoards,
  }
}
