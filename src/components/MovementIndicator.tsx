import { wobbly } from '../styles/wobbly'

export interface MovementIndicatorProps {
  /** Movement value: positive = moved up, negative = moved down, null = no data */
  movement: number | null
  /** Whether this is a new entry */
  isNew?: boolean
  /** Size variant */
  size?: 'sm' | 'md'
}

/**
 * MovementIndicator Component
 *
 * Shows rank change with colored arrows:
 * - Green up arrow for improvements (moved to lower rank number)
 * - Red down arrow for drops (moved to higher rank number)
 * - Gray dash for no change
 * - Yellow "NEW" badge for new entries
 */
export const MovementIndicator = ({
  movement,
  isNew = false,
  size = 'sm',
}: MovementIndicatorProps) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'

  // New entry
  if (isNew) {
    return (
      <span
        className={`
          inline-flex items-center
          bg-[#fff9c4] text-[#2d2d2d]
          border-2 border-[#2d2d2d]
          font-bold
          ${sizeClasses}
        `}
        style={{
          fontFamily: "'Patrick Hand', cursive",
          borderRadius: wobbly.pill,
        }}
      >
        NEW
      </span>
    )
  }

  // No movement data or no change
  if (movement === null || movement === 0) {
    return (
      <span
        className={`
          inline-flex items-center justify-center
          text-[#9a958d]
          ${sizeClasses}
        `}
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        —
      </span>
    )
  }

  // Moved up (positive movement = lower rank number = better)
  if (movement > 0) {
    return (
      <span
        className={`
          inline-flex items-center gap-0.5
          text-[#2d5da1]
          font-bold
          ${sizeClasses}
        `}
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        <span className="text-[#2d5da1]">▲</span>
        {movement}
      </span>
    )
  }

  // Moved down (negative movement = higher rank number = worse)
  return (
    <span
      className={`
        inline-flex items-center gap-0.5
        text-[#ff4d4d]
        font-bold
        ${sizeClasses}
      `}
      style={{ fontFamily: "'Patrick Hand', cursive" }}
    >
      <span className="text-[#ff4d4d]">▼</span>
      {Math.abs(movement)}
    </span>
  )
}
