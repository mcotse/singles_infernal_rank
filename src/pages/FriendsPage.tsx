/**
 * FriendsPage Component
 *
 * Social features hub showing:
 * - Sign-in prompt when not authenticated
 * - Username setup modal for new users
 * - Sync migration modal for first-time sync
 * - Templates section for creating boards
 * - Friends list with navigation to profiles
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useBoards } from '../hooks/useBoards'
import { useBoardSync } from '../hooks/useBoardSync'
import { useFriends } from '../hooks/useFriends'
import { useFriendBoards } from '../hooks/useFriendBoards'
import { useTemplates } from '../hooks/useTemplates'
import { UsernameSetupModal } from '../components/modals/UsernameSetupModal'
import { SyncMigrationModal } from '../components/modals/SyncMigrationModal'
import { FriendCard } from '../components/FriendCard'
import { FriendRequestCard } from '../components/FriendRequestCard'
import { UserSearchSection } from '../components/UserSearchSection'
import { TemplateCard } from '../components/TemplateCard'
import { Button } from '../components/ui/Button'
import { FriendProfilePage } from './FriendProfilePage'
import { TemplatePickerPage } from './TemplatePickerPage'
import { createBoardFromTemplate } from '../lib/firestoreTemplates'
import type { BoardTemplate } from '../lib/socialTypes'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'

// Key for tracking if user has seen/dismissed sync modal
const SYNC_DISMISSED_KEY = 'singles-infernal-rank:sync-dismissed'

// Navigation state types
type SubPage =
  | { type: 'main' }
  | { type: 'friend-profile'; friendId: string }
  | { type: 'templates' }

export const FriendsPage = () => {
  const {
    user,
    profile,
    isLoading,
    error,
    needsUsername,
    signIn,
    createProfile,
    isMockAuth,
  } = useAuth()

  const { boards, refresh: refreshBoards } = useBoards()
  const {
    status: syncStatus,
    error: syncError,
    lastSyncedAt,
    isSyncing,
    syncAll,
  } = useBoardSync({ userId: user?.uid ?? null })

  // Friends data
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    isLoading: isFriendsLoading,
    pendingCount,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockFriend,
  } = useFriends({ userId: user?.uid ?? null })

  // Templates data
  const { templates } = useTemplates()

  // Get friend IDs for board fetching
  const friendIds = useMemo(
    () => friends.map((f) => f.profile.uid),
    [friends]
  )

  // Friend boards data
  const { sharedBoardCounts } = useFriendBoards({
    userId: user?.uid ?? null,
    friendIds,
  })

  // Navigation state
  const [subPage, setSubPage] = useState<SubPage>({ type: 'main' })

  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [syncDismissed, setSyncDismissed] = useState(() => {
    return localStorage.getItem(SYNC_DISMISSED_KEY) === 'true'
  })
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)

  // Check if we should show sync modal
  // Show when: user is signed in, has profile, has local boards, never synced, and hasn't dismissed
  const shouldShowSyncModal =
    user !== null &&
    profile !== null &&
    !needsUsername &&
    boards.length > 0 &&
    lastSyncedAt === null &&
    !syncDismissed &&
    syncStatus !== 'synced'

  // Update showSyncModal when conditions change
  useEffect(() => {
    setShowSyncModal(shouldShowSyncModal)
  }, [shouldShowSyncModal])

  // Handle sync action
  const handleSync = useCallback(async () => {
    await syncAll(boards)
    setShowSyncModal(false)
    refreshBoards()
  }, [syncAll, boards, refreshBoards])

  // Handle skip sync
  const handleSkipSync = useCallback(() => {
    localStorage.setItem(SYNC_DISMISSED_KEY, 'true')
    setSyncDismissed(true)
    setShowSyncModal(false)
  }, [])

  // Handle username submission
  const handleUsernameSubmit = useCallback(
    async (username: string): Promise<void> => {
      setIsCreatingProfile(true)
      await createProfile(username)
      setIsCreatingProfile(false)
    },
    [createProfile]
  )

  // Handle accept friend request
  const handleAcceptRequest = useCallback(
    async (friendshipId: string) => {
      setProcessingRequestId(friendshipId)
      await acceptRequest(friendshipId)
      setProcessingRequestId(null)
    },
    [acceptRequest]
  )

  // Handle decline friend request
  const handleDeclineRequest = useCallback(
    async (friendshipId: string) => {
      setProcessingRequestId(friendshipId)
      await declineRequest(friendshipId)
      setProcessingRequestId(null)
    },
    [declineRequest]
  )

  // Handle view friend profile
  const handleViewFriend = useCallback((uid: string) => {
    setSubPage({ type: 'friend-profile', friendId: uid })
  }, [])

  // Handle back to main
  const handleBackToMain = useCallback(() => {
    setSubPage({ type: 'main' })
  }, [])

  // Handle view all templates
  const handleViewTemplates = useCallback(() => {
    setSubPage({ type: 'templates' })
  }, [])

  // Handle template selection
  const handleSelectTemplate = useCallback(
    (template: BoardTemplate) => {
      // Create board from template
      createBoardFromTemplate(template)
      refreshBoards()
      // Navigate back to main (or could navigate to the new board)
      setSubPage({ type: 'main' })
    },
    [refreshBoards]
  )

  // Handle viewing a friend's board (placeholder - would navigate to board detail)
  const handleViewBoard = useCallback((boardId: string) => {
    console.log('View board:', boardId)
    // TODO: Navigate to board detail page
  }, [])

  // Render sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig.default}
          className="
            w-full max-w-sm
            bg-white
            border-[3px] border-[#2d2d2d]
            shadow-[4px_4px_0px_0px_#2d2d2d]
            p-6
            text-center
          "
          style={{ borderRadius: wobbly.lg }}
        >
          {/* Icon */}
          <div
            className="
              w-20 h-20 mx-auto mb-4
              bg-[#e5e0d8]
              border-[3px] border-[#2d2d2d]
              flex items-center justify-center
              text-4xl
            "
            style={{ borderRadius: wobbly.circle }}
          >
            <span role="img" aria-label="friends">
              👥
            </span>
          </div>

          {/* Title */}
          <h2
            className="text-2xl text-[#2d2d2d] mb-2"
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 700,
            }}
          >
            Sign In to Connect
          </h2>

          {/* Description */}
          <p
            className="text-[#2d2d2d]/70 mb-6"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Share your rankings, add friends, and see how your tastes compare
          </p>

          {/* Error message */}
          {error && (
            <div
              className="mb-4 p-3 bg-[#ff4d4d]/10 border-2 border-[#ff4d4d] text-[#ff4d4d]"
              style={{
                borderRadius: wobbly.sm,
                fontFamily: "'Patrick Hand', cursive",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Sign in button */}
          <Button
            onClick={signIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              'Signing in...'
            ) : (
              <>
                <GoogleIcon />
                Sign in with Google
              </>
            )}
          </Button>

          {/* Privacy note */}
          <p
            className="mt-4 text-xs text-[#2d2d2d]/50"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Your boards stay private until you choose to share them
          </p>

          {/* Dev mode indicator */}
          {isMockAuth && (
            <div
              className="mt-4 p-2 bg-[#fff9c4] border-2 border-dashed border-[#2d2d2d]/30"
              style={{ borderRadius: wobbly.sm }}
            >
              <p
                className="text-xs text-[#2d2d2d]/70 text-center"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                🧪 Dev Mode: Using mock auth (no Firebase needed)
              </p>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // Render subpages
  if (subPage.type === 'friend-profile') {
    return (
      <FriendProfilePage
        friendId={subPage.friendId}
        currentUserId={user.uid}
        friendIds={friendIds}
        onBack={handleBackToMain}
        onViewBoard={handleViewBoard}
        onUnfriend={removeFriend}
        onBlock={blockFriend}
      />
    )
  }

  if (subPage.type === 'templates') {
    return (
      <TemplatePickerPage
        onBack={handleBackToMain}
        onSelectTemplate={handleSelectTemplate}
      />
    )
  }

  // Render main friends content for authenticated users
  return (
    <div className="p-4">
      {/* Username setup modal - cannot be dismissed until username is set */}
      <UsernameSetupModal
        isOpen={needsUsername}
        onClose={() => {}} // No-op: modal cannot be dismissed, user must complete username setup
        onSubmit={handleUsernameSubmit}
        isLoading={isCreatingProfile}
        error={error}
        allowDismiss={false}
      />

      {/* Sync migration modal - shown after sign-in when user has local boards */}
      <SyncMigrationModal
        isOpen={showSyncModal && !needsUsername}
        boards={boards}
        onSync={handleSync}
        onSkip={handleSkipSync}
        isSyncing={isSyncing}
        error={syncError}
      />

      {/* Friends header with pending badge */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-3xl text-[#2d2d2d]"
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 700,
            }}
          >
            Friends
            {pendingCount > 0 && (
              <span
                className="
                  ml-2 inline-flex items-center justify-center
                  min-w-[24px] h-6 px-2
                  bg-[#ff4d4d] text-white text-sm
                  border-2 border-[#2d2d2d]
                "
                style={{
                  borderRadius: wobbly.sm,
                  fontFamily: "'Patrick Hand', cursive",
                }}
              >
                {pendingCount}
              </span>
            )}
          </h1>
          {profile && (
            <p
              className="text-[#2d2d2d]/70"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              @{profile.username}
            </p>
          )}
        </div>
      </div>

      {/* Templates Section */}
      {templates.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-lg text-[#2d2d2d]"
              style={{
                fontFamily: "'Kalam', cursive",
                fontWeight: 600,
              }}
            >
              Templates
            </h2>
            <button
              type="button"
              onClick={handleViewTemplates}
              className="
                text-sm text-[#2d5da1]
                hover:text-[#2d5da1]/80
                transition-colors
              "
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              View all →
            </button>
          </div>

          {/* Horizontal scrollable templates */}
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
              {templates.slice(0, 3).map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={springConfig.default}
                  className="w-[280px] flex-shrink-0"
                >
                  <TemplateCard
                    template={template}
                    onClick={handleSelectTemplate}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests Section */}
      <AnimatePresence>
        {incomingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <h2
              className="text-lg text-[#2d2d2d] mb-3"
              style={{
                fontFamily: "'Kalam', cursive",
                fontWeight: 600,
              }}
            >
              Friend Requests
            </h2>
            <div className="space-y-3">
              {incomingRequests.map(({ friendship, profile: requesterProfile }) => (
                <motion.div
                  key={friendship.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={springConfig.default}
                >
                  <FriendRequestCard
                    friendshipId={friendship.id}
                    displayName={requesterProfile.displayName}
                    username={requesterProfile.username}
                    avatarUrl={requesterProfile.avatarUrl}
                    onAccept={handleAcceptRequest}
                    onDecline={handleDeclineRequest}
                    isLoading={processingRequestId === friendship.id}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Search Section */}
      {user && (
        <UserSearchSection
          currentUserId={user.uid}
          onSendRequest={sendRequest}
          existingFriendIds={friends.map((f) => f.profile.uid)}
          pendingRequestIds={[
            ...outgoingRequests.map((r) =>
              r.friendship.users[0] === user.uid
                ? r.friendship.users[1]
                : r.friendship.users[0]
            ),
          ]}
        />
      )}

      {/* Friends List */}
      {isFriendsLoading ? (
        <div className="flex justify-center py-8">
          <div
            className="
              w-12 h-12
              border-4 border-[#e5e0d8]
              border-t-[#2d2d2d]
              animate-spin
            "
            style={{ borderRadius: wobbly.circle }}
          />
        </div>
      ) : friends.length > 0 ? (
        <div className="space-y-3">
          <h2
            className="text-lg text-[#2d2d2d] mb-3"
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 600,
            }}
          >
            Your Friends ({friends.length})
          </h2>
          {friends.map(({ friendship, profile: friendProfile }) => (
            <motion.div
              key={friendship.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springConfig.default}
            >
              <FriendCard
                uid={friendProfile.uid}
                displayName={friendProfile.displayName}
                username={friendProfile.username}
                avatarUrl={friendProfile.avatarUrl}
                sharedBoardCount={sharedBoardCounts[friendProfile.uid]}
                onClick={handleViewFriend}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        // Empty state
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig.default}
          className="
            bg-white
            border-[3px] border-[#2d2d2d]
            shadow-[4px_4px_0px_0px_#2d2d2d]
            p-6
            text-center
          "
          style={{ borderRadius: wobbly.md }}
        >
          <div
            className="
              w-16 h-16 mx-auto mb-4
              bg-[#e5e0d8]
              border-[3px] border-[#2d2d2d]
              flex items-center justify-center
              text-3xl
            "
            style={{ borderRadius: wobbly.circle }}
          >
            <span role="img" aria-label="friends">
              👋
            </span>
          </div>

          <h3
            className="text-xl text-[#2d2d2d] mb-2"
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 700,
            }}
          >
            No Friends Yet
          </h3>

          <p
            className="text-[#2d2d2d]/70"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Use the search above to find friends by username
          </p>
        </motion.div>
      )}
    </div>
  )
}

/**
 * Simple Google icon for the sign-in button
 */
const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)
