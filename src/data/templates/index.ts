/**
 * Template Registry
 *
 * Central registry of all bundled templates available for board creation.
 */

import type { BundledTemplate } from './types'
import { singlesInfernoS5GirlsTemplate } from './singlesInfernoS5Girls'
import { singlesInfernoS5BoysTemplate } from './singlesInfernoS5Boys'

// Export types
export type { BundledTemplate, BundledTemplateItem, TemplateLoadResult, TemplateLoadProgress } from './types'

// Export individual templates
export { singlesInfernoS5GirlsTemplate } from './singlesInfernoS5Girls'
export { singlesInfernoS5BoysTemplate } from './singlesInfernoS5Boys'

/**
 * All bundled templates available for board creation
 */
export const bundledTemplates: BundledTemplate[] = [
  singlesInfernoS5GirlsTemplate,
  singlesInfernoS5BoysTemplate,
]

/**
 * Get a template by ID
 */
export const getTemplateById = (id: string): BundledTemplate | undefined => {
  return bundledTemplates.find(t => t.id === id)
}
