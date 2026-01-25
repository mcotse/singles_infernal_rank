import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { wobbly } from '../../styles/wobbly'
import { colors, springConfig } from '../../styles/tokens'

export interface ToastProps {
  message: string
  type?: 'error' | 'success' | 'info'
  duration?: number
  onClose: () => void
}

/**
 * Toast notification component with hand-drawn aesthetic
 */
export const Toast = ({
  message,
  type = 'info',
  duration = 4000,
  onClose,
}: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    error: `bg-[${colors.accent}]`,
    success: `bg-[${colors.success}]`,
    info: `bg-[${colors.secondary}]`,
  }[type]

  const icon = {
    error: '✕',
    success: '✓',
    info: 'ℹ',
  }[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={springConfig.bouncy}
      className={`
        fixed bottom-24 left-4 right-4
        ${bgColor}
        text-white
        border-[3px] border-[#2d2d2d]
        shadow-[4px_4px_0px_0px_#2d2d2d]
        p-4
        flex items-center gap-3
        z-50
      `}
      style={{ borderRadius: wobbly.md }}
      role="alert"
    >
      <span
        className="
          w-8 h-8
          flex items-center justify-center
          bg-white/20
          border-2 border-white/40
          text-lg font-bold
        "
        style={{ borderRadius: wobbly.circle }}
      >
        {icon}
      </span>
      <p
        className="flex-1 text-sm"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="
          w-8 h-8
          flex items-center justify-center
          hover:bg-white/20
          transition-colors
          text-lg
        "
        style={{ borderRadius: wobbly.sm }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </motion.div>
  )
}

/**
 * Hook for managing toast state
 */
export const useToast = () => {
  const [toast, setToast] = useState<{
    message: string
    type: 'error' | 'success' | 'info'
  } | null>(null)

  const showToast = useCallback(
    (message: string, type: 'error' | 'success' | 'info' = 'info') => {
      setToast({ message, type })
    },
    []
  )

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  const ToastContainer = useCallback(
    () => (
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </AnimatePresence>
    ),
    [toast, hideToast]
  )

  return { showToast, hideToast, ToastContainer }
}
