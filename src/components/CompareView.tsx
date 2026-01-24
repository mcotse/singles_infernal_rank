import { useMemo } from 'react'
import type { Snapshot } from '../lib/types'
import { wobbly } from '../styles/wobbly'
import { MovementIndicator } from './MovementIndicator'

export interface CompareViewProps {
  /** Left snapshot (usually earlier episode) */
  leftSnapshot: Snapshot
  /** Right snapshot (usually later episode) */
  rightSnapshot: Snapshot
  /** Map of thumbnailKey to blob URL */
  thumbnailUrls: Record<string, string>
}

/**
 * Compute movement between two snapshots
 */
const computeMovement = (
  leftSnapshot: Snapshot,
  rightSnapshot: Snapshot
): Map<string, { leftRank: number | null; rightRank: number | null; movement: number | null; isNew: boolean }> => {
  const result = new Map<string, { leftRank: number | null; rightRank: number | null; movement: number | null; isNew: boolean }>()

  const leftMap = new Map(leftSnapshot.rankings.map((r) => [r.cardId, r.rank]))
  const rightMap = new Map(rightSnapshot.rankings.map((r) => [r.cardId, r.rank]))

  // All card IDs from both snapshots
  const allCardIds = new Set([...leftMap.keys(), ...rightMap.keys()])

  for (const cardId of allCardIds) {
    const leftRank = leftMap.get(cardId) ?? null
    const rightRank = rightMap.get(cardId) ?? null

    let movement: number | null = null
    let isNew = false

    if (leftRank !== null && rightRank !== null) {
      movement = leftRank - rightRank // positive = moved up in right
    } else if (leftRank === null && rightRank !== null) {
      isNew = true
    }

    result.set(cardId, { leftRank, rightRank, movement, isNew })
  }

  return result
}

/**
 * RankingColumn Component
 * One side of the comparison
 */
const RankingColumn = ({
  snapshot,
  thumbnailUrls,
  movements,
  showMovement,
}: {
  snapshot: Snapshot
  thumbnailUrls: Record<string, string>
  movements: Map<string, { leftRank: number | null; rightRank: number | null; movement: number | null; isNew: boolean }>
  showMovement: boolean
}) => {
  return (
    <div className="flex-1 min-w-0">
      {/* Column Header */}
      <div
        className="
          sticky top-0 z-10
          bg-[#e5e0d8]
          border-b-[3px] border-[#2d2d2d]
          p-2 text-center
        "
      >
        <div
          className="text-sm font-bold text-[#2d2d2d] truncate"
          style={{ fontFamily: "'Kalam', cursive" }}
        >
          {snapshot.label}
        </div>
        <div
          className="text-xs text-[#9a958d]"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          Ep. {snapshot.episodeNumber}
        </div>
      </div>

      {/* Rankings List */}
      <div className="divide-y divide-[#e5e0d8]">
        {snapshot.rankings.map((entry) => {
          const movement = movements.get(entry.cardId)
          const thumbnailUrl = entry.thumbnailKey ? thumbnailUrls[entry.thumbnailKey] : null

          return (
            <div
              key={entry.cardId}
              className="flex items-center gap-2 p-2 bg-white"
            >
              {/* Rank Badge */}
              <div
                className="
                  flex-shrink-0
                  w-6 h-6
                  flex items-center justify-center
                  bg-[#e5e0d8]
                  border-2 border-[#2d2d2d]
                  text-xs font-bold
                "
                style={{
                  fontFamily: "'Kalam', cursive",
                  borderRadius: wobbly.circle,
                }}
              >
                {entry.rank}
              </div>

              {/* Thumbnail */}
              {thumbnailUrl ? (
                <div
                  className="
                    flex-shrink-0
                    w-8 h-8
                    overflow-hidden
                    border-2 border-[#2d2d2d]
                  "
                  style={{ borderRadius: wobbly.circle }}
                >
                  <img
                    src={thumbnailUrl}
                    alt={entry.cardName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="
                    flex-shrink-0
                    w-8 h-8
                    bg-[#e5e0d8]
                    border-2 border-[#2d2d2d]
                    flex items-center justify-center
                    text-xs
                  "
                  style={{ borderRadius: wobbly.circle }}
                >
                  👤
                </div>
              )}

              {/* Name */}
              <div
                className="flex-1 min-w-0 truncate text-sm text-[#2d2d2d]"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                {entry.cardName}
              </div>

              {/* Movement Indicator (only on right column) */}
              {showMovement && movement && (
                <MovementIndicator
                  movement={movement.movement}
                  isNew={movement.isNew}
                  size="sm"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * CompareView Component
 *
 * Split-screen comparison of two episode snapshots.
 * Shows rankings side by side with movement indicators.
 */
export const CompareView = ({
  leftSnapshot,
  rightSnapshot,
  thumbnailUrls,
}: CompareViewProps) => {
  const movements = useMemo(
    () => computeMovement(leftSnapshot, rightSnapshot),
    [leftSnapshot, rightSnapshot]
  )

  return (
    <div
      className="
        flex
        border-[3px] border-[#2d2d2d]
        shadow-[4px_4px_0px_0px_#2d2d2d]
        overflow-hidden
        bg-white
      "
      style={{ borderRadius: wobbly.lg }}
    >
      {/* Left Column */}
      <RankingColumn
        snapshot={leftSnapshot}
        thumbnailUrls={thumbnailUrls}
        movements={movements}
        showMovement={false}
      />

      {/* Divider */}
      <div className="w-[3px] bg-[#2d2d2d] flex-shrink-0" />

      {/* Right Column */}
      <RankingColumn
        snapshot={rightSnapshot}
        thumbnailUrls={thumbnailUrls}
        movements={movements}
        showMovement={true}
      />
    </div>
  )
}
