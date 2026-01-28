/**
 * useSpaceMembers Hook
 *
 * Member list, admin actions, and role detection for a space.
 */

import { useState, useEffect, useCallback } from 'react'
import type { SpaceMember } from '../lib/spaceTypes'
import { getSpaceMembership } from '../lib/spaceStorage'
import {
  getSpaceMembers,
  removeSpaceMember,
} from '../lib/firestoreSpaces'

export interface UseSpaceMembersReturn {
  members: SpaceMember[]
  isLoading: boolean
  error: string | null
  isAdmin: boolean
  currentMemberId: string | null
  removeMember: (memberId: string) => Promise<void>
  refresh: () => Promise<void>
}

export const useSpaceMembers = (spaceId: string | null): UseSpaceMembersReturn => {
  const [members, setMembers] = useState<SpaceMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const membership = spaceId ? getSpaceMembership(spaceId) : null
  const isAdmin = membership?.role === 'admin'
  const currentMemberId = membership?.memberId ?? null

  const loadMembers = useCallback(async () => {
    if (!spaceId) return

    setIsLoading(true)
    try {
      const result = await getSpaceMembers(spaceId)
      setMembers(result)
    } catch (err) {
      console.error('Error loading members:', err)
      setError('Failed to load members')
    } finally {
      setIsLoading(false)
    }
  }, [spaceId])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!spaceId || !isAdmin) return

      try {
        await removeSpaceMember(spaceId, memberId)
        await loadMembers()
      } catch (err) {
        console.error('Error removing member:', err)
        setError('Failed to remove member')
      }
    },
    [spaceId, isAdmin, loadMembers]
  )

  return {
    members,
    isLoading,
    error,
    isAdmin,
    currentMemberId,
    removeMember,
    refresh: loadMembers,
  }
}
