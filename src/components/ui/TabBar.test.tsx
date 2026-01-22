import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabBar } from './TabBar'

describe('TabBar', () => {
  const defaultTabs = [
    { id: 'boards', label: 'Boards', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  describe('rendering', () => {
    it('renders all tabs', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} />)
      expect(screen.getByText('Boards')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('renders tab icons', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} />)
      expect(screen.getByText('📋')).toBeInTheDocument()
      expect(screen.getByText('⚙️')).toBeInTheDocument()
    })

    it('renders as nav element for accessibility', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('renders tab buttons', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} />)
      expect(screen.getAllByRole('button')).toHaveLength(2)
    })
  })

  describe('active state', () => {
    it('shows active tab with accent color', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} />)
      const boardsTab = screen.getByRole('button', { name: /boards/i })
      expect(boardsTab).toHaveClass('text-[#ff4d4d]')
    })

    it('shows inactive tabs with muted color', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} />)
      const settingsTab = screen.getByRole('button', { name: /settings/i })
      expect(settingsTab).toHaveClass('text-[#2d2d2d]/60')
    })

    it('updates aria-current for active tab', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} />)
      const boardsTab = screen.getByRole('button', { name: /boards/i })
      expect(boardsTab).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('interactions', () => {
    it('calls onTabChange when tab is clicked', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={handleChange} />)

      await user.click(screen.getByRole('button', { name: /settings/i }))
      expect(handleChange).toHaveBeenCalledWith('settings')
    })

    it('does not call onTabChange when clicking active tab', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={handleChange} />)

      await user.click(screen.getByRole('button', { name: /boards/i }))
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('styling', () => {
    it('has border at top', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} data-testid="tabbar" />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('border-t-2')
    })

    it('has paper background', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-[#fdfbf7]')
    })

    it('uses Patrick Hand font', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass("font-['Patrick_Hand']")
    })
  })

  describe('safe area', () => {
    it('includes safe area padding class', () => {
      render(<TabBar tabs={defaultTabs} activeTab="boards" onTabChange={() => {}} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('pb-[env(safe-area-inset-bottom)]')
    })
  })
})
