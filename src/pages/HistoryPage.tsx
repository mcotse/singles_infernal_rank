import { useState, useEffect, useMemo } from 'react'
import { useBoards } from '../hooks/useBoards'
import { useSnapshots } from '../hooks/useSnapshots'
import { useImageStorage } from '../hooks/useImageStorage'
import { EpisodeTimeline } from '../components/EpisodeTimeline'
import { CompareView } from '../components/CompareView'
import { RankingTrendsChart } from '../components/RankingTrendsChart'
import { Button } from '../components/ui/Button'
import { wobbly } from '../styles/wobbly'

type ViewMode = 'list' | 'chart' | 'compare'

/**
 * Empty state when no boards exist
 */
const NoBoardsState = () => (
  <div
    className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center"
  >
    <div className="text-6xl mb-4 opacity-50">📊</div>
    <h2
      className="text-xl text-[#2d2d2d] mb-2"
      style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
    >
      No Boards Yet
    </h2>
    <p
      className="text-[#9a958d]"
      style={{ fontFamily: "'Patrick Hand', cursive" }}
    >
      Create a board first, then save episode snapshots to track your ranking history.
    </p>
  </div>
)

/**
 * Board selector dropdown
 */
const BoardSelector = ({
  boards,
  selectedBoardId,
  onSelect,
}: {
  boards: { id: string; name: string }[]
  selectedBoardId: string | null
  onSelect: (boardId: string) => void
}) => {
  return (
    <div className="relative">
      <select
        value={selectedBoardId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="
          w-full px-4 py-3
          bg-white
          border-[3px] border-[#2d2d2d]
          shadow-[4px_4px_0px_0px_#2d2d2d]
          text-[#2d2d2d]
          text-lg
          appearance-none
          cursor-pointer
          focus:outline-none focus:ring-0
        "
        style={{
          fontFamily: "'Patrick Hand', cursive",
          borderRadius: wobbly.sm,
        }}
      >
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.name}
          </option>
        ))}
      </select>
      {/* Dropdown arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2d2d2d]">
        ▼
      </div>
    </div>
  )
}

/**
 * Episode selector for compare mode
 */
const EpisodeSelector = ({
  snapshots,
  selectedId,
  onSelect,
  label,
}: {
  snapshots: { id: string; label: string; episodeNumber: number }[]
  selectedId: string | null
  onSelect: (id: string) => void
  label: string
}) => {
  return (
    <div className="flex-1">
      <label
        className="block text-sm text-[#9a958d] mb-1"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        {label}
      </label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="
          w-full px-3 py-2
          bg-white
          border-2 border-[#2d2d2d]
          shadow-[2px_2px_0px_0px_#2d2d2d]
          text-[#2d2d2d]
          text-sm
          appearance-none
          cursor-pointer
          focus:outline-none
        "
        style={{
          fontFamily: "'Patrick Hand', cursive",
          borderRadius: wobbly.sm,
        }}
      >
        {snapshots.map((snapshot) => (
          <option key={snapshot.id} value={snapshot.id}>
            Ep. {snapshot.episodeNumber} - {snapshot.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * HistoryPage Component
 *
 * Main history tab page with:
 * - Board selector dropdown
 * - Episode timeline showing snapshots
 * - Compare mode to view two episodes side-by-side
 */
export const HistoryPage = () => {
  const { boards } = useBoards()
  const { getThumbnailUrl } = useImageStorage()

  // Selected board state
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [leftSnapshotId, setLeftSnapshotId] = useState<string | null>(null)
  const [rightSnapshotId, setRightSnapshotId] = useState<string | null>(null)

  // Get snapshots for selected board
  const { snapshots, deleteSnapshot } = useSnapshots(selectedBoardId ?? '')

  // Thumbnail URLs for compare view
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({})

  // Set initial board when boards load
  useEffect(() => {
    if (boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id)
    }
  }, [boards, selectedBoardId])

  // Reset view mode when board changes
  useEffect(() => {
    setViewMode('list')
    setLeftSnapshotId(null)
    setRightSnapshotId(null)
  }, [selectedBoardId])

  // Set default snapshots for compare mode
  useEffect(() => {
    if (viewMode === 'compare' && snapshots.length >= 2) {
      if (!leftSnapshotId || !snapshots.find((s) => s.id === leftSnapshotId)) {
        setLeftSnapshotId(snapshots[0].id)
      }
      if (!rightSnapshotId || !snapshots.find((s) => s.id === rightSnapshotId)) {
        setRightSnapshotId(snapshots[snapshots.length - 1].id)
      }
    }
  }, [viewMode, snapshots, leftSnapshotId, rightSnapshotId])

  // Load thumbnail URLs for compare and chart views
  useEffect(() => {
    if (viewMode !== 'compare' && viewMode !== 'chart') {
      // Revoke any existing URLs when exiting compare/chart mode
      Object.values(thumbnailUrls).forEach((url) => {
        URL.revokeObjectURL(url)
      })
      setThumbnailUrls({})
      return
    }

    let cancelled = false
    const loadedUrls: string[] = []

    const loadThumbnails = async () => {
      const allThumbnailKeys = new Set<string>()

      // Collect all thumbnail keys from selected snapshots
      snapshots.forEach((snapshot) => {
        snapshot.rankings.forEach((entry) => {
          if (entry.thumbnailKey) {
            allThumbnailKeys.add(entry.thumbnailKey)
          }
        })
      })

      const urls: Record<string, string> = {}
      for (const key of allThumbnailKeys) {
        if (cancelled) return
        const url = await getThumbnailUrl(key)
        if (url) {
          urls[key] = url
          loadedUrls.push(url)
        }
      }

      if (!cancelled) {
        setThumbnailUrls(urls)
      }
    }

    loadThumbnails()

    return () => {
      cancelled = true
      // Revoke URLs on cleanup to prevent memory leaks
      loadedUrls.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
    // thumbnailUrls is intentionally omitted to avoid infinite loop:
    // This effect sets thumbnailUrls, so including it would cause the effect
    // to re-run every time it completes, creating an endless cycle.
    // The effect only needs to run when viewMode, snapshots, or getThumbnailUrl changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, snapshots, getThumbnailUrl])

  // Get selected snapshots for compare view
  const leftSnapshot = useMemo(
    () => snapshots.find((s) => s.id === leftSnapshotId) ?? null,
    [snapshots, leftSnapshotId]
  )

  const rightSnapshot = useMemo(
    () => snapshots.find((s) => s.id === rightSnapshotId) ?? null,
    [snapshots, rightSnapshotId]
  )

  // Handle snapshot selection from timeline
  const handleSnapshotSelect = (snapshotId: string) => {
    // For now, just log - could open a detail view later
    console.log('Selected snapshot:', snapshotId)
  }

  // No boards state
  if (boards.length === 0) {
    return (
      <div className="min-h-full">
        <header className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur-sm border-b border-[#e5e0d8] px-4 py-4">
          <h1
            className="text-3xl text-[#2d2d2d]"
            style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
          >
            History
          </h1>
        </header>
        <NoBoardsState />
      </div>
    )
  }

  const canCompare = snapshots.length >= 2
  const canShowChart = snapshots.length >= 2

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur-sm border-b border-[#e5e0d8] px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1
            className="text-3xl text-[#2d2d2d]"
            style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
          >
            History
          </h1>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            {canShowChart && (
              <Button
                variant={viewMode === 'chart' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode(viewMode === 'chart' ? 'list' : 'chart')}
              >
                {viewMode === 'chart' ? 'List' : 'Chart'}
              </Button>
            )}
            {canCompare && viewMode !== 'chart' && (
              <Button
                variant={viewMode === 'compare' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode(viewMode === 'compare' ? 'list' : 'compare')}
              >
                {viewMode === 'compare' ? 'Exit Compare' : 'Compare'}
              </Button>
            )}
          </div>
        </div>

        {/* Board Selector */}
        <BoardSelector
          boards={boards}
          selectedBoardId={selectedBoardId}
          onSelect={setSelectedBoardId}
        />

        {/* Compare Episode Selectors */}
        {viewMode === 'compare' && canCompare && (
          <div className="flex gap-3 mt-4">
            <EpisodeSelector
              snapshots={snapshots}
              selectedId={leftSnapshotId}
              onSelect={setLeftSnapshotId}
              label="Earlier Episode"
            />
            <EpisodeSelector
              snapshots={snapshots}
              selectedId={rightSnapshotId}
              onSelect={setRightSnapshotId}
              label="Later Episode"
            />
          </div>
        )}
      </header>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'compare' && leftSnapshot && rightSnapshot ? (
          <CompareView
            leftSnapshot={leftSnapshot}
            rightSnapshot={rightSnapshot}
            thumbnailUrls={thumbnailUrls}
          />
        ) : viewMode === 'chart' ? (
          <RankingTrendsChart snapshots={snapshots} thumbnailUrls={thumbnailUrls} />
        ) : (
          <EpisodeTimeline
            snapshots={snapshots}
            onSnapshotSelect={handleSnapshotSelect}
            onSnapshotDelete={deleteSnapshot}
          />
        )}
      </div>
    </div>
  )
}
