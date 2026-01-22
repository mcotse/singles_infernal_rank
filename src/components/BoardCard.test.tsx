import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BoardCard } from './BoardCard'

describe('BoardCard', () => {
  const defaultProps = {
    id: 'board-1',
    name: 'My Rankings',
    cardCount: 5,
    onClick: vi.fn(),
  }

  describe('rendering', () => {
    it('renders the board name', () => {
      render(<BoardCard {...defaultProps} />)
      expect(screen.getByText('My Rankings')).toBeInTheDocument()
    })

    it('renders the card count', () => {
      render(<BoardCard {...defaultProps} cardCount={12} />)
      expect(screen.getByText('12 cards')).toBeInTheDocument()
    })

    it('renders singular "card" for count of 1', () => {
      render(<BoardCard {...defaultProps} cardCount={1} />)
      expect(screen.getByText('1 card')).toBeInTheDocument()
    })

    it('renders "No cards" for count of 0', () => {
      render(<BoardCard {...defaultProps} cardCount={0} />)
      expect(screen.getByText('No cards')).toBeInTheDocument()
    })

    it('renders as a button element', () => {
      render(<BoardCard {...defaultProps} />)
      const card = screen.getByRole('button')
      expect(card).toBeInTheDocument()
    })

    it('has accessible name from board name', () => {
      render(<BoardCard {...defaultProps} />)
      expect(screen.getByRole('button', { name: /my rankings/i })).toBeInTheDocument()
    })
  })

  describe('photo previews', () => {
    it('renders no photo placeholders when no preview URLs provided', () => {
      render(<BoardCard {...defaultProps} />)
      const container = screen.getByTestId('photo-preview-container')
      expect(container).toBeInTheDocument()
      // Should have empty state placeholder
      expect(screen.getByTestId('empty-preview')).toBeInTheDocument()
    })

    it('renders 1 photo when 1 preview URL provided', () => {
      render(<BoardCard {...defaultProps} previewUrls={['url1']} />)
      const photos = screen.getAllByTestId('preview-photo')
      expect(photos).toHaveLength(1)
    })

    it('renders 2 photos when 2 preview URLs provided', () => {
      render(<BoardCard {...defaultProps} previewUrls={['url1', 'url2']} />)
      const photos = screen.getAllByTestId('preview-photo')
      expect(photos).toHaveLength(2)
    })

    it('renders maximum 3 photos even with more URLs', () => {
      render(<BoardCard {...defaultProps} previewUrls={['url1', 'url2', 'url3', 'url4']} />)
      const photos = screen.getAllByTestId('preview-photo')
      expect(photos).toHaveLength(3)
    })

    it('photos have overlapping layout', () => {
      render(<BoardCard {...defaultProps} previewUrls={['url1', 'url2', 'url3']} />)
      const photos = screen.getAllByTestId('preview-photo')
      // Each photo after the first should have a negative margin or transform
      photos.forEach((photo, index) => {
        if (index > 0) {
          // Photos overlap via positioning
          expect(photo.className).toContain('absolute')
        }
      })
    })
  })

  describe('cover image', () => {
    it('displays cover image when provided', () => {
      render(<BoardCard {...defaultProps} coverImageUrl="cover.jpg" />)
      const cover = screen.getByTestId('cover-image')
      expect(cover).toHaveStyle({ backgroundImage: 'url(cover.jpg)' })
    })

    it('shows pattern background when no cover image', () => {
      render(<BoardCard {...defaultProps} />)
      const background = screen.getByTestId('board-background')
      expect(background).toBeInTheDocument()
    })
  })

  describe('decorations', () => {
    it('renders tape decorations on corners', () => {
      render(<BoardCard {...defaultProps} />)
      const tapes = screen.getAllByTestId('corner-tape')
      expect(tapes.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('interactions', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn()
      render(<BoardCard {...defaultProps} onClick={onClick} />)

      fireEvent.click(screen.getByRole('button'))
      expect(onClick).toHaveBeenCalledWith('board-1')
    })

    it('calls onClick when Enter key pressed', () => {
      const onClick = vi.fn()
      render(<BoardCard {...defaultProps} onClick={onClick} />)

      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
      expect(onClick).toHaveBeenCalledWith('board-1')
    })

    it('calls onClick when Space key pressed', () => {
      const onClick = vi.fn()
      render(<BoardCard {...defaultProps} onClick={onClick} />)

      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
      expect(onClick).toHaveBeenCalledWith('board-1')
    })
  })

  describe('styling', () => {
    it('has wobbly border radius', () => {
      render(<BoardCard {...defaultProps} />)
      const card = screen.getByRole('button')
      const style = card.getAttribute('style')
      // Should have irregular border-radius (wobbly style)
      expect(style).toContain('border-radius')
    })

    it('has hard offset shadow', () => {
      render(<BoardCard {...defaultProps} />)
      const card = screen.getByRole('button')
      expect(card.className).toContain('shadow')
    })
  })
})
