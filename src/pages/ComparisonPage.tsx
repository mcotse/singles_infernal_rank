/**
 * ComparisonPage Component
 *
 * Side-by-side comparison view showing your ranking vs friend's ranking.
 * Features:
 * - Agreement percentage at the top
 * - Both users' names/avatars
 * - Aligned items showing rank positions
 * - "Not ranked" indicators for items only in one board
 */

import { motion } from 'framer-motion'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'
import type { AlignedComparisonItem } from '../hooks/useComparison'

export interface ComparisonPageProps {
  /** Board name being compared */
  boardName: string
  /** Your display name */
  yourName: string
  /** Your avatar URL */
  yourAvatarUrl: string
  /** Friend's display name */
  friendName: string
  /** Friend's avatar URL */
  friendAvatarUrl: string
  /** Agreement percentage (0-100) */
  agreementPercentage: number
  /** Aligned items for comparison */
  alignedItems: AlignedComparisonItem[]
  /** Called when back button is clicked */
  onBack: () => void
}

/**
 * Get initials from display name for avatar fallback
 */
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return name.slice(0, 1).toUpperCase()
}

/**
 * Avatar component
 */
const Avatar = ({
  src,
  alt,
  size = 'md',
}: {
  src: string
  alt: string
  size?: 'sm' | 'md'
}) => {
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm'
  const initials = getInitials(alt)

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses} object-cover border-2 border-[#2d2d2d]`}
        style={{ borderRadius: wobbly.circle }}
      />
    )
  }

  return (
    <div
      className={`
        ${sizeClasses}
        bg-[#e5e0d8]
        border-2 border-[#2d2d2d]
        flex items-center justify-center
        text-[#2d2d2d]
        font-semibold
      `}
      style={{
        borderRadius: wobbly.circle,
        fontFamily: "'Kalam', cursive",
      }}
    >
      {initials}
    </div>
  )
}

/**
 * Agreement badge component
 */
const AgreementBadge = ({ percentage }: { percentage: number }) => {
  // Color based on agreement level
  const getColor = () => {
    if (percentage >= 80) return { bg: '#dcfce7', border: '#16a34a', text: '#16a34a' }
    if (percentage >= 60) return { bg: '#fef3c7', border: '#d97706', text: '#d97706' }
    return { bg: '#fee2e2', border: '#dc2626', text: '#dc2626' }
  }

  const colors = getColor()

  return (
    <div
      className="
        inline-flex items-center gap-2
        px-4 py-2
        border-2
      "
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderRadius: wobbly.pill,
      }}
    >
      <span className="text-xl">🎯</span>
      <span
        className="text-lg font-semibold"
        style={{
          color: colors.text,
          fontFamily: "'Kalam', cursive",
        }}
      >
        {percentage}% Agreement
      </span>
    </div>
  )
}

/**
 * Rank badge component
 */
const RankBadge = ({ rank }: { rank: number | null }) => {
  if (rank === null) {
    return (
      <span
        className="text-[#2d2d2d]/40 text-sm italic"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        Not ranked
      </span>
    )
  }

  return (
    <span
      className="
        inline-flex items-center justify-center
        w-8 h-8
        bg-[#2d2d2d]
        text-white
        text-sm
        font-semibold
        border-2 border-[#2d2d2d]
      "
      style={{
        borderRadius: wobbly.circle,
        fontFamily: "'Kalam', cursive",
      }}
    >
      #{rank}
    </span>
  )
}

/**
 * Comparison row component
 */
const ComparisonRow = ({
  item,
  index,
}: {
  item: AlignedComparisonItem
  index: number
}) => {
  // Highlight differences
  const isDifferent =
    item.yourRank !== null &&
    item.friendRank !== null &&
    item.yourRank !== item.friendRank

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfig.default, delay: index * 0.03 }}
      className={`
        flex items-center
        p-3
        bg-white
        border-[3px] border-[#2d2d2d]
        ${isDifferent ? 'shadow-[4px_4px_0px_0px_#ff4d4d]' : 'shadow-[4px_4px_0px_0px_#2d2d2d]'}
      `}
      style={{ borderRadius: wobbly.sm }}
    >
      {/* Your rank */}
      <div className="w-16 flex justify-center">
        <RankBadge rank={item.yourRank} />
      </div>

      {/* Item name (centered) */}
      <div className="flex-1 text-center">
        <p
          className="text-[#2d2d2d] font-semibold truncate px-2"
          style={{ fontFamily: "'Kalam', cursive" }}
        >
          {item.name}
        </p>
      </div>

      {/* Friend's rank */}
      <div className="w-16 flex justify-center">
        <RankBadge rank={item.friendRank} />
      </div>
    </motion.div>
  )
}

export const ComparisonPage = ({
  boardName,
  yourName,
  yourAvatarUrl,
  friendName,
  friendAvatarUrl,
  agreementPercentage,
  alignedItems,
  onBack,
}: ComparisonPageProps) => {
  return (
    <div className="p-4">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="
          mb-4 px-3 py-2
          text-[#2d2d2d]
          border-2 border-[#2d2d2d]
          bg-white
          hover:bg-[#e5e0d8]
          transition-colors
        "
        style={{
          borderRadius: wobbly.sm,
          fontFamily: "'Patrick Hand', cursive",
        }}
        aria-label="Back"
      >
        ← Back
      </button>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig.default}
        className="
          mb-6 p-4
          bg-white
          border-[3px] border-[#2d2d2d]
          shadow-[4px_4px_0px_0px_#2d2d2d]
        "
        style={{ borderRadius: wobbly.md }}
      >
        {/* Board name */}
        <h1
          className="text-2xl text-[#2d2d2d] text-center mb-4"
          style={{
            fontFamily: "'Kalam', cursive",
            fontWeight: 700,
          }}
        >
          {boardName}
        </h1>

        {/* Users comparison */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex flex-col items-center">
            <Avatar src={yourAvatarUrl} alt={yourName} />
            <span
              className="mt-1 text-sm text-[#2d2d2d]"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              You
            </span>
          </div>

          <span
            className="text-[#2d2d2d]/60 text-xl"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            vs
          </span>

          <div className="flex flex-col items-center">
            <Avatar src={friendAvatarUrl} alt={friendName} />
            <span
              className="mt-1 text-sm text-[#2d2d2d] truncate max-w-[80px]"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              {friendName}
            </span>
          </div>
        </div>

        {/* Agreement percentage */}
        <div className="flex justify-center">
          <AgreementBadge percentage={agreementPercentage} />
        </div>
      </motion.div>

      {/* Column headers */}
      <div className="flex items-center mb-3 px-3">
        <div className="w-16 text-center">
          <span
            className="text-xs text-[#2d2d2d]/60 uppercase tracking-wide"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            You
          </span>
        </div>
        <div className="flex-1 text-center">
          <span
            className="text-xs text-[#2d2d2d]/60 uppercase tracking-wide"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Item
          </span>
        </div>
        <div className="w-16 text-center">
          <span
            className="text-xs text-[#2d2d2d]/60 uppercase tracking-wide"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            {friendName.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Comparison rows */}
      <div className="space-y-3">
        {alignedItems.map((item, index) => (
          <ComparisonRow key={item.id} item={item} index={index} />
        ))}
      </div>

      {/* Empty state */}
      {alignedItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig.default}
          className="
            p-6 text-center
            bg-white
            border-[3px] border-[#2d2d2d]
            shadow-[4px_4px_0px_0px_#2d2d2d]
          "
          style={{ borderRadius: wobbly.md }}
        >
          <p
            className="text-[#2d2d2d]/70"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            No items to compare
          </p>
        </motion.div>
      )}
    </div>
  )
}
