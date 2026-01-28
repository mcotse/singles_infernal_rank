import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../../lib/deviceToken', () => ({
  getDeviceToken: () => 'fake-device-token-uuid',
}))

vi.mock('../../lib/allowlist', () => ({
  isAllowlisted: () => false,
}))

vi.mock('../../lib/firestoreDeviceAlias', () => ({
  getOrCreateDeviceAlias: vi.fn(() => Promise.resolve('Crimson Eagle')),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, exit, variants, whileHover, whileTap, transition, layout, ...rest } = props as Record<string, unknown>
      void initial; void animate; void exit; void variants; void whileHover; void whileTap; void transition; void layout
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children as React.ReactNode}</div>
    },
    button: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, exit, variants, whileHover, whileTap, transition, layout, ...rest } = props as Record<string, unknown>
      void initial; void animate; void exit; void variants; void whileHover; void whileTap; void transition; void layout
      return <button {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children as React.ReactNode}</button>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { SettingsPage } from '../SettingsPage'

describe('SettingsPage device alias', () => {
  it('renders the device alias', async () => {
    render(<SettingsPage />)
    expect(await screen.findByText('Crimson Eagle')).toBeTruthy()
  })

  it('hides raw token behind details element', () => {
    render(<SettingsPage />)
    const details = document.querySelector('details')
    expect(details).toBeTruthy()
    expect(details?.textContent).toContain('fake-device-token-uuid')
  })
})
