import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast, useToast } from './Toast'

// Mock framer-motion to avoid animation timing issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders the message', () => {
      render(<Toast message="Test message" onClose={vi.fn()} />)
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    it('renders with alert role for accessibility', () => {
      render(<Toast message="Alert" onClose={vi.fn()} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders dismiss button with aria-label', () => {
      render(<Toast message="Test" onClose={vi.fn()} />)
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })
  })

  describe('types', () => {
    it('renders info type by default', () => {
      render(<Toast message="Info" onClose={vi.fn()} />)
      const alert = screen.getByRole('alert')
      expect(alert.className).toContain('bg-[#2d5da1]')
    })

    it('renders error type with accent color', () => {
      render(<Toast message="Error" type="error" onClose={vi.fn()} />)
      const alert = screen.getByRole('alert')
      expect(alert.className).toContain('bg-[#ff4d4d]')
    })

    it('renders success type with success color', () => {
      render(<Toast message="Success" type="success" onClose={vi.fn()} />)
      const alert = screen.getByRole('alert')
      expect(alert.className).toContain('bg-[#22c55e]')
    })

    it('shows correct icon for error type', () => {
      render(<Toast message="Error" type="error" onClose={vi.fn()} />)
      expect(screen.getByText('✕')).toBeInTheDocument()
    })

    it('shows correct icon for success type', () => {
      render(<Toast message="Success" type="success" onClose={vi.fn()} />)
      expect(screen.getByText('✓')).toBeInTheDocument()
    })

    it('shows correct icon for info type', () => {
      render(<Toast message="Info" type="info" onClose={vi.fn()} />)
      expect(screen.getByText('ℹ')).toBeInTheDocument()
    })
  })

  describe('auto-dismiss', () => {
    it('calls onClose after default duration (4000ms)', () => {
      const onClose = vi.fn()
      render(<Toast message="Test" onClose={onClose} />)

      expect(onClose).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(4000)
      })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose after custom duration', () => {
      const onClose = vi.fn()
      render(<Toast message="Test" duration={2000} onClose={onClose} />)

      act(() => {
        vi.advanceTimersByTime(1999)
      })
      expect(onClose).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('clears timer on unmount', () => {
      const onClose = vi.fn()
      const { unmount } = render(<Toast message="Test" onClose={onClose} />)

      unmount()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('interactions', () => {
    it('calls onClose when dismiss button is clicked', async () => {
      vi.useRealTimers()
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<Toast message="Test" onClose={onClose} />)

      await user.click(screen.getByRole('button', { name: /dismiss/i }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('styling', () => {
    it('has wobbly border-radius (not standard rounded)', () => {
      render(<Toast message="Wobbly" onClose={vi.fn()} />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveStyle({ borderRadius: expect.stringContaining('/') })
    })

    it('has thick border', () => {
      render(<Toast message="Bordered" onClose={vi.fn()} />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('border-[3px]')
    })

    it('has hard offset shadow', () => {
      render(<Toast message="Shadow" onClose={vi.fn()} />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('shadow-[4px_4px_0px_0px_#2d2d2d]')
    })
  })
})

describe('useToast', () => {
  const TestComponent = () => {
    const { showToast, hideToast, ToastContainer } = useToast()
    return (
      <div>
        <button onClick={() => showToast('Test message', 'error')}>Show Error</button>
        <button onClick={() => showToast('Info message')}>Show Info</button>
        <button onClick={hideToast}>Hide</button>
        <ToastContainer />
      </div>
    )
  }

  it('shows toast when showToast is called', async () => {
    const user = userEvent.setup()
    render(<TestComponent />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /show error/i }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('hides toast when hideToast is called', async () => {
    const user = userEvent.setup()
    render(<TestComponent />)

    await user.click(screen.getByRole('button', { name: /show error/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /hide/i }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('defaults to info type when not specified', async () => {
    const user = userEvent.setup()
    render(<TestComponent />)

    await user.click(screen.getByRole('button', { name: /show info/i }))

    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('bg-[#2d5da1]')
  })
})
