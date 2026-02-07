import { useState, useCallback, useEffect, useMemo } from 'react'
import { useBoards } from '../hooks/useBoards'
import { useCards } from '../hooks/useCards'
import { useImageStorage } from '../hooks/useImageStorage'
import { useSnapshots } from '../hooks/useSnapshots'
import { useSpaceBoard } from '../hooks/useSpaceBoard'
import { RankList } from '../components/RankList'
import { CardDetailModal } from '../components/CardDetailModal'
import { EditBoardSheet } from '../components/EditBoardSheet'
import { PhotoPicker } from '../components/PhotoPicker'
import { SaveEpisodeModal } from '../components/SaveEpisodeModal'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { wobbly } from '../styles/wobbly'
import { compressImage, generateThumbnail } from '../lib/imageUtils'
import { perfTiming } from '../lib/perfTiming'
import type { Card, Board } from '../lib/types'
import type { SpaceCard } from '../lib/spaceTypes'

interface BoardDetailPageProps {
  /** ID of the board to display */
  boardId: string
  /** Called when user wants to go back */
  onBack: () => void
  /** Called when a card is tapped for editing */
  onCardTap?: (cardId: string) => void
  /** Called when add card button is pressed */
  onAddCard?: () => void
  /** Space ID if viewing from a space (for Firestore fetch) */
  spaceId?: string
  /** Owner ID of the board (for determining edit permissions) */
  ownerId?: string
  /** Whether viewing in read-only mode (another user's board) */
  isReadOnly?: boolean
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
 * Edit board button
 */
const EditBoardButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Edit board"
    className="
      flex items-center justify-center
      w-10 h-10
      text-[#2d2d2d] text-xl
      hover:text-[#2d5da1]
      transition-colors
    "
  >
    ✏️
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
  spaceId,
  ownerId: _ownerId, // Used for future compare feature
  isReadOnly = false,
}: BoardDetailPageProps) => {
  // Local data hooks (for own boards)
  const { getBoard, updateBoard, softDeleteBoard } = useBoards()
  const { cards: localCards, reorderCards, updateCard, deleteCard, createCard } = useCards(boardId)
  const { saveImage, getThumbnailUrls, getImageUrl } = useImageStorage()
  const { createSnapshot, nextEpisodeNumber } = useSnapshots(boardId)
  const { showToast, ToastContainer } = useToast()

  // Firestore data (for viewing others' boards in a space)
  const { board: spaceBoard, cards: spaceCards, isLoading: spaceLoading } = useSpaceBoard(
    isReadOnly ? spaceId ?? null : null,
    isReadOnly ? boardId : null
  )

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [showSaveEpisodeModal, setShowSaveEpisodeModal] = useState(false)
  const [showEditBoardSheet, setShowEditBoardSheet] = useState(false)
  const [photoPickerTrigger, setPhotoPickerTrigger] = useState<(() => void) | null>(null)
  const [pendingPhotoCardId, setPendingPhotoCardId] = useState<string | null>(null)
  const [pendingBoardCoverPhoto, setPendingBoardCoverPhoto] = useState(false)
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({})
  const [loadingCardIds, setLoadingCardIds] = useState<Set<string>>(new Set())
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

  // Determine data source: local or Firestore
  const localBoard = getBoard(boardId)
  const board = isReadOnly ? spaceBoard : localBoard

  // Convert SpaceCards to Card-like objects for display
  // SpaceCards have imageUrl/thumbnailUrl instead of imageKey/thumbnailKey
  const cards: Card[] = useMemo(() => {
    if (isReadOnly && spaceCards.length > 0) {
      // Map SpaceCards to Cards for the RankList
      return spaceCards.map((sc: SpaceCard) => ({
        id: sc.id,
        boardId: sc.boardId,
        name: sc.name,
        nickname: sc.nickname,
        imageKey: null, // SpaceCards don't have IndexedDB keys
        thumbnailKey: null,
        imageCrop: null,
        notes: sc.notes,
        metadata: {},
        rank: sc.rank,
        createdAt: sc.syncedAt,
        updatedAt: sc.syncedAt,
      }))
    }
    return localCards
  }, [isReadOnly, spaceCards, localCards])

  // For space cards, use the thumbnailUrl directly instead of loading from IndexedDB
  const spaceThumbnailUrls = useMemo(() => {
    if (!isReadOnly) return {}
    const urls: Record<string, string> = {}
    spaceCards.forEach((sc: SpaceCard) => {
      if (sc.thumbnailUrl) {
        urls[sc.id] = sc.thumbnailUrl
      }
    })
    return urls
  }, [isReadOnly, spaceCards])

  const selectedCard = selectedCardId ? cards.find(c => c.id === selectedCardId) : null

  // Template for new cards - memoized to prevent useEffect reset on every render
  const newCardTemplate: Card = useMemo(() => ({
    id: 'new-card-temp',
    boardId,
    name: '',
    nickname: '',
    imageKey: null,
    thumbnailKey: null,
    imageCrop: null,
    notes: '',
    metadata: {},
    rank: cards.length + 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }), [boardId, cards.length])

  // Show loading state for space boards
  if (isReadOnly && spaceLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📋</div>
          <p
            className="text-[#9a958d]"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Loading board...
          </p>
        </div>
      </div>
    )
  }

  if (!board) {
    return <BoardNotFound onBack={onBack} />
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (isReadOnly) return // Don't allow reordering in read-only mode
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
    // Handle board cover photo
    if (pendingBoardCoverPhoto) {
      try {
        const compressedBlob = await compressImage(file)
        const imageKey = await saveImage(compressedBlob)
        updateBoard(boardId, { coverImage: imageKey })
        setPendingBoardCoverPhoto(false)
      } catch (error) {
        console.error('Failed to process board cover photo:', error)
        setPendingBoardCoverPhoto(false)
      }
      return
    }

    // Handle card photo
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
  }, [pendingPhotoCardId, pendingBoardCoverPhoto, boardId, saveImage, updateCard, updateBoard])

  // Handle board cover photo change
  const handleChangeBoardCoverPhoto = useCallback(() => {
    setPendingBoardCoverPhoto(true)
    photoPickerTrigger?.()
  }, [photoPickerTrigger])

  // Handle board save
  const handleSaveBoard = useCallback((updates: Partial<Omit<Board, 'id' | 'createdAt'>>) => {
    updateBoard(boardId, updates)
  }, [boardId, updateBoard])

  // Handle board delete
  const handleDeleteBoard = useCallback(() => {
    softDeleteBoard(boardId)
    onBack()
  }, [boardId, softDeleteBoard, onBack])

  // Load thumbnail URLs for cards with images - BATCH loading for speed
  useEffect(() => {
    let cancelled = false
    const loadedUrls: string[] = []

    const loadThumbnails = async () => {
      // Find cards with thumbnails to load
      const cardsWithThumbnails = cards.filter(card => card.thumbnailKey)

      if (cardsWithThumbnails.length === 0) {
        setThumbnailUrls({})
        setLoadingCardIds(new Set())
        return
      }

      // Set loading state for cards with thumbnails
      const cardIds = new Set(cardsWithThumbnails.map(c => c.id))
      setLoadingCardIds(cardIds)

      // Start timing
      perfTiming.mark('thumbnails-start')

      // Batch load all thumbnails in a single IndexedDB transaction
      const thumbnailKeys = cardsWithThumbnails.map(c => c.thumbnailKey!)
      const urlMap = await getThumbnailUrls(thumbnailKeys)

      if (cancelled) return

      // Build urls record and track for cleanup
      const urls: Record<string, string> = {}
      for (const card of cardsWithThumbnails) {
        const url = urlMap.get(card.thumbnailKey!)
        if (url) {
          urls[card.id] = url
          loadedUrls.push(url)
        }
      }

      // Measure and log timing
      perfTiming.measure('thumbnails-total', 'thumbnails-start')

      // Update state
      setThumbnailUrls(urls)
      setLoadingCardIds(new Set())
    }
    loadThumbnails()

    return () => {
      cancelled = true
      // Revoke URLs on cleanup to prevent memory leaks
      loadedUrls.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [cards, getThumbnailUrls])

  // Load cover image URL when board has a cover image
  useEffect(() => {
    let cancelled = false
    let loadedUrl: string | null = null

    const loadCoverImage = async () => {
      if (!board?.coverImage) {
        setCoverImageUrl(null)
        return
      }

      // For space boards, coverImage is already a Firebase Storage URL
      if (isReadOnly && board.coverImage.startsWith('http')) {
        setCoverImageUrl(board.coverImage)
        return
      }

      // For local boards, load from IndexedDB
      const url = await getImageUrl(board.coverImage)
      if (!cancelled && url) {
        loadedUrl = url
        setCoverImageUrl(url)
      }
    }
    loadCoverImage()

    return () => {
      cancelled = true
      if (loadedUrl) {
        URL.revokeObjectURL(loadedUrl)
      }
    }
  }, [board?.coverImage, getImageUrl, isReadOnly])

  // Combine thumbnail URLs from space (Firebase) and local (IndexedDB)
  const combinedThumbnailUrls = isReadOnly ? spaceThumbnailUrls : thumbnailUrls

  // Get owner name for read-only banner
  const ownerName = isReadOnly && spaceBoard ? spaceBoard.ownerName : null

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

          {/* Only show edit controls if not read-only */}
          {!isReadOnly && (
            <>
              <EditBoardButton onClick={() => setShowEditBoardSheet(true)} />
              <SaveEpisodeButton onClick={() => setShowSaveEpisodeModal(true)} />
            </>
          )}
        </div>

        {/* Read-only owner banner */}
        {isReadOnly && ownerName && (
          <div
            className="px-4 py-2 bg-[#fff9c4] border-t border-[#e5e0d8] text-center"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            <span className="text-[#2d2d2d]">
              Viewing <strong>{ownerName}&apos;s</strong> rankings
            </span>
          </div>
        )}
      </header>

      {/* Rank List */}
      <RankList
        cards={cards}
        thumbnailUrls={combinedThumbnailUrls}
        loadingCardIds={loadingCardIds}
        onReorder={handleReorder}
        onCardTap={handleCardTap}
        isReadOnly={isReadOnly}
      />

      {/* Add Card FAB - only show if not read-only */}
      {!isReadOnly && <AddCardFAB onClick={handleAddCard} />}

      {/* Card Detail Modal - Edit/View Mode */}
      {selectedCard && (
        <CardDetailModal
          isOpen={!!selectedCardId}
          card={selectedCard}
          imageUrl={combinedThumbnailUrls[selectedCard.id] || null}
          onClose={handleCloseModal}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
          onChangePhoto={() => handleChangePhoto(selectedCard.id)}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Card Detail Modal - Add Mode (only when not read-only) */}
      {!isReadOnly && isAddingCard && (
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

      {/* Photo Picker (hidden file input) - only when not read-only */}
      {!isReadOnly && (
        <PhotoPicker
          onPhotoSelect={handlePhotoSelect}
          onTriggerReady={(trigger) => setPhotoPickerTrigger(() => trigger)}
        />
      )}

      {/* Save Episode Modal - only when not read-only */}
      {!isReadOnly && (
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
      )}

      {/* Edit Board Sheet - only when not read-only */}
      {!isReadOnly && (
        <EditBoardSheet
          isOpen={showEditBoardSheet}
          board={board}
          coverImageUrl={coverImageUrl}
          onClose={() => setShowEditBoardSheet(false)}
          onSave={handleSaveBoard}
          onDelete={handleDeleteBoard}
          onChangePhoto={handleChangeBoardCoverPhoto}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}
