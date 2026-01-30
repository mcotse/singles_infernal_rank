/**
 * TemplatePickerSheet Component
 *
 * A bottom sheet for selecting board templates or creating a blank board.
 * Features:
 * - List of bundled templates with category badges
 * - Loading progress overlay during template creation
 * - "Create blank board" option at bottom
 */

import { motion, AnimatePresence } from 'framer-motion'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'
import { bundledTemplates, type BundledTemplate } from '../data/templates'
import { useTemplateLoader } from '../hooks/useTemplateLoader'

export interface TemplatePickerSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean
  /** Called when the sheet should close */
  onClose: () => void
  /** Called when a board is created from a template */
  onBoardCreated: (boardId: string) => void
  /** Called when user wants to create a blank board */
  onCreateBlank: () => void
}

/**
 * Template row item
 */
const TemplateRow = ({
  template,
  onSelect,
  disabled,
}: {
  template: BundledTemplate
  onSelect: () => void
  disabled: boolean
}) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    className={`
      w-full p-4 text-left
      bg-white border-2 border-[#2d2d2d]
      transition-all duration-100
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#faf8f4] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#2d2d2d]'}
      shadow-[4px_4px_0px_0px_#2d2d2d]
    `}
    style={{ borderRadius: wobbly.sm }}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <h3
          className="text-lg text-[#2d2d2d]"
          style={{ fontFamily: "'Kalam', cursive", fontWeight: 600 }}
        >
          {template.name}
        </h3>
        <p
          className="text-sm text-[#9a958d] mt-0.5"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          {template.description}
        </p>
      </div>

      {/* Category badge and item count */}
      <div className="flex flex-col items-end gap-1">
        <span
          className="px-2 py-0.5 bg-[#e5e0d8] text-[#2d2d2d] text-xs"
          style={{
            fontFamily: "'Patrick Hand', cursive",
            borderRadius: wobbly.pill,
          }}
        >
          {template.category}
        </span>
        <span
          className="text-xs text-[#9a958d]"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          {template.items.length} items
        </span>
      </div>
    </div>
  </button>
)

/**
 * Loading overlay with progress
 */
const LoadingOverlay = ({
  progress,
}: {
  progress: { current: number; total: number; name: string }
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 bg-[#fdfbf7]/95 flex flex-col items-center justify-center z-10"
  >
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={springConfig.bouncy}
      className="text-center px-6"
    >
      {/* Spinner */}
      <div className="mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#e5e0d8] border-t-[#2d5da1] mx-auto"
          style={{ borderRadius: '50%' }}
        />
      </div>

      {/* Progress text */}
      <p
        className="text-lg text-[#2d2d2d] mb-2"
        style={{ fontFamily: "'Kalam', cursive", fontWeight: 600 }}
      >
        {progress.name}
      </p>
      <p
        className="text-sm text-[#9a958d]"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        {progress.current} of {progress.total}
      </p>

      {/* Progress bar */}
      <div
        className="w-48 h-2 bg-[#e5e0d8] mt-4 mx-auto overflow-hidden"
        style={{ borderRadius: wobbly.pill }}
      >
        <motion.div
          className="h-full bg-[#2d5da1]"
          initial={{ width: 0 }}
          animate={{ width: `${(progress.current / progress.total) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  </motion.div>
)

export const TemplatePickerSheet = ({
  isOpen,
  onClose,
  onBoardCreated,
  onCreateBlank,
}: TemplatePickerSheetProps) => {
  const { isLoading, progress, loadTemplate } = useTemplateLoader()

  const handleTemplateSelect = async (template: BundledTemplate) => {
    const result = await loadTemplate(template)
    if (result.success && result.boardId) {
      onClose()
      onBoardCreated(result.boardId)
    }
  }

  const handleCreateBlank = () => {
    onClose()
    onCreateBlank()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title="Create New Board"
    >
      <div className="relative min-h-[200px]">
        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && progress && <LoadingOverlay progress={progress} />}
        </AnimatePresence>

        {/* Templates list */}
        <div className="space-y-3">
          {bundledTemplates.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              onSelect={() => handleTemplateSelect(template)}
              disabled={isLoading}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#e5e0d8]" />
          <span
            className="text-sm text-[#9a958d]"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            or
          </span>
          <div className="flex-1 h-px bg-[#e5e0d8]" />
        </div>

        {/* Create blank board button */}
        <Button
          variant="secondary"
          onClick={handleCreateBlank}
          disabled={isLoading}
          className="w-full"
        >
          Create blank board
        </Button>
      </div>
    </BottomSheet>
  )
}
