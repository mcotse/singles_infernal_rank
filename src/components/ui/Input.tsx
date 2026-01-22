import { type InputHTMLAttributes, type TextareaHTMLAttributes, useId } from 'react'
import { wobbly } from '../../styles/wobbly'

type BaseInputProps = {
  label?: string
  multiline?: false
} & InputHTMLAttributes<HTMLInputElement>

type TextareaProps = {
  label?: string
  multiline: true
} & TextareaHTMLAttributes<HTMLTextAreaElement>

export type InputProps = BaseInputProps | TextareaProps

/**
 * Hand-drawn style Input component
 *
 * Features:
 * - Wobbly irregular borders
 * - Patrick Hand font for authentic feel
 * - Focus state: blue border + ring
 * - Support for multiline (textarea)
 * - Optional label with proper association
 */
export const Input = (props: InputProps) => {
  const generatedId = useId()
  const {
    label,
    multiline,
    disabled = false,
    className = '',
    id,
    ...restProps
  } = props

  const inputId = id || generatedId

  const baseClasses = `
    w-full
    bg-white
    border-2 border-[#2d2d2d]
    font-['Patrick_Hand'] text-lg
    text-[#2d2d2d]
    placeholder:text-[#2d2d2d]/40
    p-3
    outline-none
    transition-colors duration-100
    focus:border-[#2d5da1] focus:ring-2 focus:ring-[#2d5da1]/20
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `

  const inputStyle = {
    borderRadius: wobbly.sm,
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-2 font-['Kalam'] text-lg text-[#2d2d2d]"
        >
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          id={inputId}
          disabled={disabled}
          className={baseClasses}
          style={inputStyle}
          rows={4}
          {...(restProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          data-testid={(restProps as Record<string, unknown>)['data-testid'] as string | undefined}
        />
      ) : (
        <input
          id={inputId}
          type="text"
          disabled={disabled}
          className={baseClasses}
          style={inputStyle}
          {...(restProps as InputHTMLAttributes<HTMLInputElement>)}
          data-testid={(restProps as Record<string, unknown>)['data-testid'] as string | undefined}
        />
      )}
    </div>
  )
}
