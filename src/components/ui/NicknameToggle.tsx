import { wobbly } from '../../styles/wobbly'

export interface NicknameToggleProps {
  /** Whether nickname mode is enabled */
  enabled: boolean
  /** Called when toggle is clicked */
  onToggle: () => void
}

/**
 * NicknameToggle Component
 *
 * A small toggle button for switching between real names and nicknames.
 * Hand-drawn styling consistent with the design system.
 */
export const NicknameToggle = ({ enabled, onToggle }: NicknameToggleProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={enabled ? 'Show real names' : 'Show nicknames'}
      aria-pressed={enabled}
      className={`
        flex items-center gap-1.5
        px-2 py-1
        text-sm
        border-2 border-[#2d2d2d]
        transition-all duration-100
        ${enabled
          ? 'bg-[#2d5da1] text-white shadow-[1px_1px_0px_0px_#2d2d2d]'
          : 'bg-white text-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]'
        }
        hover:shadow-[1px_1px_0px_0px_#2d2d2d]
        active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
      `}
      style={{
        fontFamily: "'Patrick Hand', cursive",
        borderRadius: wobbly.pill,
      }}
    >
      <span className="text-xs">{enabled ? '😎' : '👤'}</span>
      <span>{enabled ? 'Nicknames' : 'Names'}</span>
    </button>
  )
}
