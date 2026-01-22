import { type ReactNode, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { wobbly } from '../../styles/wobbly'
import { springConfig } from '../../styles/tokens'

export interface BottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean
  /** Called when the sheet should close */
  onClose: () => void
  /** Optional title displayed in the header */
  title?: string
  /** Content to render inside the sheet */
  children: ReactNode
}

/**
 * BottomSheet Component
 *
 * An iOS-style bottom sheet modal that slides up from the bottom.
 * Features:
 * - Smooth spring animation on open/close
 * - Backdrop click to close
 * - Close button (X)
 * - Escape key to close
 * - Swipe down to close (via drag)
 * - Hand-drawn aesthetic with wobbly borders
 */
export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) => {
  const titleId = useId()

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            data-testid="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            data-testid="bottom-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springConfig.default}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              // Close if dragged down more than 100px or with velocity
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose()
              }
            }}
            className="
              absolute bottom-0 left-0 right-0
              max-h-[90vh]
              bg-[#fdfbf7]
              border-t-[3px] border-x-[3px] border-[#2d2d2d]
              shadow-[0_-4px_0px_0px_#2d2d2d]
              overflow-hidden
              rounded-t-3xl
            "
            style={{
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
            }}
          >
            {/* Drag indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-10 h-1 bg-[#e5e0d8] rounded-full"
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-[#e5e0d8]">
              {title ? (
                <h2
                  id={titleId}
                  className="text-xl text-[#2d2d2d]"
                  style={{
                    fontFamily: "'Kalam', cursive",
                    fontWeight: 700,
                  }}
                >
                  {title}
                </h2>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="
                  w-8 h-8
                  flex items-center justify-center
                  text-[#9a958d] text-xl
                  hover:text-[#2d2d2d]
                  transition-colors
                "
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
