/**
 * TemplatePickerPage Component
 *
 * Browse and select board templates.
 * Features:
 * - Category filtering
 * - Grid of template cards
 * - Create board from template on tap
 * - Back button navigation
 */

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTemplates } from '../hooks/useTemplates'
import { TemplateCard } from '../components/TemplateCard'
import type { BoardTemplate } from '../lib/socialTypes'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'

export interface TemplatePickerPageProps {
  /** Called when back button is clicked */
  onBack: () => void
  /** Called when a template is selected */
  onSelectTemplate: (template: BoardTemplate) => void
}

/**
 * Category filter chip
 */
const CategoryChip = ({
  category,
  isSelected,
  onClick,
}: {
  category: string
  isSelected: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      px-3 py-1.5
      text-sm
      border-2 border-[#2d2d2d]
      whitespace-nowrap
      transition-all duration-100
      ${
        isSelected
          ? 'bg-[#2d2d2d] text-white'
          : 'bg-white text-[#2d2d2d] hover:bg-[#e5e0d8]'
      }
    `}
    style={{
      borderRadius: wobbly.pill,
      fontFamily: "'Patrick Hand', cursive",
    }}
  >
    {category}
  </button>
)

export const TemplatePickerPage = ({
  onBack,
  onSelectTemplate,
}: TemplatePickerPageProps) => {
  const {
    templates,
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    error,
  } = useTemplates()

  // Handle category selection
  const handleCategoryClick = useCallback(
    (category: string | null) => {
      setSelectedCategory(category)
    },
    [setSelectedCategory]
  )

  // Handle template selection
  const handleTemplateClick = useCallback(
    (template: BoardTemplate) => {
      onSelectTemplate(template)
    },
    [onSelectTemplate]
  )

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="
            mb-4 px-3 py-2
            text-[#2d2d2d]
            border-2 border-[#2d2d2d]
            bg-white
            hover:bg-[#e5e0d8]
            transition-colors
          "
          style={{
            borderRadius: wobbly.sm,
            fontFamily: "'Patrick Hand', cursive",
          }}
          aria-label="Back"
        >
          ← Back
        </button>

        <h1
          className="text-3xl text-[#2d2d2d]"
          style={{
            fontFamily: "'Kalam', cursive",
            fontWeight: 700,
          }}
        >
          Templates
        </h1>
        <p
          className="text-[#2d2d2d]/70 mt-1"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          Choose a template to start ranking
        </p>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2">
            <CategoryChip
              category="All"
              isSelected={selectedCategory === null}
              onClick={() => handleCategoryClick(null)}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat}
                category={cat}
                isSelected={selectedCategory === cat}
                onClick={() => handleCategoryClick(cat)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-[40vh]">
          <div
            data-testid="loading-spinner"
            className="
              w-12 h-12
              border-4 border-[#e5e0d8]
              border-t-[#2d2d2d]
              animate-spin
            "
            style={{ borderRadius: wobbly.circle }}
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            p-6 text-center
            bg-white
            border-[3px] border-[#ff4d4d]
          "
          style={{ borderRadius: wobbly.md }}
        >
          <p
            className="text-[#ff4d4d]"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            {error}
          </p>
        </motion.div>
      )}

      {/* Templates grid */}
      {!isLoading && !error && (
        <AnimatePresence mode="popLayout">
          {templates.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 gap-4"
            >
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    ...springConfig.default,
                    delay: index * 0.05,
                  }}
                >
                  <TemplateCard
                    template={template}
                    onClick={handleTemplateClick}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="
                p-6 text-center
                bg-white
                border-[3px] border-[#2d2d2d]
                shadow-[4px_4px_0px_0px_#2d2d2d]
              "
              style={{ borderRadius: wobbly.md }}
            >
              <div
                className="
                  w-16 h-16 mx-auto mb-4
                  bg-[#e5e0d8]
                  border-[3px] border-[#2d2d2d]
                  flex items-center justify-center
                  text-3xl
                "
                style={{ borderRadius: wobbly.circle }}
              >
                <span role="img" aria-label="no templates">
                  📝
                </span>
              </div>

              <h3
                className="text-xl text-[#2d2d2d] mb-2"
                style={{
                  fontFamily: "'Kalam', cursive",
                  fontWeight: 700,
                }}
              >
                No Templates Available
              </h3>

              <p
                className="text-[#2d2d2d]/70"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                {selectedCategory
                  ? `No templates found in "${selectedCategory}"`
                  : 'Check back later for new templates'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
