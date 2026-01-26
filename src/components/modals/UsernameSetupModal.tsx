/**
 * UsernameSetupModal Component
 *
 * Modal for first-time username entry after Google Sign-In.
 * Features:
 * - Real-time username validation
 * - Hand-drawn aesthetic with wobbly borders
 * - Loading and error states
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { wobbly } from '../../styles/wobbly'
import { springConfig } from '../../styles/tokens'
import { validateUsername, USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH } from '../../lib/usernameValidation'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export interface UsernameSetupModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Called when modal should close */
  onClose: () => void
  /** Called when username is submitted (validation passed) */
  onSubmit: (username: string) => Promise<void> | void
  /** Whether submission is in progress */
  isLoading: boolean
  /** External error message (e.g., username already taken) */
  error: string | null
  /** Whether the modal can be dismissed (default: true) */
  allowDismiss?: boolean
}

export const UsernameSetupModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error: externalError,
  allowDismiss = true,
}: UsernameSetupModalProps) => {
  const [username, setUsername] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Combined error (external takes precedence)
  const error = externalError || validationError

  // Handle escape key - only if modal is dismissible
  useEffect(() => {
    if (!allowDismiss) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, allowDismiss])

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

  // Clear validation error when typing
  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
    setValidationError(null)
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const result = validateUsername(username)
      if (!result.isValid) {
        setValidationError(result.error || 'Invalid username')
        return
      }

      await onSubmit(username.trim())
    },
    [username, onSubmit]
  )

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
            onClick={allowDismiss ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="username-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springConfig.default}
            className="
              relative
              w-full max-w-sm
              bg-[#fdfbf7]
              border-[3px] border-[#2d2d2d]
              shadow-[8px_8px_0px_0px_#2d2d2d]
              p-6
            "
            style={{ borderRadius: wobbly.lg }}
          >
            {/* Title */}
            <h2
              id="username-modal-title"
              className="text-2xl text-center text-[#2d2d2d] mb-2"
              style={{
                fontFamily: "'Kalam', cursive",
                fontWeight: 700,
              }}
            >
              Choose Your Username
            </h2>

            {/* Description */}
            <p
              className="text-center text-[#2d2d2d]/70 mb-6"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              This is how friends will find you
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Input
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="e.g., ranking_queen"
                  disabled={isLoading}
                  aria-describedby={error ? 'username-error' : 'username-help'}
                  autoFocus
                />

                {/* Help text */}
                {!error && (
                  <p
                    id="username-help"
                    className="mt-2 text-sm text-[#2d2d2d]/50"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    {USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters, letters, numbers, underscores
                  </p>
                )}

                {/* Error message */}
                {error && (
                  <p
                    id="username-error"
                    className="mt-2 text-sm text-[#ff4d4d]"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Saving...' : 'Continue'}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
