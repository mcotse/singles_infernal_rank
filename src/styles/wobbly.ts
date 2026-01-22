/**
 * Wobbly Border Utilities
 *
 * CRITICAL for hand-drawn aesthetic.
 * These create irregular, organic border-radius values that look hand-drawn.
 *
 * Usage:
 * <div style={{ borderRadius: wobbly.md }} />
 *
 * NEVER use standard Tailwind rounded-* classes for visible elements.
 */

/**
 * Wobbly border-radius presets
 *
 * Format: "topLeft topRight bottomRight bottomLeft / topLeft topRight bottomRight bottomLeft"
 * The slash separates horizontal/vertical radii for elliptical corners.
 */
export const wobbly = {
  /**
   * Small wobbly radius - for buttons, small elements
   */
  sm: '255px 15px 225px 15px / 15px 225px 15px 255px',

  /**
   * Medium wobbly radius - for cards, containers
   */
  md: '15px 255px 15px 255px / 255px 15px 255px 15px',

  /**
   * Large wobbly radius - for large containers, modals
   */
  lg: '225px 25px 205px 25px / 25px 205px 25px 225px',

  /**
   * Extra large wobbly radius - for hero sections
   */
  xl: '125px 35px 155px 35px / 35px 155px 35px 125px',

  /**
   * Pill shape - for badges, tags
   */
  pill: '255px 15px 255px 15px / 15px 255px 15px 255px',

  /**
   * Circle-ish - for avatars, rank badges
   * Note: Still irregular, not a perfect circle
   */
  circle: '60% 40% 55% 45% / 45% 55% 40% 60%',

  /**
   * Blob - for decorative elements
   */
  blob: '70% 30% 50% 50% / 40% 60% 30% 70%',
} as const

/**
 * Get a randomly varied wobbly border for dynamic elements
 * Adds slight variation to prevent repetitive patterns
 *
 * @param base - The base radius type
 * @returns A slightly varied border-radius string
 */
export const getVariedWobbly = (
  base: keyof typeof wobbly = 'md'
): string => {
  // For now, return the base value
  // Could add randomization in the future
  return wobbly[base]
}

/**
 * CSS-in-JS style object for wobbly borders
 * Includes the border itself
 */
export const wobblyStyle = {
  sm: {
    borderRadius: wobbly.sm,
  },
  md: {
    borderRadius: wobbly.md,
  },
  lg: {
    borderRadius: wobbly.lg,
  },
  xl: {
    borderRadius: wobbly.xl,
  },
  pill: {
    borderRadius: wobbly.pill,
  },
  circle: {
    borderRadius: wobbly.circle,
  },
  blob: {
    borderRadius: wobbly.blob,
  },
} as const

export type WobblySize = keyof typeof wobbly
