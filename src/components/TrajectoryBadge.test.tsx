import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TrajectoryBadge } from './TrajectoryBadge'

describe('TrajectoryBadge', () => {
  describe('rendering', () => {
    it('displays trajectory string', () => {
      render(<TrajectoryBadge trajectory="3→1→2→1" />)

      expect(screen.getByText('3→1→2→1')).toBeInTheDocument()
    })

    it('renders single value trajectory', () => {
      render(<TrajectoryBadge trajectory="1" />)

      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('renders long trajectory', () => {
      render(<TrajectoryBadge trajectory="5→3→4→2→1→2" />)

      expect(screen.getByText('5→3→4→2→1→2')).toBeInTheDocument()
    })
  })

  describe('empty/null cases', () => {
    it('returns null for empty trajectory', () => {
      const { container } = render(<TrajectoryBadge trajectory="" />)

      expect(container.firstChild).toBeNull()
    })

    it('returns null for "New" trajectory', () => {
      const { container } = render(<TrajectoryBadge trajectory="New" />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('element type', () => {
    it('renders as span when no onClick', () => {
      render(<TrajectoryBadge trajectory="1→2" />)

      const element = screen.getByText('1→2')
      expect(element.tagName).toBe('SPAN')
    })

    it('renders as button when onClick is provided', () => {
      render(<TrajectoryBadge trajectory="1→2" onClick={() => {}} />)

      const element = screen.getByText('1→2')
      expect(element.tagName).toBe('BUTTON')
    })
  })

  describe('click handling', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn()
      render(<TrajectoryBadge trajectory="3→1" onClick={onClick} />)

      fireEvent.click(screen.getByText('3→1'))

      expect(onClick).toHaveBeenCalled()
    })

    it('does not error when clicking span without onClick', () => {
      render(<TrajectoryBadge trajectory="1→2" />)

      // Should not throw
      fireEvent.click(screen.getByText('1→2'))
    })
  })
})
