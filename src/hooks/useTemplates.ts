/**
 * useTemplates Hook
 *
 * Manages board templates state and fetching.
 *
 * Features:
 * - List of available templates
 * - Filter by category
 * - Loading and error states
 * - Refresh capability
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { BoardTemplate } from '../lib/socialTypes'
import {
  getActiveTemplates,
  getTemplateCategories,
} from '../lib/firestoreTemplates'

/**
 * useTemplates return type
 */
export interface UseTemplatesReturn {
  /** List of available templates */
  templates: BoardTemplate[]
  /** List of unique categories */
  categories: string[]
  /** Current category filter (null for all) */
  selectedCategory: string | null
  /** Set category filter */
  setSelectedCategory: (category: string | null) => void
  /** Whether data is being loaded */
  isLoading: boolean
  /** Error message if fetch failed */
  error: string | null
  /** Refresh templates data */
  refresh: () => Promise<void>
}

/**
 * Hook for fetching and managing board templates
 */
export const useTemplates = (): UseTemplatesReturn => {
  const [allTemplates, setAllTemplates] = useState<BoardTemplate[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load templates and categories
   */
  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch templates and categories in parallel
      const [templates, cats] = await Promise.all([
        getActiveTemplates(),
        getTemplateCategories(),
      ])

      setAllTemplates(templates)
      setCategories(cats)
    } catch (err) {
      console.error('Error loading templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load on mount
  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  /**
   * Filtered templates based on selected category
   */
  const templates = useMemo(() => {
    if (!selectedCategory) {
      return allTemplates
    }
    return allTemplates.filter(
      (t) => t.category.toLowerCase() === selectedCategory.toLowerCase()
    )
  }, [allTemplates, selectedCategory])

  /**
   * Refresh templates
   */
  const refresh = useCallback(async () => {
    await loadTemplates()
  }, [loadTemplates])

  return {
    templates,
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    error,
    refresh,
  }
}
