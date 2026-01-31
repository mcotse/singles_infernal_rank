/**
 * useSpaces Hook
 *
 * Manages space creation, joining, leaving, and listing.
 * Handles anonymous auth initialization and limit enforcement.
 */

import { useState, useEffect, useCallback } from 'react'
import type { LocalSpaceMembership } from '../lib/spaceTypes'
import { SPACE_LIMITS } from '../lib/spaceTypes'
import { getDeviceToken } from '../lib/deviceToken'
import { isAllowlisted } from '../lib/allowlist'
import {
  getSpaceMemberships,
  addSpaceMembership,
  removeSpaceMembership,
  getSpaceCount,
} from '../lib/spaceStorage'
import {
  createFirestoreSpace,
  findSpaceByJoinCode,
  addSpaceMember,
  removeSpaceMember as removeFirestoreMember,
  getAllJoinCodes,
  findMemberByDeviceToken,
} from '../lib/firestoreSpaces'
import { generateUniqueJoinCode } from '../lib/wordBank'
import { initializeAnonymousAuth, getAnonUid, USE_MOCK_AUTH } from '../lib/firebase'
import { actionLogger as log, logError } from '../lib/logger'

export interface UseSpacesReturn {
  spaces: LocalSpaceMembership[]
  isLoading: boolean
  error: string | null
  anonUid: string | null
  createSpace: (spaceName: string, displayName: string) => Promise<LocalSpaceMembership | null>
  joinSpace: (joinCode: string, displayName: string) => Promise<LocalSpaceMembership | null>
  leaveSpace: (spaceId: string) => Promise<void>
  canCreateSpace: boolean
  refresh: () => void
  clearError: () => void
}

export const useSpaces = (): UseSpacesReturn => {
  const [spaces, setSpaces] = useState<LocalSpaceMembership[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anonUid, setAnonUid] = useState<string | null>(null)

  const deviceToken = getDeviceToken()
  const allowlisted = isAllowlisted(deviceToken)

  // Load memberships from localStorage
  const loadSpaces = useCallback(() => {
    setSpaces(getSpaceMemberships())
  }, [])

  // Initialize anon auth on mount
  useEffect(() => {
    const init = async () => {
      try {
        if (USE_MOCK_AUTH) {
          const uid = await getAnonUid()
          setAnonUid(uid)
        } else {
          const uid = await initializeAnonymousAuth()
          setAnonUid(uid)
        }
      } catch (err) {
        logError('anonymous_auth_failed', err)
      }
    }
    init()
    loadSpaces()
  }, [loadSpaces])

  const canCreateSpace = allowlisted || getSpaceCount() < SPACE_LIMITS.maxSpacesPerDevice

  const createSpace = useCallback(
    async (spaceName: string, displayName: string): Promise<LocalSpaceMembership | null> => {
      // Re-check at call time to avoid stale closure
      if (!allowlisted && getSpaceCount() >= SPACE_LIMITS.maxSpacesPerDevice) {
        setError(`You can join up to ${SPACE_LIMITS.maxSpacesPerDevice} spaces`)
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const uid = anonUid ?? (await getAnonUid())
        if (!uid) {
          setError('Authentication failed')
          return null
        }

        const existingCodes = await getAllJoinCodes()
        const joinCode = await generateUniqueJoinCode(existingCodes)
        const spaceId = crypto.randomUUID()
        const memberId = crypto.randomUUID()

        // Create space in Firestore
        await createFirestoreSpace(spaceId, spaceName, joinCode, uid)

        // Add creator as admin member
        await addSpaceMember(spaceId, memberId, displayName, deviceToken, uid, 'admin')

        // Save locally
        const membership: LocalSpaceMembership = {
          spaceId,
          spaceName,
          joinCode,
          memberId,
          displayName,
          role: 'admin',
          joinedAt: Date.now(),
        }
        addSpaceMembership(membership)
        loadSpaces()

        log.info('space_created', { space_id: spaceId })
        return membership
      } catch (err) {
        logError('space_create_failed', err)
        setError('Failed to create space')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [anonUid, allowlisted, deviceToken, loadSpaces]
  )

  const joinSpace = useCallback(
    async (joinCode: string, displayName: string): Promise<LocalSpaceMembership | null> => {
      if (!allowlisted && getSpaceCount() >= SPACE_LIMITS.maxSpacesPerDevice) {
        setError(`You can join up to ${SPACE_LIMITS.maxSpacesPerDevice} spaces`)
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const uid = anonUid ?? (await getAnonUid())
        if (!uid) {
          setError('Authentication failed')
          return null
        }

        // Find space by join code
        const space = await findSpaceByJoinCode(joinCode)
        if (!space) {
          setError('Space not found. Check the join code and try again.')
          return null
        }

        // Check if already a member
        const existingMember = await findMemberByDeviceToken(space.id, deviceToken)
        if (existingMember) {
          setError('You are already a member of this space')
          return null
        }

        const memberId = crypto.randomUUID()

        // Add to Firestore
        await addSpaceMember(space.id, memberId, displayName, deviceToken, uid, 'member')

        // Save locally
        const membership: LocalSpaceMembership = {
          spaceId: space.id,
          spaceName: space.name,
          joinCode: space.joinCode,
          memberId,
          displayName,
          role: 'member',
          joinedAt: Date.now(),
        }
        addSpaceMembership(membership)
        loadSpaces()

        log.info('space_joined', { space_id: space.id })
        return membership
      } catch (err) {
        logError('space_join_failed', err)
        setError('Failed to join space')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [anonUid, allowlisted, deviceToken, loadSpaces]
  )

  const leaveSpace = useCallback(
    async (spaceId: string): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        const membership = getSpaceMemberships().find((m) => m.spaceId === spaceId)
        if (membership) {
          await removeFirestoreMember(spaceId, membership.memberId)
          removeSpaceMembership(spaceId)
          loadSpaces()
          log.info('space_left', { space_id: spaceId })
        }
      } catch (err) {
        logError('space_leave_failed', err, { space_id: spaceId })
        setError('Failed to leave space')
      } finally {
        setIsLoading(false)
      }
    },
    [loadSpaces]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    spaces,
    isLoading,
    error,
    anonUid,
    createSpace,
    joinSpace,
    leaveSpace,
    canCreateSpace,
    refresh: loadSpaces,
    clearError,
  }
}
