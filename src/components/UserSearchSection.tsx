/**
 * UserSearchSection Component
 *
 * Search for users by username with debounced input.
 * Shows search results with add friend buttons.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from './ui/Input'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'
import { searchUsers } from '../lib/firestoreUsers'
import type { UserProfile } from '../lib/socialTypes'
import type { FriendshipResult } from '../lib/firestoreFriendships'

export interface UserSearchSectionProps {
  /** Current user's ID (to exclude from results) */
  currentUserId: string
  /** Send friend request handler */
  onSendRequest: (uid: string) => Promise<FriendshipResult>
  /** IDs of existing friends (to show "Already Friends") */
  existingFriendIds: string[]
  /** IDs of users with pending requests (to show "Pending") */
  pendingRequestIds: string[]
}

/**
 * Get initials from display name
 */
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return name.slice(0, 1).toUpperCase()
}

/**
 * Debounce hook
 */
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Search result item
 */
const SearchResultItem = ({
  user,
  status,
  onAdd,
  isLoading,
}: {
  user: UserProfile
  status: 'available' | 'friend' | 'pending'
  onAdd: () => void
  isLoading: boolean
}) => {
  const initials = getInitials(user.displayName)

  return (
    <div
      className="
        flex items-center gap-3
        p-3
        bg-white
        border-2 border-[#2d2d2d]
      "
      style={{ borderRadius: wobbly.sm }}
    >
      {/* Avatar */}
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={`${user.displayName}'s avatar`}
          className="w-10 h-10 object-cover border-2 border-[#2d2d2d]"
          style={{ borderRadius: wobbly.circle }}
        />
      ) : (
        <div
          className="
            w-10 h-10
            bg-[#e5e0d8]
            border-2 border-[#2d2d2d]
            flex items-center justify-center
            text-[#2d2d2d]
            font-semibold
            text-sm
          "
          style={{
            borderRadius: wobbly.circle,
            fontFamily: "'Kalam', cursive",
          }}
        >
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[#2d2d2d] font-semibold truncate text-sm"
          style={{ fontFamily: "'Kalam', cursive" }}
        >
          {user.displayName}
        </p>
        <p
          className="text-[#2d2d2d]/60 text-xs truncate"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          @{user.username}
        </p>
      </div>

      {/* Action */}
      {status === 'available' ? (
        <button
          type="button"
          onClick={onAdd}
          disabled={isLoading}
          className="
            px-3 py-1
            bg-[#2d5da1] hover:bg-[#1e4a80]
            text-white text-sm
            border-2 border-[#2d2d2d]
            transition-colors
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
          style={{
            borderRadius: wobbly.sm,
            fontFamily: "'Patrick Hand', cursive",
          }}
        >
          {isLoading ? '...' : 'Add'}
        </button>
      ) : (
        <span
          className="text-[#2d2d2d]/50 text-sm"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          {status === 'friend' ? 'Already Friends' : 'Pending'}
        </span>
      )}
    </div>
  )
}

export const UserSearchSection = ({
  currentUserId,
  onSendRequest,
  existingFriendIds,
  pendingRequestIds,
}: UserSearchSectionProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null)

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300)

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      setHasSearched(false)
      return
    }

    const performSearch = async () => {
      setIsSearching(true)
      try {
        const searchResults = await searchUsers(debouncedQuery, currentUserId)
        setResults(searchResults)
        setHasSearched(true)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [debouncedQuery, currentUserId])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  // Handle send request
  const handleSendRequest = useCallback(
    async (uid: string) => {
      setSendingRequestTo(uid)
      await onSendRequest(uid)
      setSendingRequestTo(null)
    },
    [onSendRequest]
  )

  // Get status for a user
  const getStatus = (uid: string): 'available' | 'friend' | 'pending' => {
    if (existingFriendIds.includes(uid)) return 'friend'
    if (pendingRequestIds.includes(uid)) return 'pending'
    return 'available'
  }

  return (
    <div className="mb-6">
      <h2
        className="text-lg text-[#2d2d2d] mb-3"
        style={{
          fontFamily: "'Kalam', cursive",
          fontWeight: 600,
        }}
      >
        Find Friends
      </h2>

      {/* Search input */}
      <div className="mb-3">
        <Input
          value={query}
          onChange={handleInputChange}
          placeholder="Search by username..."
          aria-label="Search users by username"
        />
      </div>

      {/* Loading indicator */}
      {isSearching && (
        <div className="flex justify-center py-4">
          <div
            className="
              w-8 h-8
              border-3 border-[#e5e0d8]
              border-t-[#2d2d2d]
              animate-spin
            "
            style={{ borderRadius: wobbly.circle }}
          />
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {!isSearching && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springConfig.default}
            className="space-y-2"
          >
            {results.map((user) => (
              <SearchResultItem
                key={user.uid}
                user={user}
                status={getStatus(user.uid)}
                onAdd={() => handleSendRequest(user.uid)}
                isLoading={sendingRequestTo === user.uid}
              />
            ))}
          </motion.div>
        )}

        {/* No results message */}
        {!isSearching && hasSearched && results.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-[#2d2d2d]/60 py-4"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            No users found matching &quot;{query}&quot;
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
