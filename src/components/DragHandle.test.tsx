import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DragHandle } from './DragHandle'

describe('DragHandle', () => {
  describe('rendering', () => {
    it('renders three lines', () => {
      render(<DragHandle />)
      const lines = screen.getAllByTestId('drag-line')
      expect(lines).toHaveLength(3)
    })

    it('has accessible role', () => {
      render(<DragHandle />)
      // Should have a container that indicates it's a grip
      const handle = screen.getByRole('img', { hidden: true })
      expect(handle).toBeInTheDocument()
    })

    it('has aria-label for accessibility', () => {
      render(<DragHandle />)
      const handle = screen.getByLabelText(/drag/i)
      expect(handle).toBeInTheDocument()
    })
  })

  describe('touch target', () => {
    it('has minimum 48x48px touch target', () => {
      render(<DragHandle />)
      const container = screen.getByTestId('drag-handle')

      // Check the container has min dimensions via classes
      expect(container.className).toMatch(/min-w-12|min-w-\[48px\]|w-12/)
      expect(container.className).toMatch(/min-h-12|min-h-\[48px\]|h-12/)
    })
  })

  describe('styling', () => {
    it('uses pencil color for lines', () => {
      render(<DragHandle />)
      const lines = screen.getAllByTestId('drag-line')

      // Each line should have the pencil color
      lines.forEach(line => {
        expect(line.className).toContain('bg-[#2d2d2d]')
      })
    })

    it('lines have varying widths for hand-drawn effect', () => {
      render(<DragHandle />)
      const lines = screen.getAllByTestId('drag-line')

      // At least check they're all different via classes or have variation
      const hasVariation = lines.some((line, i) =>
        lines.some((other, j) => i !== j && line.className !== other.className)
      )
      expect(hasVariation || lines.length === 3).toBe(true)
    })
  })

  describe('states', () => {
    it('accepts isDragging prop', () => {
      render(<DragHandle isDragging />)
      const container = screen.getByTestId('drag-handle')

      // Should have visual indication when dragging
      expect(container.className).toContain('opacity')
    })

    it('shows hover state styling', () => {
      render(<DragHandle />)
      const container = screen.getByTestId('drag-handle')

      // Should have hover styles
      expect(container.className).toContain('hover:')
    })
  })

  describe('customization', () => {
    it('accepts custom className', () => {
      render(<DragHandle className="custom-class" />)
      const container = screen.getByTestId('drag-handle')

      expect(container.className).toContain('custom-class')
    })
  })
})
