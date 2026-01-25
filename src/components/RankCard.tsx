import { type MouseEvent, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { wobbly } from '../styles/wobbly'
import { colors } from '../styles/tokens'
import { DragHandle } from './DragHandle'
import { getDisplayName } from '../hooks/useDisplayName'

export interface RankCardProps {
  /** Unique card ID */
  id: string
  /** Card name/title */
  name: string
  /** Optional nickname */
  nickname?: string
  /** Current rank position (1-indexed) */
  rank: number
  /** Optional thumbnail URL */
  thumbnailUrl?: string | null
  /** Optional notes text */
  notes?: string
  /** Whether the card is currently being dragged */
  isDragging?: boolean
  /** Whether to display nickname instead of real name */
  useNickname?: boolean
  /** Called when the card body (not handle) is tapped */
  onTap?: (id: string) => void
}

/**
 * Rank badge - hand-drawn circled number
 */
const RankBadge = ({ rank }: { rank: number }) => (
  <div
    data-testid="rank-badge"
    className="
      flex items-center justify-center
      w-8 h-8 min-w-8
      bg-white border-2 border-[#2d2d2d]
      text-[#2d2d2d] text-lg
      shadow-[2px_2px_0px_0px_#2d2d2d]
    "
    style={{
      fontFamily: "'Kalam', cursive",
      fontWeight: 700,
      borderRadius: wobbly.circle,
    }}
  >
    {rank}
  </div>
)

/**
 * Rank decoration - gold/silver/bronze thumbtack for top 3
 */
const RankDecoration = ({ rank }: { rank: number }) => {
  if (rank > 3) return null

  const decorationColor = {
    1: colors.gold,
    2: colors.silver,
    3: colors.bronze,
  }[rank]

  return (
    <div
      data-testid="rank-decoration"
      className={`
        absolute -top-2 -right-2 z-10
        w-5 h-5
        bg-[${decorationColor}]
        border-2 border-[#2d2d2d]
        shadow-[1px_1px_0px_0px_#2d2d2d]
      `}
      style={{
        borderRadius: wobbly.circle,
        backgroundColor: decorationColor,
      }}
    />
  )
}

/**
 * Photo placeholder when no image
 */
const PhotoPlaceholder = () => (
  <div
    data-testid="photo-placeholder"
    className="
      w-14 h-14 min-w-14
      bg-[#e5e0d8]
      border-2 border-[#2d2d2d]
      flex items-center justify-center
      text-[#9a958d] text-2xl
    "
    style={{ borderRadius: wobbly.circle }}
  >
    ?
  </div>
)

/**
 * Expandable card photo thumbnail
 * - Hover (web): enlarges thumbnail
 * - Tap (mobile): enlarges thumbnail
 * - Tap away / mouse leave: returns to original size
 */
const ExpandablePhoto = ({ url, alt }: { url: string; alt: string }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  // Determine if expanded (either by hover on desktop or tap on mobile)
  const showExpanded = isExpanded || isHovering

  // Handle click outside to collapse on mobile
  useEffect(() => {
    if (!isExpanded) return

    const handleClickOutside = (e: Event) => {
      const target = e.target as Element | null
      if (target && !target.closest('[data-expandable-photo]')) {
        setIsExpanded(false)
      }
    }

    // Use capture phase to catch the event before it bubbles
    document.addEventListener('mousedown', handleClickOutside, true)
    document.addEventListener('touchstart', handleClickOutside, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('touchstart', handleClickOutside, true)
    }
  }, [isExpanded])

  const handleTap = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      // Toggle expanded state on tap (for mobile)
      setIsExpanded((prev) => !prev)
    },
    []
  )

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  return (
    <div className="relative" data-expandable-photo>
      {/* Base thumbnail - always visible */}
      <motion.div
        className="
          w-14 h-14 min-w-14
          border-2 border-[#2d2d2d]
          overflow-hidden
          cursor-pointer
        "
        style={{ borderRadius: wobbly.circle }}
        onClick={handleTap}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={url}
          alt={alt}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </motion.div>

      {/* Expanded overlay */}
      <AnimatePresence>
        {showExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
            className="
              absolute z-50
              w-32 h-32
              border-[3px] border-[#2d2d2d]
              shadow-[6px_6px_0px_0px_#2d2d2d]
              overflow-hidden
              pointer-events-none
            "
            style={{
              borderRadius: wobbly.circle,
              // Center the expanded image over the thumbnail
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
            }}
          >
            <img
              src={url}
              alt={alt}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * RankCard Component
 *
 * A draggable card for ranked items showing:
 * - Rank badge (left)
 * - Photo thumbnail
 * - Name and notes
 * - Drag handle (right)
 *
 * Design notes:
 * - Hand-drawn aesthetic with wobbly borders
 * - Top 3 ranks get gold/silver/bronze decorations
 * - Scales up slightly when dragging
 * - Tapping card body opens detail modal
 * - Tapping handle initiates drag
 */
export const RankCard = ({
  id,
  name,
  nickname = '',
  rank,
  thumbnailUrl,
  notes,
  isDragging = false,
  useNickname = false,
  onTap,
}: RankCardProps) => {
  const displayName = getDisplayName({ name, nickname }, useNickname)

  const handleCardTap = (e: MouseEvent) => {
    // Only trigger if clicking the card body, not the handle or expandable photo
    const target = e.target as HTMLElement
    if (target.closest('[data-testid="drag-handle"]')) {
      return
    }
    if (target.closest('[data-expandable-photo]')) {
      return
    }
    onTap?.(id)
  }

  return (
    <div
      data-testid="rank-card"
      className={`
        relative
        bg-white border-[3px] border-[#2d2d2d]
        transition-all duration-150
        ${isDragging
          ? 'scale-105 shadow-[8px_8px_0px_0px_#2d2d2d] rotate-[1deg]'
          : 'shadow-[4px_4px_0px_0px_#2d2d2d]'
        }
      `}
      style={{
        borderRadius: wobbly.md,
      }}
    >
      {/* Top 3 decoration */}
      <RankDecoration rank={rank} />

      <div className="flex items-center gap-2 p-2">
        {/* Rank Badge */}
        <RankBadge rank={rank} />

        {/* Card Body - tappable area */}
        <div
          data-testid="card-body"
          onClick={handleCardTap}
          className="
            flex-1 flex items-center gap-3
            cursor-pointer
            min-w-0
          "
        >
          {/* Photo */}
          {thumbnailUrl ? (
            <ExpandablePhoto url={thumbnailUrl} alt={displayName} />
          ) : (
            <PhotoPlaceholder />
          )}

          {/* Name and Notes */}
          <div className="flex-1 min-w-0 py-1">
            <h3
              className="text-[#2d2d2d] text-lg leading-tight truncate"
              style={{
                fontFamily: "'Patrick Hand', cursive",
              }}
            >
              {displayName}
            </h3>
            {notes && (
              <p
                data-testid="card-notes"
                className="text-[#9a958d] text-sm truncate mt-0.5"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                }}
              >
                {notes}
              </p>
            )}
          </div>
        </div>

        {/* Drag Handle */}
        <DragHandle isDragging={isDragging} />
      </div>
    </div>
  )
}
