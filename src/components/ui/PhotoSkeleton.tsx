/**
 * PhotoSkeleton Component
 *
 * Animated skeleton placeholder for card photos while loading from IndexedDB.
 * Matches the hand-drawn design system with wobbly borders.
 */

import { motion } from 'framer-motion'
import { wobbly } from '../../styles/wobbly'

export interface PhotoSkeletonProps {
  /** Size of the skeleton circle (default 56px to match thumbnail) */
  size?: number
}

/**
 * Animated pulse skeleton for loading photos
 */
export const PhotoSkeleton = ({ size = 56 }: PhotoSkeletonProps) => (
  <motion.div
    data-testid="photo-skeleton"
    className="
      bg-[#e5e0d8]
      border-2 border-[#2d2d2d]
      flex items-center justify-center
    "
    style={{
      width: size,
      height: size,
      minWidth: size,
      borderRadius: wobbly.circle,
    }}
    animate={{
      opacity: [0.5, 0.8, 0.5],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
)
