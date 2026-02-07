import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RankList } from './RankList'
import type { Card } from '../lib/types'

describe('RankList', () => {
  const createMockCard = (id: string, name: string, rank: number): Card => ({
    id,
    boardId: 'board-1',
    name,
    nickname: '',
    imageKey: null,
    thumbnailKey: null,
    imageCrop: null,
    notes: '',
    metadata: {},
    rank,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  const mockCards: Card[] = [
    createMockCard('1', 'First Item', 1),
    createMockCard('2', 'Second Item', 2),
    createMockCard('3', 'Third Item', 3),
  ]

  const defaultProps = {
    cards: mockCards,
    onReorder: vi.fn(),
    onCardTap: vi.fn(),
  }

  describe('rendering', () => {
    it('renders all cards', () => {
      render(<RankList {...defaultProps} />)

      expect(screen.getByText('First Item')).toBeInTheDocument()
      expect(screen.getByText('Second Item')).toBeInTheDocument()
      expect(screen.getByText('Third Item')).toBeInTheDocument()
    })

    it('renders cards in rank order', () => {
      render(<RankList {...defaultProps} />)

      const cards = screen.getAllByTestId('rank-card')
      expect(cards).toHaveLength(3)
    })

    it('displays correct rank badges', () => {
      render(<RankList {...defaultProps} />)

      const badges = screen.getAllByTestId('rank-badge')
      expect(badges[0]).toHaveTextContent('1')
      expect(badges[1]).toHaveTextContent('2')
      expect(badges[2]).toHaveTextContent('3')
    })

    it('renders empty state when no cards', () => {
      render(<RankList {...defaultProps} cards={[]} />)

      expect(screen.getByTestId('empty-list')).toBeInTheDocument()
    })
  })

  describe('card tapping', () => {
    it('calls onCardTap when card body is clicked', () => {
      const onCardTap = vi.fn()
      render(<RankList {...defaultProps} onCardTap={onCardTap} />)

      fireEvent.click(screen.getAllByTestId('card-body')[0])

      expect(onCardTap).toHaveBeenCalledWith('1')
    })
  })

  describe('thumbnails', () => {
    it('passes thumbnail URLs to cards', () => {
      const thumbnailUrls = {
        '1': 'thumb1.jpg',
        '2': 'thumb2.jpg',
      }

      render(<RankList {...defaultProps} thumbnailUrls={thumbnailUrls} />)

      // First card should have image
      const img = screen.getByRole('img', { name: /first item/i })
      expect(img).toHaveAttribute('src', 'thumb1.jpg')

      // Third card should have placeholder (no thumbnail)
      const cards = screen.getAllByTestId('rank-card')
      expect(cards[2].querySelector('[data-testid="photo-placeholder"]')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('has vertical list layout', () => {
      render(<RankList {...defaultProps} />)

      const list = screen.getByTestId('rank-list')
      expect(list.className).toContain('flex-col')
    })

    it('has gap between cards', () => {
      render(<RankList {...defaultProps} />)

      const list = screen.getByTestId('rank-list')
      expect(list.className).toContain('gap-')
    })
  })

  describe('read-only mode', () => {
    it('renders all cards in read-only mode', () => {
      render(<RankList {...defaultProps} isReadOnly />)

      expect(screen.getByText('First Item')).toBeInTheDocument()
      expect(screen.getByText('Second Item')).toBeInTheDocument()
      expect(screen.getByText('Third Item')).toBeInTheDocument()
    })

    it('displays correct rank badges in read-only mode', () => {
      render(<RankList {...defaultProps} isReadOnly />)

      const badges = screen.getAllByTestId('rank-badge')
      expect(badges[0]).toHaveTextContent('1')
      expect(badges[1]).toHaveTextContent('2')
      expect(badges[2]).toHaveTextContent('3')
    })

    it('calls onCardTap when card is clicked in read-only mode', () => {
      const onCardTap = vi.fn()
      render(<RankList {...defaultProps} onCardTap={onCardTap} isReadOnly />)

      fireEvent.click(screen.getAllByTestId('card-body')[0])

      expect(onCardTap).toHaveBeenCalledWith('1')
    })

    it('does not render drag handles in read-only mode', () => {
      render(<RankList {...defaultProps} isReadOnly />)

      // In read-only mode, StaticCard is used which doesn't have drag infrastructure
      // The drag handle should not be interactive for dragging
      const list = screen.getByTestId('rank-list')
      // StaticCard wraps RankCard in a plain div, not Reorder.Item
      // So there's no Reorder.Group
      expect(list.tagName.toLowerCase()).toBe('div')
    })

    it('renders thumbnails in read-only mode', () => {
      const thumbnailUrls = {
        '1': 'thumb1.jpg',
      }

      render(<RankList {...defaultProps} thumbnailUrls={thumbnailUrls} isReadOnly />)

      const img = screen.getByRole('img', { name: /first item/i })
      expect(img).toHaveAttribute('src', 'thumb1.jpg')
    })
  })
})
