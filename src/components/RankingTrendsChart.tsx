import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Snapshot } from '../lib/types'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'

/** Expanded thumbnail state for hover/tap enlargement */
interface ExpandedThumbnail {
  cardId: string
  url: string
  x: number
  y: number
}

export interface RankingTrendsChartProps {
  snapshots: Snapshot[]
  /** Map of thumbnailKey to blob URL for contestant photos */
  thumbnailUrls?: Record<string, string>
}

interface TrajectoryData {
  cardId: string
  cardName: string
  thumbnailKey: string | null
  points: { episode: number; rank: number | null }[]
  color: string
}

// Hand-drawn color palette for lines
const LINE_COLORS = [
  '#2d5da1', // Blue
  '#ff4d4d', // Red
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
]

/**
 * Generate a slightly wobbly SVG path for hand-drawn effect
 */
const generateWobblyPath = (
  points: { x: number; y: number }[],
  wobbleAmount: number = 2
): string => {
  if (points.length < 2) return ''

  // Add slight randomness to control points for hand-drawn feel
  const seed = points[0].x + points[0].y // Deterministic seed
  const wobble = (i: number) => {
    const pseudo = Math.sin(seed + i * 123.456) * wobbleAmount
    return pseudo
  }

  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]

    // Use quadratic bezier with slight wobble for hand-drawn effect
    const cpX = (prev.x + curr.x) / 2 + wobble(i)
    const cpY = (prev.y + curr.y) / 2 + wobble(i + 1)

    path += ` Q ${cpX} ${cpY} ${curr.x} ${curr.y}`
  }

  return path
}

/**
 * RankingTrendsChart Component
 *
 * Displays ranking trajectories over episodes as a line chart
 * with hand-drawn aesthetic styling.
 */
export const RankingTrendsChart = ({ snapshots, thumbnailUrls = {} }: RankingTrendsChartProps) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [expandedThumbnail, setExpandedThumbnail] = useState<ExpandedThumbnail | null>(null)

  // Process snapshots into trajectory data
  const { trajectories, maxRank, episodes } = useMemo(() => {
    if (snapshots.length === 0) {
      return { trajectories: [], maxRank: 1, episodes: [] }
    }

    // Get all unique cards across all snapshots
    const cardMap = new Map<string, { cardId: string; cardName: string; thumbnailKey: string | null }>()
    snapshots.forEach((snapshot) => {
      snapshot.rankings.forEach((entry) => {
        if (!cardMap.has(entry.cardId)) {
          cardMap.set(entry.cardId, {
            cardId: entry.cardId,
            cardName: entry.cardName,
            thumbnailKey: entry.thumbnailKey,
          })
        }
      })
    })

    // Find max rank across all snapshots
    let maxRank = 1
    snapshots.forEach((snapshot) => {
      snapshot.rankings.forEach((entry) => {
        if (entry.rank > maxRank) maxRank = entry.rank
      })
    })

    // Build trajectory for each card
    const trajectories: TrajectoryData[] = []
    let colorIndex = 0

    cardMap.forEach(({ cardId, cardName, thumbnailKey }) => {
      const points = snapshots.map((snapshot) => {
        const entry = snapshot.rankings.find((r) => r.cardId === cardId)
        return {
          episode: snapshot.episodeNumber,
          rank: entry?.rank ?? null,
        }
      })

      trajectories.push({
        cardId,
        cardName,
        thumbnailKey,
        points,
        color: LINE_COLORS[colorIndex % LINE_COLORS.length],
      })
      colorIndex++
    })

    // Sort by final rank (or average rank if no final)
    // Use reverse().find() instead of findLast() for ES2022 compatibility
    trajectories.sort((a, b) => {
      const aLastRank = [...a.points].reverse().find((p) => p.rank !== null)?.rank ?? 999
      const bLastRank = [...b.points].reverse().find((p) => p.rank !== null)?.rank ?? 999
      return aLastRank - bLastRank
    })

    const episodes = snapshots.map((s) => s.episodeNumber)

    return { trajectories, maxRank, episodes }
  }, [snapshots])

  // Chart dimensions
  const chartWidth = 350
  const chartHeight = 280
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  // Scale functions
  const xScale = (episode: number): number => {
    const minEp = Math.min(...episodes)
    const maxEp = Math.max(...episodes)
    if (maxEp === minEp) return padding.left + innerWidth / 2
    return padding.left + ((episode - minEp) / (maxEp - minEp)) * innerWidth
  }

  const yScale = (rank: number): number => {
    // Invert so rank 1 is at top
    // Handle edge case where maxRank === 1 to avoid division by zero
    if (maxRank <= 1) return padding.top + innerHeight / 2
    return padding.top + ((rank - 1) / (maxRank - 1)) * innerHeight
  }

  // Toggle card selection
  const toggleCardSelection = (cardId: string) => {
    setSelectedCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  // Determine if a line should be highlighted
  const isHighlighted = (cardId: string): boolean => {
    if (selectedCards.size === 0 && !hoveredCard) return true
    if (hoveredCard === cardId) return true
    if (selectedCards.has(cardId)) return true
    return false
  }

  if (snapshots.length === 0) {
    return (
      <div
        className="text-center py-12 text-[#9a958d]"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        <div className="text-4xl mb-4">📈</div>
        <p>Save episode snapshots to see ranking trends!</p>
      </div>
    )
  }

  if (snapshots.length === 1) {
    return (
      <div
        className="text-center py-12 text-[#9a958d]"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        <div className="text-4xl mb-4">📈</div>
        <p>Save at least 2 episodes to see trends!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Chart Container */}
      <div
        className="bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0px_0px_#2d2d2d] p-4"
        style={{ borderRadius: wobbly.md }}
      >
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y-axis (Rank) */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            stroke="#2d2d2d"
            strokeWidth={2}
          />

          {/* X-axis (Episodes) */}
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#2d2d2d"
            strokeWidth={2}
          />

          {/* Y-axis labels (ranks) */}
          {Array.from({ length: maxRank }, (_, i) => i + 1).map((rank) => (
            <g key={`rank-${rank}`}>
              <text
                x={padding.left - 8}
                y={yScale(rank) + 4}
                textAnchor="end"
                fill="#9a958d"
                fontSize={12}
                fontFamily="'Patrick Hand', cursive"
              >
                {rank}
              </text>
              {/* Grid line */}
              <line
                x1={padding.left}
                y1={yScale(rank)}
                x2={chartWidth - padding.right}
                y2={yScale(rank)}
                stroke="#e5e0d8"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            </g>
          ))}

          {/* X-axis labels (episodes) */}
          {episodes.map((ep) => (
            <text
              key={`ep-${ep}`}
              x={xScale(ep)}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              fill="#9a958d"
              fontSize={12}
              fontFamily="'Patrick Hand', cursive"
            >
              Ep {ep}
            </text>
          ))}

          {/* Trajectory lines */}
          {trajectories.map((traj) => {
            const validPoints = traj.points
              .filter((p) => p.rank !== null)
              .map((p) => ({
                x: xScale(p.episode),
                y: yScale(p.rank!),
              }))

            if (validPoints.length < 2) return null

            const highlighted = isHighlighted(traj.cardId)
            const path = generateWobblyPath(validPoints, 1.5)
            const thumbnailUrl = traj.thumbnailKey ? thumbnailUrls[traj.thumbnailKey] : null
            const endPoint = validPoints[validPoints.length - 1]
            const thumbnailSize = highlighted ? 24 : 20

            return (
              <g key={traj.cardId}>
                {/* Line */}
                <motion.path
                  d={path}
                  fill="none"
                  stroke={traj.color}
                  strokeWidth={highlighted ? 3 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: highlighted ? 1 : 0.2,
                  }}
                  transition={{
                    pathLength: { duration: 0.8, ease: 'easeOut' },
                    opacity: { duration: 0.2 },
                  }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredCard(traj.cardId)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => toggleCardSelection(traj.cardId)}
                />

                {/* Data points (except last one if thumbnail exists) */}
                {validPoints.map((point, i) => {
                  const isLastPoint = i === validPoints.length - 1

                  // Skip last point if we have a thumbnail - we'll render it separately
                  if (isLastPoint && thumbnailUrl) return null

                  return (
                    <motion.circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r={highlighted ? 5 : 3}
                      fill={traj.color}
                      stroke="#2d2d2d"
                      strokeWidth={1.5}
                      initial={{ scale: 0 }}
                      animate={{
                        scale: 1,
                        opacity: highlighted ? 1 : 0.3,
                      }}
                      transition={{
                        ...springConfig.bouncy,
                        delay: i * 0.1,
                      }}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredCard(traj.cardId)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => toggleCardSelection(traj.cardId)}
                    />
                  )
                })}

                {/* End node thumbnail */}
                {thumbnailUrl && (
                  <motion.g
                    initial={{ scale: 0 }}
                    animate={{
                      scale: 1,
                      opacity: highlighted ? 1 : 0.4,
                    }}
                    transition={{
                      ...springConfig.bouncy,
                      delay: (validPoints.length - 1) * 0.1,
                    }}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => {
                      setHoveredCard(traj.cardId)
                      setExpandedThumbnail({
                        cardId: traj.cardId,
                        url: thumbnailUrl,
                        x: endPoint.x,
                        y: endPoint.y,
                      })
                    }}
                    onMouseLeave={() => {
                      setHoveredCard(null)
                      setExpandedThumbnail(null)
                    }}
                    onClick={() => toggleCardSelection(traj.cardId)}
                  >
                    {/* Circular thumbnail at end point */}
                    <circle
                      cx={endPoint.x}
                      cy={endPoint.y}
                      r={thumbnailSize / 2 + 2}
                      fill={traj.color}
                      stroke="#2d2d2d"
                      strokeWidth={2}
                    />
                    <clipPath id={`end-clip-${traj.cardId}`}>
                      <circle cx={endPoint.x} cy={endPoint.y} r={thumbnailSize / 2} />
                    </clipPath>
                    <image
                      href={thumbnailUrl}
                      x={endPoint.x - thumbnailSize / 2}
                      y={endPoint.y - thumbnailSize / 2}
                      width={thumbnailSize}
                      height={thumbnailSize}
                      clipPath={`url(#end-clip-${traj.cardId})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </motion.g>
                )}

              </g>
            )
          })}

          {/* Axis labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 5}
            textAnchor="middle"
            fill="#2d2d2d"
            fontSize={14}
            fontFamily="'Kalam', cursive"
            fontWeight={700}
          >
            Episode
          </text>
          <text
            x={12}
            y={chartHeight / 2}
            textAnchor="middle"
            fill="#2d2d2d"
            fontSize={14}
            fontFamily="'Kalam', cursive"
            fontWeight={700}
            transform={`rotate(-90, 12, ${chartHeight / 2})`}
          >
            Rank
          </text>

          {/* Expanded thumbnail overlay */}
          <AnimatePresence>
            {expandedThumbnail && (() => {
              const expandedRadius = 48
              const imageRadius = expandedRadius - 4
              const shadowOffset = 5

              // Calculate position with proper boundary clamping
              // Ensure the expanded thumbnail + shadow stays within the viewBox
              const minX = padding.left + expandedRadius
              const maxX = chartWidth - padding.right - expandedRadius - shadowOffset
              const minY = padding.top + expandedRadius
              const maxY = chartHeight - padding.bottom - expandedRadius - shadowOffset

              const expandedX = Math.max(minX, Math.min(expandedThumbnail.x, maxX))
              const expandedY = Math.max(minY, Math.min(expandedThumbnail.y, maxY))

              return (
                <motion.g
                  key={`expanded-${expandedThumbnail.cardId}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                  style={{ pointerEvents: 'none' }}
                >
                  <defs>
                    <clipPath id={`expanded-clip-${expandedThumbnail.cardId}`}>
                      <circle cx={expandedX} cy={expandedY} r={imageRadius} />
                    </clipPath>
                  </defs>
                  {/* Shadow effect - rendered first (behind) */}
                  <circle
                    cx={expandedX + shadowOffset}
                    cy={expandedY + shadowOffset}
                    r={expandedRadius}
                    fill="#2d2d2d"
                  />
                  {/* White background circle */}
                  <circle
                    cx={expandedX}
                    cy={expandedY}
                    r={expandedRadius}
                    fill="white"
                    stroke="#2d2d2d"
                    strokeWidth={3}
                  />
                  {/* Clipped image */}
                  <image
                    href={expandedThumbnail.url}
                    x={expandedX - imageRadius}
                    y={expandedY - imageRadius}
                    width={imageRadius * 2}
                    height={imageRadius * 2}
                    clipPath={`url(#expanded-clip-${expandedThumbnail.cardId})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </motion.g>
              )
            })()}
          </AnimatePresence>
        </svg>
      </div>

      {/* Legend */}
      <div
        className="bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0px_0px_#2d2d2d] p-3"
        style={{ borderRadius: wobbly.md }}
      >
        <h3
          className="text-sm text-[#9a958d] mb-2"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          Tap to highlight:
        </h3>
        <div className="flex flex-wrap gap-2">
          {trajectories.map((traj) => {
            const isSelected = selectedCards.has(traj.cardId)
            const isHovered = hoveredCard === traj.cardId

            const thumbnailUrl = traj.thumbnailKey ? thumbnailUrls[traj.thumbnailKey] : null

            return (
              <motion.button
                key={traj.cardId}
                type="button"
                onClick={() => toggleCardSelection(traj.cardId)}
                onMouseEnter={() => setHoveredCard(traj.cardId)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`
                  flex items-center gap-1.5
                  px-2 py-1
                  border-2 border-[#2d2d2d]
                  text-sm
                  transition-all duration-100
                  ${isSelected || isHovered
                    ? 'shadow-[2px_2px_0px_0px_#2d2d2d] bg-[#fff9c4]'
                    : 'shadow-[2px_2px_0px_0px_#2d2d2d] bg-white'
                  }
                `}
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  borderRadius: wobbly.pill,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Thumbnail or colored dot */}
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={traj.cardName}
                    className="w-6 h-6 rounded-full border border-[#2d2d2d] object-cover"
                  />
                ) : (
                  <span
                    className="w-3 h-3 rounded-full border border-[#2d2d2d]"
                    style={{ backgroundColor: traj.color }}
                  />
                )}
                <span className="truncate max-w-[80px]">{traj.cardName}</span>
              </motion.button>
            )
          })}
        </div>
        {selectedCards.size > 0 && (
          <button
            type="button"
            onClick={() => setSelectedCards(new Set())}
            className="mt-2 text-xs text-[#9a958d] hover:text-[#2d2d2d] underline"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  )
}
