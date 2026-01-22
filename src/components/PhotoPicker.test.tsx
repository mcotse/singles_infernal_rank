import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PhotoPicker } from './PhotoPicker'

describe('PhotoPicker', () => {
  const defaultProps = {
    onPhotoSelect: vi.fn(),
  }

  describe('rendering', () => {
    it('renders a hidden file input', () => {
      render(<PhotoPicker {...defaultProps} />)
      const input = screen.getByTestId('photo-input')
      expect(input).toHaveAttribute('type', 'file')
      expect(input).toHaveClass('hidden')
    })

    it('accepts image files only', () => {
      render(<PhotoPicker {...defaultProps} />)
      const input = screen.getByTestId('photo-input')
      expect(input).toHaveAttribute('accept', 'image/*')
    })
  })

  describe('triggering', () => {
    it('opens file picker when trigger is called', () => {
      let triggerFn: (() => void) | undefined
      render(
        <PhotoPicker
          {...defaultProps}
          onTriggerReady={(trigger) => {
            triggerFn = trigger
          }}
        />
      )

      const input = screen.getByTestId('photo-input') as HTMLInputElement
      const clickSpy = vi.spyOn(input, 'click')

      triggerFn?.()
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('file selection', () => {
    it('calls onPhotoSelect with selected file', async () => {
      const onPhotoSelect = vi.fn()
      render(<PhotoPicker onPhotoSelect={onPhotoSelect} />)

      const input = screen.getByTestId('photo-input')
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

      Object.defineProperty(input, 'files', {
        value: [file],
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(onPhotoSelect).toHaveBeenCalledWith(file)
      })
    })

    it('does not call onPhotoSelect when no file selected', () => {
      const onPhotoSelect = vi.fn()
      render(<PhotoPicker onPhotoSelect={onPhotoSelect} />)

      const input = screen.getByTestId('photo-input')

      Object.defineProperty(input, 'files', {
        value: [],
      })

      fireEvent.change(input)

      expect(onPhotoSelect).not.toHaveBeenCalled()
    })

    it('resets input value after selection to allow reselecting same file', async () => {
      const onPhotoSelect = vi.fn()
      render(<PhotoPicker onPhotoSelect={onPhotoSelect} />)

      const input = screen.getByTestId('photo-input') as HTMLInputElement
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      })

      fireEvent.change(input)

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })
  })
})
