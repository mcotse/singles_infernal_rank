import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Agentation } from 'agentation'
import { TabBar, type Tab } from './components/ui/TabBar'
import { BoardsPage } from './pages/BoardsPage'
import { BoardDetailPage } from './pages/BoardDetailPage'
import { SpacesHomePage } from './pages/SpacesHomePage'
import { SpaceDetailPage } from './pages/SpaceDetailPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { getBoards } from './lib/storage'
import { loadSinglesInfernoS5 } from './data/singlesInfernoS5'
import { wobbly } from './styles/wobbly'
import { useSpaces } from './hooks/useSpaces'

const tabs: Tab[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'boards', label: 'Boards', icon: '📋' },
  { id: 'history', label: 'History', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

const FIRST_LAUNCH_KEY = 'singles-infernal-rank-initialized'

/**
 * Loading screen shown during first-time data load
 */
const FirstLaunchLoader = ({ progress }: { progress: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fdfbf7] p-8"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      className="text-center"
    >
      <div className="text-6xl mb-6">🔥</div>
      <h1
        className="text-3xl text-[#2d2d2d] mb-4"
        style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
      >
        Hot Takes
      </h1>
      <div
        className="bg-white border-[3px] border-[#2d2d2d] p-4 mb-4 shadow-[4px_4px_0px_0px_#2d2d2d]"
        style={{ borderRadius: wobbly.md }}
      >
        <p
          className="text-[#2d2d2d] text-lg"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          Loading sample data...
        </p>
        <p
          className="text-[#9a958d] text-sm mt-2"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          {progress || 'Starting...'}
        </p>
      </div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="text-4xl"
      >
        ⏳
      </motion.div>
    </motion.div>
  </motion.div>
)

/**
 * Main App shell with TabBar navigation
 *
 * Navigation:
 * - Home tab → Spaces list → Space detail (boards within space)
 * - Boards tab → Local boards
 * - History tab
 * - Settings tab
 */
export const App = () => {
  const [activeTab, setActiveTab] = useState('home')
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [isFirstLaunch, setIsFirstLaunch] = useState(false)
  const [loadProgress, setLoadProgress] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Spaces hook
  const {
    spaces,
    isLoading: spacesLoading,
    error: spacesError,
    canCreateSpace,
    createSpace,
    joinSpace,
    clearError: clearSpacesError,
  } = useSpaces()

  // Detect ?joinCode= from URL
  const prefillJoinCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('joinCode') ?? undefined
  }, [])

  // Auto-open join modal if joinCode present
  useEffect(() => {
    if (prefillJoinCode) {
      setActiveTab('home')
      // Clean URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('joinCode')
      window.history.replaceState({}, '', url.toString())
    }
  }, [prefillJoinCode])

  // Check for first launch and auto-load sample data
  useEffect(() => {
    const hasInitialized = localStorage.getItem(FIRST_LAUNCH_KEY)

    if (!hasInitialized) {
      const boards = getBoards()

      // Only auto-load if no boards exist
      if (boards.length === 0) {
        setIsFirstLaunch(true)

        loadSinglesInfernoS5((current, total, name) => {
          setLoadProgress(`${name} (${current}/${total})`)
        }).then(() => {
          localStorage.setItem(FIRST_LAUNCH_KEY, 'true')
          setIsFirstLaunch(false)
          setRefreshKey(k => k + 1)
        }).catch(() => {
          localStorage.setItem(FIRST_LAUNCH_KEY, 'true')
          setIsFirstLaunch(false)
        })
      } else {
        localStorage.setItem(FIRST_LAUNCH_KEY, 'true')
      }
    }
  }, [])

  const handleBoardSelect = (boardId: string) => {
    setSelectedBoardId(boardId)
  }

  const handleBackToList = () => {
    setSelectedBoardId(null)
  }

  const handleSelectSpace = (spaceId: string) => {
    setSelectedSpaceId(spaceId)
  }

  const handleBackToSpaces = () => {
    setSelectedSpaceId(null)
  }

  const handleCreateSpace = async (spaceName: string, displayName: string): Promise<boolean> => {
    const result = await createSpace(spaceName, displayName)
    if (result) {
      setSelectedSpaceId(result.spaceId)
      return true
    }
    return false
  }

  const handleJoinSpace = async (joinCode: string, displayName: string): Promise<boolean> => {
    const result = await joinSpace(joinCode, displayName)
    if (result) {
      setSelectedSpaceId(result.spaceId)
      return true
    }
    return false
  }

  // Render home tab content
  const renderHomeContent = () => {
    if (selectedSpaceId) {
      return (
        <SpaceDetailPage
          spaceId={selectedSpaceId}
          onBack={handleBackToSpaces}
          onBoardSelect={handleBoardSelect}
        />
      )
    }
    return (
      <SpacesHomePage
        spaces={spaces}
        isLoading={spacesLoading}
        error={spacesError}
        canCreateSpace={canCreateSpace}
        onCreateSpace={handleCreateSpace}
        onJoinSpace={handleJoinSpace}
        onSelectSpace={handleSelectSpace}
        prefillJoinCode={prefillJoinCode}
        clearError={clearSpacesError}
      />
    )
  }

  // Render boards tab content
  const renderBoardsContent = () => {
    if (selectedBoardId) {
      return (
        <BoardDetailPage
          boardId={selectedBoardId}
          onBack={handleBackToList}
        />
      )
    }
    return <BoardsPage key={refreshKey} onBoardSelect={handleBoardSelect} />
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col">
      <AnimatePresence>
        {isFirstLaunch && <FirstLaunchLoader progress={loadProgress} />}
      </AnimatePresence>

      {/* Centered container for mobile-first design on desktop */}
      <div className="flex-1 w-full max-w-[500px] mx-auto">
        <main className="pb-20">
          {activeTab === 'home' && renderHomeContent()}
          {activeTab === 'boards' && renderBoardsContent()}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          // Clear selections when switching tabs
          if (tab !== 'boards' && tab !== 'home') {
            setSelectedBoardId(null)
          }
          if (tab !== 'home') {
            setSelectedSpaceId(null)
          }
        }}
      />

      {import.meta.env.DEV && <Agentation />}
    </div>
  )
}

export default App
