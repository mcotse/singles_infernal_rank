import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RankCard } from './RankCard'

describe('RankCard', () => {
  const defaultProps = {
    id: 'card-1',
    name: 'Test Item',
    rank: 1,
    onTap: vi.fn(),
  }

  describe('rendering', () => {
    it('renders the card name', () => {
      render(<RankCard {...defaultProps} />)
      expect(screen.getByText('Test Item')).toBeInTheDocument()
    })

    it('renders the rank badge', () => {
      render(<RankCard {...defaultProps} rank={5} />)
      expect(screen.getByTestId('rank-badge')).toHaveTextContent('5')
    })

    it('renders the drag handle', () => {
      render(<RankCard {...defaultProps} />)
      expect(screen.getByTestId('drag-handle')).toBeInTheDocument()
    })

    it('renders thumbnail when provided', () => {
      render(<RankCard {...defaultProps} thumbnailUrl="test.jpg" />)
      const img = screen.getByRole('img', { name: /test item/i })
      expect(img).toHaveAttribute('src', 'test.jpg')
    })

    it('renders placeholder when no thumbnail', () => {
      render(<RankCard {...defaultProps} />)
      expect(screen.getByTestId('photo-placeholder')).toBeInTheDocument()
    })

    it('renders notes when provided', () => {
      render(<RankCard {...defaultProps} notes="Some notes here" />)
      expect(screen.getByText('Some notes here')).toBeInTheDocument()
    })

    it('truncates long notes', () => {
      const longNotes = 'A'.repeat(200)
      render(<RankCard {...defaultProps} notes={longNotes} />)
      const notesEl = screen.getByTestId('card-notes')
      expect(notesEl.className).toContain('truncate')
    })
  })

  describe('rank decorations', () => {
    it('shows gold decoration for rank 1', () => {
      render(<RankCard {...defaultProps} rank={1} />)
      const decoration = screen.getByTestId('rank-decoration')
      expect(decoration).toHaveClass('bg-[#ffd700]')
    })

    it('shows silver decoration for rank 2', () => {
      render(<RankCard {...defaultProps} rank={2} />)
      const decoration = screen.getByTestId('rank-decoration')
      expect(decoration).toHaveClass('bg-[#c0c0c0]')
    })

    it('shows bronze decoration for rank 3', () => {
      render(<RankCard {...defaultProps} rank={3} />)
      const decoration = screen.getByTestId('rank-decoration')
      expect(decoration).toHaveClass('bg-[#cd7f32]')
    })

    it('shows no decoration for rank 4+', () => {
      render(<RankCard {...defaultProps} rank={4} />)
      expect(screen.queryByTestId('rank-decoration')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onTap when card body is clicked', () => {
      const onTap = vi.fn()
      render(<RankCard {...defaultProps} onTap={onTap} />)

      fireEvent.click(screen.getByTestId('card-body'))
      expect(onTap).toHaveBeenCalledWith('card-1')
    })

    it('does not call onTap when drag handle is clicked', () => {
      const onTap = vi.fn()
      render(<RankCard {...defaultProps} onTap={onTap} />)

      fireEvent.click(screen.getByTestId('drag-handle'))
      expect(onTap).not.toHaveBeenCalled()
    })
  })

  describe('dragging state', () => {
    it('applies dragging styles when isDragging is true', () => {
      render(<RankCard {...defaultProps} isDragging />)
      const card = screen.getByTestId('rank-card')

      expect(card.className).toContain('scale-105')
      expect(card.className).toContain('shadow')
    })

    it('applies normal styles when not dragging', () => {
      render(<RankCard {...defaultProps} isDragging={false} />)
      const card = screen.getByTestId('rank-card')

      expect(card.className).not.toContain('scale-105')
    })
  })

  describe('styling', () => {
    it('has wobbly border radius', () => {
      render(<RankCard {...defaultProps} />)
      const card = screen.getByTestId('rank-card')
      expect(card.getAttribute('style')).toContain('border-radius')
    })

    it('has hand-drawn shadow', () => {
      render(<RankCard {...defaultProps} />)
      const card = screen.getByTestId('rank-card')
      expect(card.className).toContain('shadow')
    })

    it('title text has adequate line-height to prevent clipping', () => {
      render(<RankCard {...defaultProps} />)
      const title = screen.getByRole('heading', { level: 3 })
      // leading-tight (1.25) clips Patrick Hand font ascenders; should not be present
      expect(title.className).not.toContain('leading-tight')
    })
  })
})
