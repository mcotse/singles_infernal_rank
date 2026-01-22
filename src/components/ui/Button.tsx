import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { wobbly } from '../../styles/wobbly'
import { colors } from '../../styles/tokens'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Hand-drawn style Button component
 *
 * Features:
 * - Wobbly irregular borders (never standard rounded)
 * - Hard offset shadows (no blur)
 * - Hover: fills with accent color, shadow reduces
 * - Active: shadow disappears (pressed flat effect)
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
  ...props
}: ButtonProps) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-base',
    md: 'px-6 py-3 text-lg',
    lg: 'px-8 py-4 text-xl',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variant === 'primary' ? 'bg-white' : `bg-[${colors.muted}]`}
        ${variant === 'secondary' ? 'bg-[#e5e0d8]' : ''}
        text-[${colors.foreground}]
        border-[3px] border-[${colors.border}]
        font-['Patrick_Hand'] font-normal
        min-h-12
        cursor-pointer
        select-none
        transition-all duration-100

        /* Shadow states */
        shadow-[4px_4px_0px_0px_#2d2d2d]
        hover:shadow-[2px_2px_0px_0px_#2d2d2d]
        hover:translate-x-[2px] hover:translate-y-[2px]
        active:shadow-none
        active:translate-x-[4px] active:translate-y-[4px]

        /* Hover color change */
        ${variant === 'primary'
          ? 'hover:bg-[#ff4d4d] hover:text-white'
          : 'hover:bg-[#2d5da1] hover:text-white'
        }

        /* Disabled state */
        ${disabled ? 'opacity-50 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-[4px_4px_0px_0px_#2d2d2d]' : ''}
        ${disabled && variant === 'primary' ? 'hover:bg-white hover:text-[#2d2d2d]' : ''}
        ${disabled && variant === 'secondary' ? 'hover:bg-[#e5e0d8] hover:text-[#2d2d2d]' : ''}

        ${className}
      `}
      style={{
        borderRadius: wobbly.sm,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
