import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TemplatePickerSheet } from './TemplatePickerSheet'
import * as useTemplateLoaderModule from '../hooks/useTemplateLoader'

// Mock the useTemplateLoader hook
vi.mock('../hooks/useTemplateLoader')

const mockUseTemplateLoader = vi.mocked(useTemplateLoaderModule.useTemplateLoader)

describe('TemplatePickerSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onBoardCreated: vi.fn(),
    onCreateBlank: vi.fn(),
  }

  const defaultLoaderHook = {
    isLoading: false,
    progress: null,
    loadTemplate: vi.fn().mockResolvedValue({
      success: true,
      boardId: 'new-board-123',
      cardsCreated: 6,
      imagesCreated: 7,
      errors: [],
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTemplateLoader.mockReturnValue(defaultLoaderHook)
  })

  describe('rendering', () => {
    it('renders the sheet title', () => {
      render(<TemplatePickerSheet {...defaultProps} />)
      expect(screen.getByText('Create New Board')).toBeInTheDocument()
    })

    it('renders available templates', () => {
      render(<TemplatePickerSheet {...defaultProps} />)
      expect(screen.getByText('Singles Inferno S5 Girls')).toBeInTheDocument()
      expect(screen.getByText('Singles Inferno S5 Boys')).toBeInTheDocument()
    })

    it('renders template descriptions', () => {
      render(<TemplatePickerSheet {...defaultProps} />)
      expect(screen.getByText('6 female cast members from Netflix dating show')).toBeInTheDocument()
      expect(screen.getByText('7 male cast members from Netflix dating show')).toBeInTheDocument()
    })

    it('renders category badges', () => {
      render(<TemplatePickerSheet {...defaultProps} />)
      const categoryBadges = screen.getAllByText('Reality TV')
      expect(categoryBadges).toHaveLength(2)
    })

    it('renders item counts', () => {
      render(<TemplatePickerSheet {...defaultProps} />)
      expect(screen.getByText('6 items')).toBeInTheDocument()
      expect(screen.getByText('7 items')).toBeInTheDocument()
    })

    it('renders create blank board button', () => {
      render(<TemplatePickerSheet {...defaultProps} />)
      expect(screen.getByText('Create blank board')).toBeInTheDocument()
    })

    it('renders divider text', () => {
      render(<TemplatePickerSheet {...defaultProps} />)
      expect(screen.getByText('or')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<TemplatePickerSheet {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Create New Board')).not.toBeInTheDocument()
    })
  })

  describe('template selection', () => {
    it('calls loadTemplate when a template is clicked', async () => {
      const loadTemplate = vi.fn().mockResolvedValue({
        success: true,
        boardId: 'new-board-123',
        cardsCreated: 6,
        imagesCreated: 7,
        errors: [],
      })
      mockUseTemplateLoader.mockReturnValue({
        ...defaultLoaderHook,
        loadTemplate,
      })

      render(<TemplatePickerSheet {...defaultProps} />)

      // Click on a template button (the Girls template)
      const girlsButton = screen.getByText('Singles Inferno S5 Girls').closest('button')
      fireEvent.click(girlsButton!)

      await waitFor(() => {
        expect(loadTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'singles-inferno-s5-girls',
            name: 'Singles Inferno S5 Girls',
          })
        )
      })
    })

    it('calls onBoardCreated and onClose on successful template load', async () => {
      const loadTemplate = vi.fn().mockResolvedValue({
        success: true,
        boardId: 'new-board-123',
        cardsCreated: 6,
        imagesCreated: 7,
        errors: [],
      })
      mockUseTemplateLoader.mockReturnValue({
        ...defaultLoaderHook,
        loadTemplate,
      })

      const onBoardCreated = vi.fn()
      const onClose = vi.fn()

      render(<TemplatePickerSheet {...defaultProps} onBoardCreated={onBoardCreated} onClose={onClose} />)

      const girlsButton = screen.getByText('Singles Inferno S5 Girls').closest('button')
      fireEvent.click(girlsButton!)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
        expect(onBoardCreated).toHaveBeenCalledWith('new-board-123')
      })
    })

    it('does not call onBoardCreated on failed template load', async () => {
      const loadTemplate = vi.fn().mockResolvedValue({
        success: false,
        cardsCreated: 0,
        imagesCreated: 0,
        errors: ['Load failed'],
      })
      mockUseTemplateLoader.mockReturnValue({
        ...defaultLoaderHook,
        loadTemplate,
      })

      const onBoardCreated = vi.fn()

      render(<TemplatePickerSheet {...defaultProps} onBoardCreated={onBoardCreated} />)

      const girlsButton = screen.getByText('Singles Inferno S5 Girls').closest('button')
      fireEvent.click(girlsButton!)

      await waitFor(() => {
        expect(loadTemplate).toHaveBeenCalled()
      })

      expect(onBoardCreated).not.toHaveBeenCalled()
    })
  })

  describe('create blank board', () => {
    it('calls onClose and onCreateBlank when create blank button is clicked', () => {
      const onClose = vi.fn()
      const onCreateBlank = vi.fn()

      render(<TemplatePickerSheet {...defaultProps} onClose={onClose} onCreateBlank={onCreateBlank} />)

      fireEvent.click(screen.getByText('Create blank board'))

      expect(onClose).toHaveBeenCalled()
      expect(onCreateBlank).toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('shows loading overlay when isLoading is true', () => {
      mockUseTemplateLoader.mockReturnValue({
        ...defaultLoaderHook,
        isLoading: true,
        progress: { current: 3, total: 7, name: 'Creating Ham Ye Jin...' },
      })

      render(<TemplatePickerSheet {...defaultProps} />)

      expect(screen.getByText('Creating Ham Ye Jin...')).toBeInTheDocument()
      expect(screen.getByText('3 of 7')).toBeInTheDocument()
    })

    it('disables template buttons when loading', () => {
      mockUseTemplateLoader.mockReturnValue({
        ...defaultLoaderHook,
        isLoading: true,
        progress: { current: 1, total: 7, name: 'Creating board...' },
      })

      render(<TemplatePickerSheet {...defaultProps} />)

      const girlsButton = screen.getByText('Singles Inferno S5 Girls').closest('button')
      expect(girlsButton).toBeDisabled()
    })

    it('disables create blank button when loading', () => {
      mockUseTemplateLoader.mockReturnValue({
        ...defaultLoaderHook,
        isLoading: true,
        progress: { current: 1, total: 7, name: 'Creating board...' },
      })

      render(<TemplatePickerSheet {...defaultProps} />)

      const blankButton = screen.getByText('Create blank board')
      expect(blankButton).toBeDisabled()
    })

    it('prevents closing when loading', () => {
      mockUseTemplateLoader.mockReturnValue({
        ...defaultLoaderHook,
        isLoading: true,
        progress: { current: 1, total: 7, name: 'Creating board...' },
      })

      const onClose = vi.fn()
      render(<TemplatePickerSheet {...defaultProps} onClose={onClose} />)

      // Try to close by clicking the X button
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      // onClose should not be called because we're loading
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})
