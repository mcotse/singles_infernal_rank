import { wobbly } from '../styles/wobbly'

export interface TrajectoryBadgeProps {
  /** Trajectory string e.g., "3→1→2→1" */
  trajectory: string
  /** Click handler for expansion (optional) */
  onClick?: () => void
}

/**
 * TrajectoryBadge Component
 *
 * Displays a compact mini-history of rankings like "3→1→2→1"
 * Muted styling to not overwhelm the main ranking display.
 */
export const TrajectoryBadge = ({ trajectory, onClick }: TrajectoryBadgeProps) => {
  if (!trajectory || trajectory === 'New') {
    return null
  }

  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`
        inline-flex items-center
        bg-[#e5e0d8]/50 text-[#9a958d]
        border border-[#e5e0d8]
        text-xs px-2 py-0.5
        ${onClick ? 'hover:bg-[#e5e0d8] hover:text-[#2d2d2d] cursor-pointer transition-colors' : ''}
      `}
      style={{
        fontFamily: "'Patrick Hand', cursive",
        borderRadius: wobbly.pill,
      }}
    >
      {trajectory}
    </Component>
  )
}
