import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PhotoSkeleton } from './PhotoSkeleton'

describe('PhotoSkeleton', () => {
  it('renders with default size', () => {
    render(<PhotoSkeleton />)
    const skeleton = screen.getByTestId('photo-skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveStyle({ width: '56px', height: '56px' })
  })

  it('renders with custom size', () => {
    render(<PhotoSkeleton size={100} />)
    const skeleton = screen.getByTestId('photo-skeleton')
    expect(skeleton).toHaveStyle({ width: '100px', height: '100px' })
  })

  it('has muted background color', () => {
    render(<PhotoSkeleton />)
    const skeleton = screen.getByTestId('photo-skeleton')
    expect(skeleton).toHaveClass('bg-[#e5e0d8]')
  })

  it('has wobbly border styling', () => {
    render(<PhotoSkeleton />)
    const skeleton = screen.getByTestId('photo-skeleton')
    expect(skeleton).toHaveClass('border-2', 'border-[#2d2d2d]')
  })
})
