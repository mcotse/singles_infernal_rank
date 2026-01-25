import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MovementIndicator } from './MovementIndicator'

describe('MovementIndicator', () => {
  describe('new entry', () => {
    it('shows NEW badge when isNew is true', () => {
      render(<MovementIndicator movement={null} isNew={true} />)

      expect(screen.getByText('NEW')).toBeInTheDocument()
    })

    it('shows NEW badge even with movement value when isNew', () => {
      render(<MovementIndicator movement={5} isNew={true} />)

      expect(screen.getByText('NEW')).toBeInTheDocument()
      expect(screen.queryByText('5')).not.toBeInTheDocument()
    })
  })

  describe('positive movement (improved rank)', () => {
    it('shows up arrow with movement value', () => {
      render(<MovementIndicator movement={3} />)

      expect(screen.getByText('▲')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('shows correct value for single position improvement', () => {
      render(<MovementIndicator movement={1} />)

      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  describe('negative movement (dropped rank)', () => {
    it('shows down arrow with absolute movement value', () => {
      render(<MovementIndicator movement={-2} />)

      expect(screen.getByText('▼')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('shows correct value for large drop', () => {
      render(<MovementIndicator movement={-5} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  describe('no change', () => {
    it('shows dash for zero movement', () => {
      render(<MovementIndicator movement={0} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows dash for null movement', () => {
      render(<MovementIndicator movement={null} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('size variants', () => {
    it('renders with small size by default', () => {
      const { container } = render(<MovementIndicator movement={1} />)

      const span = container.querySelector('span')
      expect(span?.className).toContain('text-xs')
    })

    it('renders with medium size when specified', () => {
      const { container } = render(<MovementIndicator movement={1} size="md" />)

      const span = container.querySelector('span')
      expect(span?.className).toContain('text-sm')
    })
  })
})
