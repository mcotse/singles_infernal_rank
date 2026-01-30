import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'
import { importData, exportData, clearAllData } from '../lib/storage'
import { clearAllImages } from '../lib/db'
import { getDeviceToken } from '../lib/deviceToken'
import { isAllowlisted } from '../lib/allowlist'
import { getOrCreateDeviceAlias } from '../lib/firestoreDeviceAlias'

type FeedbackType = 'success' | 'error' | 'warning' | null

interface Feedback {
  type: FeedbackType
  message: string
}

/**
 * Settings section card with hand-drawn styling
 */
const SettingsSection = ({
  title,
  description,
  icon,
  children,
  variant = 'default',
}: {
  title: string
  description: string
  icon: string
  children: React.ReactNode
  variant?: 'default' | 'danger'
}) => (
  <div
    className={`
      p-5 border-[3px] mb-5
      ${variant === 'danger' ? 'border-[#ff4d4d] bg-[#fff5f5]' : 'border-[#2d2d2d] bg-white'}
    `}
    style={{
      borderRadius: wobbly.md,
      boxShadow: variant === 'danger' ? '4px 4px 0px 0px #ff4d4d' : '4px 4px 0px 0px #2d2d2d',
    }}
  >
    <div className="flex items-start gap-3 mb-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <h3
          className="text-xl text-[#2d2d2d] mb-1"
          style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
        >
          {title}
        </h3>
        <p
          className="text-[#9a958d] text-sm leading-relaxed"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          {description}
        </p>
      </div>
    </div>
    <div className="mt-4">{children}</div>
  </div>
)

/**
 * Feedback toast notification with hand-drawn style
 */
const FeedbackToast = ({ feedback, onDismiss }: { feedback: Feedback; onDismiss: () => void }) => {
  const bgColor = {
    success: 'bg-[#e8f5e9]',
    error: 'bg-[#ffebee]',
    warning: 'bg-[#fff8e1]',
  }[feedback.type!]

  const borderColor = {
    success: 'border-[#4caf50]',
    error: 'border-[#ff4d4d]',
    warning: 'border-[#ff9800]',
  }[feedback.type!]

  const icon = {
    success: '✓',
    error: '✗',
    warning: '!',
  }[feedback.type!]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={springConfig.bouncy}
      className={`
        fixed top-4 left-4 right-4 z-50 p-4
        border-[3px] ${borderColor} ${bgColor}
        flex items-center gap-3
      `}
      style={{
        borderRadius: wobbly.sm,
        boxShadow: '4px 4px 0px 0px #2d2d2d',
      }}
      onClick={onDismiss}
    >
      <span className="text-xl font-bold">{icon}</span>
      <p
        className="flex-1 text-[#2d2d2d]"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        {feedback.message}
      </p>
      <button className="text-[#9a958d] hover:text-[#2d2d2d] text-xl">×</button>
    </motion.div>
  )
}

/**
 * Confirmation modal with hand-drawn styling
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={springConfig.bouncy}
        className="relative bg-[#fdfbf7] border-[3px] border-[#ff4d4d] p-6 w-full max-w-sm"
        style={{
          borderRadius: wobbly.lg,
          boxShadow: '8px 8px 0px 0px #ff4d4d',
        }}
      >
        <h2
          className="text-2xl text-[#ff4d4d] mb-3"
          style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
        >
          {title}
        </h2>

        <p
          className="text-[#2d2d2d] mb-6"
          style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1.1rem' }}
        >
          {message}
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-[#ff4d4d] text-white border-[3px] border-[#2d2d2d] font-['Patrick_Hand'] text-lg cursor-pointer select-none transition-all duration-100 shadow-[4px_4px_0px_0px_#2d2d2d] hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            style={{ borderRadius: wobbly.sm }}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * SettingsPage Component
 *
 * Settings page with hand-drawn aesthetic featuring:
 * - Import/Export data functionality
 * - Clear All Data danger zone
 */
export const SettingsPage = () => {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const deviceToken = getDeviceToken()
  const allowlisted = isAllowlisted(deviceToken)
  const [deviceAlias, setDeviceAlias] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getOrCreateDeviceAlias(deviceToken)
      .then((alias) => { if (!cancelled) setDeviceAlias(alias) })
      .catch(() => { if (!cancelled) setDeviceAlias(null) })
    return () => { cancelled = true }
  }, [deviceToken])

  const showFeedback = (type: FeedbackType, message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  // Handle file import
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string
        const result = importData(jsonContent, { merge: true })

        if (result.success) {
          showFeedback(
            'success',
            `Import successful! Added ${result.boardsImported} boards and ${result.cardsImported} cards.`
          )
        } else {
          showFeedback('error', result.error || 'Failed to import data')
        }
      } catch {
        showFeedback('error', 'Invalid file format')
      }
    }
    reader.readAsText(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  // Handle export
  const handleExport = () => {
    try {
      const data = exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ranking-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showFeedback('success', 'Data exported successfully!')
    } catch {
      showFeedback('error', 'Failed to export data')
    }
  }

  // Handle clear all data
  const handleClearAllData = async () => {
    setShowClearConfirm(false)
    setIsLoading(true)

    try {
      clearAllData()
      await clearAllImages()
      showFeedback('success', 'All data has been cleared')
    } catch {
      showFeedback('error', 'Failed to clear some data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-full pb-24">
      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <FeedbackToast feedback={feedback} onDismiss={() => setFeedback(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur-sm border-b border-[#e5e0d8] px-4 py-4">
        <h1
          className="text-3xl text-[#2d2d2d]"
          style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
        >
          Settings
        </h1>
      </header>

      {/* Content */}
      <div className="p-4">
        {/* Device Section */}
        <SettingsSection
          icon="📱"
          title="Device"
          description="Your device identity for spaces and sharing."
        >
          <div
            className="p-3 bg-[#f5f5f5] border-2 border-dashed border-[#e5e0d8]"
            style={{ borderRadius: wobbly.sm }}
          >
            <p
              className="text-[#9a958d] text-xs mb-1"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Device Alias
            </p>
            <p
              className="text-[#2d2d2d] text-lg"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              {deviceAlias ?? '...'}
            </p>
            {allowlisted && (
              <p
                className="text-[#22c55e] text-xs mt-1"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                Allowlisted (no limits)
              </p>
            )}
            <details className="mt-2">
              <summary
                className="text-[#9a958d] text-xs cursor-pointer"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                Device Token
              </summary>
              <p className="text-[#9a958d] text-xs font-mono break-all mt-1">
                {deviceToken}
              </p>
            </details>
          </div>
        </SettingsSection>

        {/* Import/Export Section */}
        <SettingsSection
          icon="📦"
          title="Import & Export"
          description="Backup your rankings or transfer them to another device."
        >
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button onClick={handleImportClick} variant="secondary" size="sm">
              📥 Import from File
            </Button>

            <Button onClick={handleExport} variant="secondary" size="sm">
              📤 Export to File
            </Button>
          </div>

          <div
            className="mt-4 p-3 bg-[#f5f5f5] border-2 border-dashed border-[#e5e0d8]"
            style={{ borderRadius: wobbly.sm }}
          >
            <p
              className="text-[#9a958d] text-xs"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              💡 Tip: Import merges with your existing data. Duplicate items are skipped.
            </p>
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection
          icon="⚠️"
          title="Danger Zone"
          description="These actions cannot be undone. Please be careful!"
          variant="danger"
        >
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-white text-[#ff4d4d] border-[3px] border-[#ff4d4d] font-['Patrick_Hand'] text-lg cursor-pointer select-none transition-all duration-100 shadow-[4px_4px_0px_0px_#ff4d4d] hover:bg-[#ff4d4d] hover:text-white hover:shadow-[2px_2px_0px_0px_#ff4d4d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: wobbly.sm }}
          >
            🗑️ Clear All Data
          </button>
        </SettingsSection>

        {/* App Info */}
        <div className="text-center mt-8 mb-4">
          <p
            className="text-[#9a958d] text-sm"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Hot Takes v{__APP_VERSION__}
          </p>
          <p
            className="text-[#9a958d] text-xs mt-1"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Rank anything with drag-and-drop
          </p>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <ConfirmModal
            isOpen={showClearConfirm}
            title="Clear All Data?"
            message="This will permanently delete all your boards, cards, and images. This action cannot be undone!"
            confirmLabel="Yes, Clear Everything"
            onConfirm={handleClearAllData}
            onCancel={() => setShowClearConfirm(false)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
