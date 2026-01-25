/**
 * Design System Tokens
 *
 * Hand-drawn aesthetic design tokens for the ranking app.
 * These values match the CSS variables in index.css.
 */

export const colors = {
  background: '#fdfbf7',  // Warm Paper
  foreground: '#2d2d2d',  // Soft Pencil Black (never pure black)
  muted: '#e5e0d8',       // Old Paper / Erased Pencil
  accent: '#ff4d4d',      // Red Correction Marker
  secondary: '#2d5da1',   // Blue Ballpoint Pen
  success: '#22c55e',     // Green Checkmark
  border: '#2d2d2d',      // Pencil Lead

  // Special colors
  postItYellow: '#fff9c4',
  gold: '#ffd700',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
} as const

export const fonts = {
  heading: "'Kalam', cursive",
  body: "'Patrick Hand', cursive",
} as const

export const fontWeights = {
  normal: 400,
  bold: 700,
} as const

/**
 * Hard offset shadows - NO BLUR allowed
 * Format: x y blur spread color
 */
export const shadows = {
  sm: `2px 2px 0px 0px ${colors.border}`,
  md: `4px 4px 0px 0px ${colors.border}`,
  lg: `8px 8px 0px 0px ${colors.border}`,

  // Hover state (reduced offset)
  smHover: `1px 1px 0px 0px ${colors.border}`,
  mdHover: `2px 2px 0px 0px ${colors.border}`,
  lgHover: `6px 6px 0px 0px ${colors.border}`,

  // Subtle shadow for cards
  subtle: `3px 3px 0px 0px rgba(45, 45, 45, 0.1)`,

  // No shadow (for pressed/active state)
  none: 'none',
} as const

/**
 * Spacing scale (matches Tailwind defaults)
 */
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const

/**
 * Border widths
 */
export const borderWidths = {
  default: '2px',
  thick: '3px',
  heavy: '4px',
} as const

/**
 * Z-index scale
 */
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 30,
  popover: 40,
  tooltip: 50,
  dragging: 100,
} as const

/**
 * Animation durations
 */
export const durations = {
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
} as const

/**
 * Spring animation config for Framer Motion
 */
export const springConfig = {
  default: { type: 'spring', stiffness: 300, damping: 30 },
  bouncy: { type: 'spring', stiffness: 400, damping: 20 },
  stiff: { type: 'spring', stiffness: 500, damping: 35 },
} as const

// Export all tokens as a single object for convenience
export const tokens = {
  colors,
  fonts,
  fontWeights,
  shadows,
  spacing,
  borderWidths,
  zIndex,
  durations,
  springConfig,
} as const

export type Colors = typeof colors
export type Fonts = typeof fonts
export type Shadows = typeof shadows
