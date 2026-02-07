/**
 * useSpaceBoards Hook
 *
 * Board CRUD within a space context.
 * Handles draft filtering, limit enforcement, and syncing.
 */

import { useState, useEffect, useCallback } from 'react'
import type { Board, Card } from '../lib/types'
import type { SpaceBoard, SpaceCard } from '../lib/spaceTypes'
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
  saveSpaceCards,
} from '../lib/firestoreSpaces'
import { getSpaceMembership } from '../lib/spaceStorage'
import { getCardsByBoard } from '../lib/storage'
import { getImage } from '../lib/db'
import { uploadCardImage, uploadBoardCoverImage } from '../lib/firebaseStorage'

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

        // Get local cards for this board
        const localCards = getCardsByBoard(board.id)

        // Convert local cards to space cards with Firebase Storage URLs
        const spaceCards: SpaceCard[] = await Promise.all(
          localCards.map(async (card: Card) => {
            let imageUrl: string | null = null
            let thumbnailUrl: string | null = null

            // Upload images to Firebase Storage if they exist
            if (card.imageKey) {
              const storedImage = await getImage(card.imageKey)
              if (storedImage) {
                try {
                  imageUrl = await uploadCardImage(spaceId, board.id, card.id, storedImage.blob)
                  // Also upload thumbnail
                  if (storedImage.thumbnail) {
                    thumbnailUrl = await uploadCardImage(
                      spaceId,
                      board.id,
                      `${card.id}_thumb`,
                      storedImage.thumbnail
                    )
                  }
                } catch (err) {
                  console.error('Failed to upload card image:', err)
                }
              }
            }

            return {
              id: card.id,
              boardId: card.boardId,
              name: card.name,
              nickname: card.nickname,
              imageUrl,
              thumbnailUrl,
              rank: card.rank,
              notes: card.notes,
              syncedAt: Date.now(),
            }
          })
        )

        // Upload board cover image if it exists
        let boardWithCoverUrl = board
        if (board.coverImage) {
          const coverImage = await getImage(board.coverImage)
          if (coverImage) {
            try {
              const coverUrl = await uploadBoardCoverImage(spaceId, board.id, coverImage.blob)
              // Store the URL in a way that SpaceBoard can use
              // Note: SpaceBoard inherits coverImage as string | null
              // We'll store the Firebase URL in the coverImage field for synced boards
              boardWithCoverUrl = { ...board, coverImage: coverUrl }
            } catch (err) {
              console.error('Failed to upload board cover image:', err)
            }
          }
        }

        // Save board to Firestore
        const result = await saveSpaceBoard(spaceId, boardWithCoverUrl, uid, ownerName, isDraft)

        // Save cards to Firestore
        if (spaceCards.length > 0) {
          await saveSpaceCards(spaceId, board.id, spaceCards)
        }

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
