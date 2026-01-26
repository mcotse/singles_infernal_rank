import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Agentation } from 'agentation'
import { TabBar, type Tab } from './components/ui/TabBar'
import { BoardsPage } from './pages/BoardsPage'
import { BoardDetailPage } from './pages/BoardDetailPage'
import { FriendsPage } from './pages/FriendsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { getBoards } from './lib/storage'
import { loadSinglesInfernoS5 } from './data/singlesInfernoS5'
import { wobbly } from './styles/wobbly'

const tabs: Tab[] = [
  { id: 'boards', label: 'Boards', icon: '📋' },
  { id: 'friends', label: 'Friends', icon: '👥' },
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
        Ranky
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
 * Features:
 * - Bottom TabBar for navigation
 * - Paper texture background
 * - Safe area handling for iOS
 * - Switching between Boards and Settings views
 * - Board detail view with back navigation
 * - Auto-loads sample data on first launch
 */
export const App = () => {
  const [activeTab, setActiveTab] = useState('boards')
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [isFirstLaunch, setIsFirstLaunch] = useState(false)
  const [loadProgress, setLoadProgress] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

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
          // Force BoardsPage to remount and re-read data
          setRefreshKey(k => k + 1)
        }).catch(() => {
          // If loading fails, still mark as initialized to avoid infinite loop
          localStorage.setItem(FIRST_LAUNCH_KEY, 'true')
          setIsFirstLaunch(false)
        })
      } else {
        // Boards exist, mark as initialized
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

  // Determine what to show in the boards tab
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
          {activeTab === 'boards' && renderBoardsContent()}
          {activeTab === 'friends' && <FriendsPage />}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          // Clear board selection when switching tabs
          if (tab !== 'boards') {
            setSelectedBoardId(null)
          }
        }}
      />

      {import.meta.env.DEV && <Agentation />}
    </div>
  )
}

export default App
