import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { App } from './App'

// Mock useImageStorage to avoid IndexedDB access in tests
vi.mock('./hooks/useImageStorage', () => ({
  useImageStorage: () => ({
    isProcessing: false,
    saveImage: vi.fn().mockResolvedValue('test-image-key'),
    getImage: vi.fn().mockResolvedValue(null),
    getImageUrl: vi.fn().mockResolvedValue(null),
    getThumbnailUrl: vi.fn().mockResolvedValue(null),
    getThumbnailUrls: vi.fn().mockResolvedValue(new Map()),
    deleteImage: vi.fn().mockResolvedValue(undefined),
    revokeUrl: vi.fn(),
  }),
}))

describe('App', () => {
  describe('rendering', () => {
    it('renders the app', () => {
      render(<App />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('renders TabBar with Boards and Settings tabs', () => {
      render(<App />)
      expect(screen.getByRole('button', { name: /boards/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('shows Boards view by default', () => {
      render(<App />)
      expect(screen.getByText(/my rankings/i)).toBeInTheDocument()
    })

    it('shows Boards tab as active by default', () => {
      render(<App />)
      const boardsTab = screen.getByRole('button', { name: /boards/i })
      expect(boardsTab).toHaveAttribute('aria-current', 'page')
    })

    it('switches to Settings view when Settings tab is clicked', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /settings/i }))
      expect(screen.getByText(/settings/i, { selector: 'h1' })).toBeInTheDocument()
    })

    it('switches back to Boards view', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /settings/i }))
      await user.click(screen.getByRole('button', { name: /boards/i }))
      expect(screen.getByText(/my rankings/i)).toBeInTheDocument()
    })
  })

  describe('layout', () => {
    it('has main content area with proper padding for TabBar', () => {
      render(<App />)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('pb-20')
    })
  })
})
