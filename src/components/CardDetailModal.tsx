import { useState, useEffect } from 'react'
import type { Card } from '../lib/types'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { wobbly } from '../styles/wobbly'

export interface CardDetailModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** The card being edited (or new card template for add mode) */
  card: Card
  /** Whether this is a new card being added (hides delete, changes title) */
  isNewCard?: boolean
  /** Optional URL for the card's full-size image */
  imageUrl?: string | null
  /** Called when modal should close */
  onClose: () => void
  /** Called when card should be saved */
  onSave: (updates: Partial<Card>) => void
  /** Called when card should be deleted */
  onDelete: (cardId: string) => void
  /** Called when user wants to change photo */
  onChangePhoto?: () => void
}

/**
 * Photo placeholder when no image
 */
const PhotoPlaceholder = ({ onClick }: { onClick?: () => void }) => (
  <button
    type="button"
    data-testid="photo-placeholder"
    onClick={onClick}
    className="
      w-full aspect-square max-w-[200px]
      bg-[#e5e0d8]
      border-[3px] border-dashed border-[#9a958d]
      flex flex-col items-center justify-center gap-2
      text-[#9a958d]
      hover:border-[#2d2d2d] hover:text-[#2d2d2d]
      transition-colors
      cursor-pointer
    "
    style={{ borderRadius: wobbly.lg }}
  >
    <span className="text-4xl">📷</span>
    <span
      className="text-sm"
      style={{ fontFamily: "'Patrick Hand', cursive" }}
    >
      Add Photo
    </span>
  </button>
)

/**
 * Photo display with change button
 */
const PhotoDisplay = ({
  url,
  onClick,
}: {
  url: string
  onClick?: () => void
}) => (
  <div className="relative w-full max-w-[200px]">
    <div
      className="
        aspect-square overflow-hidden
        border-[3px] border-[#2d2d2d]
        shadow-[4px_4px_0px_0px_#2d2d2d]
      "
      style={{ borderRadius: wobbly.lg }}
    >
      <img
        src={url}
        alt="Card photo"
        className="w-full h-full object-cover"
      />
    </div>
    <button
      type="button"
      onClick={onClick}
      aria-label="Change photo"
      className="
        absolute -bottom-2 -right-2
        w-10 h-10
        bg-white border-2 border-[#2d2d2d]
        shadow-[2px_2px_0px_0px_#2d2d2d]
        flex items-center justify-center
        text-lg
        hover:bg-[#ff4d4d] hover:text-white
        transition-colors
      "
      style={{ borderRadius: wobbly.circle }}
    >
      📷
    </button>
  </div>
)

/**
 * Delete confirmation dialog
 */
const DeleteConfirmation = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50"
      onClick={onCancel}
    />
    <div
      className="
        relative
        bg-[#fdfbf7] border-[3px] border-[#2d2d2d]
        shadow-[8px_8px_0px_0px_#2d2d2d]
        p-6 max-w-sm w-full
      "
      style={{ borderRadius: wobbly.lg }}
    >
      <h3
        className="text-xl text-[#2d2d2d] mb-2"
        style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
      >
        Delete Card?
      </h3>
      <p
        className="text-[#9a958d] mb-6"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        Are you sure you want to delete this card? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          className="flex-1 !bg-[#ff4d4d]"
        >
          Yes, Delete
        </Button>
      </div>
    </div>
  </div>
)

/**
 * CardDetailModal Component
 *
 * A bottom sheet modal for viewing and editing card details.
 * Features:
 * - Large photo preview with change option
 * - Name and notes editing
 * - Delete with confirmation
 * - Save changes
 */
export const CardDetailModal = ({
  isOpen,
  card,
  isNewCard = false,
  imageUrl,
  onClose,
  onSave,
  onDelete,
  onChangePhoto,
}: CardDetailModalProps) => {
  const [name, setName] = useState(card.name)
  const [nickname, setNickname] = useState(card.nickname || '')
  const [notes, setNotes] = useState(card.notes)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset form when card changes
  useEffect(() => {
    setName(card.name)
    setNickname(card.nickname || '')
    setNotes(card.notes)
    setShowDeleteConfirm(false)
  }, [card])

  const handleSave = () => {
    onSave({
      name: name.trim() || card.name, // Don't allow empty name
      nickname: nickname.trim(),
      notes,
    })
    onClose()
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    onDelete(card.id)
    setShowDeleteConfirm(false)
    onClose()
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const footerContent = (
    <div className="flex gap-3">
      {!isNewCard && (
        <Button
          variant="secondary"
          onClick={handleDelete}
          className="!text-[#ff4d4d] !border-[#ff4d4d]"
          aria-label="Delete card"
        >
          🗑️ Delete
        </Button>
      )}
      <Button
        variant="primary"
        onClick={handleSave}
        className="flex-1"
      >
        {isNewCard ? 'Add Card' : 'Save Changes'}
      </Button>
    </div>
  )

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={isNewCard ? 'Add Card' : 'Edit Card'}
        footer={footerContent}
      >
        <div className="space-y-6">
          {/* Photo Area */}
          <div data-testid="photo-area" className="flex justify-center">
            {imageUrl ? (
              <PhotoDisplay url={imageUrl} onClick={onChangePhoto} />
            ) : (
              <PhotoPlaceholder onClick={onChangePhoto} />
            )}
          </div>

          {/* Name Input */}
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
          />

          {/* Nickname Input */}
          <Input
            label="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Optional nickname..."
          />

          {/* Notes Input */}
          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            multiline
            rows={3}
          />
        </div>
      </BottomSheet>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmation
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </>
  )
}
