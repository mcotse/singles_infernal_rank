import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'

describe('Input', () => {
  describe('rendering', () => {
    it('renders as text input by default', () => {
      render(<Input aria-label="test input" />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders textarea when multiline is true', () => {
      render(<Input multiline aria-label="test textarea" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text..." />)
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
    })
  })

  describe('value handling', () => {
    it('displays controlled value', () => {
      render(<Input value="Hello" onChange={() => {}} aria-label="test" />)
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument()
    })

    it('calls onChange when typing', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} aria-label="test" />)

      await user.type(screen.getByRole('textbox'), 'a')
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('styling', () => {
    it('has wobbly border-radius', () => {
      render(<Input data-testid="input" aria-label="test" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveStyle({ borderRadius: expect.stringContaining('/') })
    })

    it('has border', () => {
      render(<Input data-testid="input" aria-label="test" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('border-2')
    })

    it('uses Patrick Hand font', () => {
      render(<Input data-testid="input" aria-label="test" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass("font-['Patrick_Hand']")
    })
  })

  describe('focus state', () => {
    it('has focus ring styles defined', () => {
      render(<Input data-testid="input" aria-label="test" />)
      const input = screen.getByTestId('input')
      // Check that focus classes are present
      expect(input.className).toContain('focus:border-[#2d5da1]')
    })
  })

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<Input disabled aria-label="test" />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('has disabled styling', () => {
      render(<Input disabled data-testid="input" aria-label="test" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('opacity-50')
    })
  })

  describe('label', () => {
    it('renders with label when provided', () => {
      render(<Input label="Username" />)
      expect(screen.getByText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    it('associates label with input', () => {
      render(<Input label="Email" />)
      const input = screen.getByLabelText('Email')
      expect(input).toBeInTheDocument()
    })
  })
})
