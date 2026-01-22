import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  describe('rendering', () => {
    it('renders children text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('renders as a button element by default', () => {
      render(<Button>Test</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>)
      const button = screen.getByRole('button')
      // Primary has white background
      expect(button).toHaveClass('bg-white')
    })

    it('renders secondary variant when specified', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      // Secondary has muted background
      expect(button).toHaveClass('bg-[#e5e0d8]')
    })
  })

  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      )

      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('shows disabled state visually', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('opacity-50')
    })
  })

  describe('styling', () => {
    it('has wobbly border-radius (not standard rounded)', () => {
      render(<Button>Wobbly</Button>)
      const button = screen.getByRole('button')
      // Should have inline style for wobbly border
      expect(button).toHaveStyle({ borderRadius: expect.stringContaining('/') })
    })

    it('has thick border', () => {
      render(<Button>Bordered</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-[3px]')
    })

    it('has minimum touch target size for accessibility', () => {
      render(<Button>Touch</Button>)
      const button = screen.getByRole('button')
      // Min height of 48px for touch accessibility
      expect(button).toHaveClass('min-h-12')
    })
  })

  describe('sizes', () => {
    it('renders default size', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6')
      expect(button).toHaveClass('py-3')
    })

    it('renders small size when specified', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4')
      expect(button).toHaveClass('py-2')
    })

    it('renders large size when specified', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-8')
      expect(button).toHaveClass('py-4')
    })
  })

  describe('type attribute', () => {
    it('defaults to type="button"', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('can be set to type="submit"', () => {
      render(<Button type="submit">Submit</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })
  })
})
