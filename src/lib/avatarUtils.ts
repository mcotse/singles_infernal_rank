/**
 * Avatar Generation Utilities
 *
 * Shared utilities for generating placeholder avatars with initials.
 * Used by template loading and other features that need instant avatars.
 */

/**
 * Color palette for placeholder avatars (soft, pastel colors)
 */
export const AVATAR_COLORS = [
  '#FF6B6B', // coral
  '#4ECDC4', // teal
  '#45B7D1', // sky blue
  '#96CEB4', // sage
  '#FFEAA7', // butter
  '#DDA0DD', // plum
  '#98D8C8', // mint
  '#F7DC6F', // gold
  '#BB8FCE', // lavender
  '#85C1E9', // light blue
  '#F8B500', // amber
  '#7DCEA0', // green
  '#F1948A', // rose
]

/**
 * Get initials from a name (e.g., "Park Hee Sun" -> "PH")
 */
export const getInitials = (name: string): string => {
  const parts = name.split(' ').filter(p => p.length > 0)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

/**
 * Generate a deterministic color based on name
 */
export const getColorForName = (name: string): string => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/**
 * Generate a placeholder avatar image as a Blob
 * Creates a colored circle with initials - instant, no network required
 */
export const generatePlaceholderAvatar = (name: string, size: number = 200): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    const color = getColorForName(name)
    const initials = getInitials(name)

    // Draw background circle
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.fill()

    // Draw initials
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${size * 0.4}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials, size / 2, size / 2)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      },
      'image/jpeg',
      0.8
    )
  })
}
