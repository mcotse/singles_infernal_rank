import { type ReactNode } from 'react'

export interface Tab {
  id: string
  label: string
  icon: ReactNode
}

export interface TabBarProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

/**
 * Bottom TabBar for navigation
 *
 * Features:
 * - Fixed to bottom of screen
 * - iOS safe area inset handling
 * - Hand-drawn aesthetic with border
 * - Active tab highlighted with accent color
 */
export const TabBar = ({ tabs, activeTab, onTabChange }: TabBarProps) => {
  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0
        bg-[#fdfbf7]
        border-t-2 border-[#2d2d2d]
        font-['Patrick_Hand']
        flex justify-around items-center
        pt-2
        pb-[env(safe-area-inset-bottom)]
        z-50
      "
      role="navigation"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (!isActive) {
                onTabChange(tab.id)
              }
            }}
            className={`
              flex flex-col items-center justify-center
              px-4 py-2
              min-w-[80px]
              transition-colors duration-100
              ${isActive ? 'text-[#ff4d4d]' : 'text-[#2d2d2d]/60 hover:text-[#2d2d2d]'}
            `}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="text-2xl mb-1">{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
