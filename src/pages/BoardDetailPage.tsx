import { useState, useCallback, useEffect, useMemo } from 'react'
import { useBoards } from '../hooks/useBoards'
import { useCards } from '../hooks/useCards'
import { useImageStorage } from '../hooks/useImageStorage'
import { useSnapshots } from '../hooks/useSnapshots'
import { RankList } from '../components/RankList'
import { CardDetailModal } from '../components/CardDetailModal'
import { PhotoPicker } from '../components/PhotoPicker'
import { SaveEpisodeModal } from '../components/SaveEpisodeModal'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { wobbly } from '../styles/wobbly'
import { compressImage, generateThumbnail } from '../lib/imageUtils'
import type { Card } from '../lib/types'

interface BoardDetailPageProps {
  /** ID of the board to display */
  boardId: string
  /** Called when user wants to go back */
  onBack: () => void
  /** Called when a card is tapped for editing */
  onCardTap?: (cardId: string) => void
  /** Called when add card button is pressed */
  onAddCard?: () => void
}

/**
 * Back button with arrow
 */
const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Go back"
    className="
      flex items-center justify-center
      w-10 h-10
      text-[#2d2d2d] text-2xl
      hover:text-[#ff4d4d]
      transition-colors
    "
  >
    ←
  </button>
)

/**
 * Save episode button
 */
const SaveEpisodeButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Save episode snapshot"
    className="
      flex items-center justify-center
      w-10 h-10
      text-[#2d2d2d] text-xl
      hover:text-[#2d5da1]
      transition-colors
    "
  >
    📸
  </button>
)

/**
 * Floating Action Button for adding cards
 */
const AddCardFAB = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Add new card"
    className="
      fixed bottom-24 right-4
      w-14 h-14
      bg-[#ff4d4d] text-white
      border-[3px] border-[#2d2d2d]
      shadow-[4px_4px_0px_0px_#2d2d2d]
      hover:shadow-[2px_2px_0px_0px_#2d2d2d]
      hover:translate-x-[2px] hover:translate-y-[2px]
      active:shadow-none
      active:translate-x-[4px] active:translate-y-[4px]
      transition-all duration-100
      text-3xl font-bold
      flex items-center justify-center
      z-20
    "
    style={{
      borderRadius: wobbly.circle,
      fontFamily: "'Kalam', cursive",
    }}
  >
    +
  </button>
)

/**
 * Error state when board not found
 */
const BoardNotFound = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-full flex flex-col items-center justify-center p-8 text-center">
    <div className="text-6xl mb-4">😕</div>
    <h2
      className="text-2xl text-[#2d2d2d] mb-2"
      style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
    >
      Board not found
    </h2>
    <p
      className="text-[#9a958d] mb-6"
      style={{ fontFamily: "'Patrick Hand', cursive" }}
    >
      This board may have been deleted.
    </p>
    <Button variant="secondary" onClick={onBack}>
      Go Back
    </Button>
  </div>
)

/**
 * BoardDetailPage Component
 *
 * Full-screen view of a board with its ranked cards.
 * Features:
 * - Header with board name and back button
 * - Scrollable list of draggable ranked cards
 * - FAB to add new cards
 * - Tap card to open detail modal
 * - Drag handle to reorder
 */
export const BoardDetailPage = ({
  boardId,
  onBack,
  onCardTap,
  onAddCard,
}: BoardDetailPageProps) => {
  const { getBoard } = useBoards()
  const { cards, reorderCards, updateCard, deleteCard, getCard, createCard } = useCards(boardId)
  const { saveImage, getThumbnailUrl } = useImageStorage()
  const { createSnapshot, nextEpisodeNumber } = useSnapshots(boardId)
  const { showToast, ToastContainer } = useToast()
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [showSaveEpisodeModal, setShowSaveEpisodeModal] = useState(false)
  const [photoPickerTrigger, setPhotoPickerTrigger] = useState<(() => void) | null>(null)
  const [pendingPhotoCardId, setPendingPhotoCardId] = useState<string | null>(null)
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({})

  const board = getBoard(boardId)
  const selectedCard = selectedCardId ? getCard(selectedCardId) : null

  // Template for new cards - memoized to prevent useEffect reset on every render
  const newCardTemplate: Card = useMemo(() => ({
    id: 'new-card-temp',
    boardId,
    name: '',
    imageKey: null,
    thumbnailKey: null,
    imageCrop: null,
    notes: '',
    metadata: {},
    rank: cards.length + 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }), [boardId, cards.length])

  if (!board) {
    return <BoardNotFound onBack={onBack} />
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    reorderCards(fromIndex, toIndex)
  }

  const handleCardTap = (cardId: string) => {
    setSelectedCardId(cardId)
    onCardTap?.(cardId)
  }

  const handleAddCard = () => {
    setIsAddingCard(true)
    onAddCard?.()
  }

  const handleCloseModal = () => {
    setSelectedCardId(null)
    setIsAddingCard(false)
  }

  const handleSaveCard = (updates: Partial<Card>) => {
    if (isAddingCard) {
      // Create new card
      const newCard = createCard(updates.name || 'Unnamed')
      // Update notes if provided
      if (updates.notes) {
        updateCard(newCard.id, { notes: updates.notes })
      }
      setIsAddingCard(false)
    } else if (selectedCardId) {
      // Update existing card
      updateCard(selectedCardId, updates)
    }
  }

  const handleDeleteCard = (cardId: string) => {
    deleteCard(cardId)
    setSelectedCardId(null)
  }

  // Handle photo change request from modal
  const handleChangePhoto = useCallback((cardId: string) => {
    setPendingPhotoCardId(cardId)
    photoPickerTrigger?.()
  }, [photoPickerTrigger])

  // Handle photo selection from picker
  const handlePhotoSelect = useCallback(async (file: File) => {
    if (!pendingPhotoCardId) return

    try {
      // Compress the image
      const compressedBlob = await compressImage(file)

      // Create thumbnail
      const thumbnailBlob = await generateThumbnail(compressedBlob)

      // Store both images
      const imageKey = await saveImage(compressedBlob)
      const thumbnailKey = await saveImage(thumbnailBlob)

      // Update the card with image keys
      if (pendingPhotoCardId !== 'new-card-temp') {
        updateCard(pendingPhotoCardId, {
          imageKey,
          thumbnailKey,
        })
      }

      setPendingPhotoCardId(null)
    } catch (error) {
      console.error('Failed to process photo:', error)
      setPendingPhotoCardId(null)
    }
  }, [pendingPhotoCardId, saveImage, updateCard])

  // Load thumbnail URLs for cards with images
  useEffect(() => {
    let cancelled = false
    const loadedUrls: string[] = []

    const loadThumbnails = async () => {
      const urls: Record<string, string> = {}
      for (const card of cards) {
        if (cancelled) return
        if (card.thumbnailKey) {
          // Use getThumbnailUrl to get the optimized thumbnail blob
          const url = await getThumbnailUrl(card.thumbnailKey)
          if (url) {
            urls[card.id] = url
            loadedUrls.push(url)
          }
        }
      }
      if (!cancelled) {
        setThumbnailUrls(urls)
      }
    }
    loadThumbnails()

    return () => {
      cancelled = true
      // Revoke URLs on cleanup to prevent memory leaks
      loadedUrls.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [cards, getThumbnailUrl])

  return (
    <div className="min-h-full pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur-sm border-b border-[#e5e0d8]">
        <div className="flex items-center gap-2 px-2 py-3">
          <BackButton onClick={onBack} />

          <h1
            className="flex-1 text-2xl text-[#2d2d2d] truncate"
            style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
          >
            {board.name}
          </h1>

          <SaveEpisodeButton onClick={() => setShowSaveEpisodeModal(true)} />
        </div>
      </header>

      {/* Rank List */}
      <RankList
        cards={cards}
        thumbnailUrls={thumbnailUrls}
        onReorder={handleReorder}
        onCardTap={handleCardTap}
      />

      {/* Add Card FAB */}
      <AddCardFAB onClick={handleAddCard} />

      {/* Card Detail Modal - Edit Mode */}
      {selectedCard && (
        <CardDetailModal
          isOpen={!!selectedCardId}
          card={selectedCard}
          imageUrl={selectedCard.thumbnailKey ? thumbnailUrls[selectedCard.id] : null}
          onClose={handleCloseModal}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
          onChangePhoto={() => handleChangePhoto(selectedCard.id)}
        />
      )}

      {/* Card Detail Modal - Add Mode */}
      {isAddingCard && (
        <CardDetailModal
          isOpen={isAddingCard}
          card={newCardTemplate}
          isNewCard
          onClose={handleCloseModal}
          onSave={handleSaveCard}
          onDelete={() => {}} // Not used in add mode
          onChangePhoto={() => handleChangePhoto('new-card-temp')}
        />
      )}

      {/* Photo Picker (hidden file input) */}
      {/* Note: We wrap the trigger in an arrow function to prevent React from
          interpreting it as a functional state updater and calling it immediately */}
      <PhotoPicker
        onPhotoSelect={handlePhotoSelect}
        onTriggerReady={(trigger) => setPhotoPickerTrigger(() => trigger)}
      />

      {/* Save Episode Modal */}
      <SaveEpisodeModal
        isOpen={showSaveEpisodeModal}
        suggestedEpisodeNumber={nextEpisodeNumber}
        boardName={board.name}
        onClose={() => setShowSaveEpisodeModal(false)}
        onSave={(episodeNumber, label, notes) => {
          try {
            createSnapshot(cards, { episodeNumber, label, notes })
            setShowSaveEpisodeModal(false)
          } catch (error) {
            console.error('Failed to save snapshot:', error)
            // Keep modal open so user knows save failed
            showToast('Failed to save episode. Please try again.', 'error')
          }
        }}
      />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}
