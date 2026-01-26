/**
 * ConfirmModal Component
 *
 * Reusable confirmation dialog with danger variant.
 * Features:
 * - Customizable title, message, and button labels
 * - Danger variant with red confirm button
 * - Loading state during async confirmation
 * - Hand-drawn aesthetic
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { wobbly } from '../../styles/wobbly'
import { springConfig } from '../../styles/tokens'
import { Button } from '../ui/Button'

export interface ConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Called when modal should close */
  onClose: () => void
  /** Called when user confirms - should return a promise */
  onConfirm: () => Promise<void>
  /** Modal title */
  title: string
  /** Confirmation message */
  message: string
  /** Label for confirm button (default: "Confirm") */
  confirmLabel?: string
  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string
  /** Variant - danger shows red confirm button */
  variant?: 'danger' | 'default'
  /** External loading state (optional) */
  isLoading?: boolean
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading: externalLoading,
}: ConfirmModalProps) => {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = externalLoading ?? internalLoading

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, isLoading])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle confirm action
  const handleConfirm = useCallback(async () => {
    if (isLoading) return

    setInternalLoading(true)
    try {
      await onConfirm()
    } finally {
      setInternalLoading(false)
    }
  }, [onConfirm, isLoading])

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    if (!isLoading) {
      onClose()
    }
  }, [onClose, isLoading])

  // Get confirm button classes based on variant
  const getConfirmButtonClass = () => {
    if (variant === 'danger') {
      return 'bg-[#ff4d4d] hover:bg-[#ff3333] text-white'
    }
    return ''
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            data-testid="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springConfig.default}
            className="
              relative
              w-full max-w-xs
              bg-[#fdfbf7]
              border-[3px] border-[#2d2d2d]
              shadow-[8px_8px_0px_0px_#2d2d2d]
              p-5
            "
            style={{ borderRadius: wobbly.md }}
          >
            {/* Title */}
            <h2
              id="confirm-modal-title"
              className="text-xl text-center text-[#2d2d2d] mb-2"
              style={{
                fontFamily: "'Kalam', cursive",
                fontWeight: 700,
              }}
            >
              {title}
            </h2>

            {/* Message */}
            <p
              className="text-center text-[#2d2d2d]/70 mb-5"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              {message}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                {cancelLabel}
              </Button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className={`
                  flex-1
                  px-4 py-2
                  border-[3px] border-[#2d2d2d]
                  shadow-[4px_4px_0px_0px_#2d2d2d]
                  transition-all
                  hover:shadow-[2px_2px_0px_0px_#2d2d2d]
                  hover:translate-x-[2px]
                  hover:translate-y-[2px]
                  active:shadow-none
                  active:translate-x-1
                  active:translate-y-1
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  ${getConfirmButtonClass()}
                `}
                style={{
                  borderRadius: wobbly.sm,
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '1rem',
                }}
              >
                {isLoading ? '...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
