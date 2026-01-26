import { useState, useEffect } from 'react'
import type { Board } from '../lib/types'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { wobbly } from '../styles/wobbly'

export interface EditBoardSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean
  /** The board being edited */
  board: Board
  /** Optional URL for the board's cover image */
  coverImageUrl?: string | null
  /** Called when sheet should close */
  onClose: () => void
  /** Called when board should be saved */
  onSave: (updates: Partial<Omit<Board, 'id' | 'createdAt'>>) => void
  /** Called when board should be deleted */
  onDelete: (boardId: string) => void
  /** Called when user wants to change cover photo */
  onChangePhoto?: () => void
}

/**
 * Cover photo placeholder when no image
 */
const CoverPhotoPlaceholder = ({ onClick }: { onClick?: () => void }) => (
  <button
    type="button"
    data-testid="cover-photo-placeholder"
    onClick={onClick}
    className="
      w-full aspect-[16/9] max-w-[300px]
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
    <span className="text-4xl">🖼️</span>
    <span
      className="text-sm"
      style={{ fontFamily: "'Patrick Hand', cursive" }}
    >
      Add Cover Photo
    </span>
  </button>
)

/**
 * Cover photo display with change button
 */
const CoverPhotoDisplay = ({
  url,
  onClick,
}: {
  url: string
  onClick?: () => void
}) => (
  <div className="relative w-full max-w-[300px]">
    <div
      className="
        aspect-[16/9] overflow-hidden
        border-[3px] border-[#2d2d2d]
        shadow-[4px_4px_0px_0px_#2d2d2d]
      "
      style={{ borderRadius: wobbly.lg }}
    >
      <img
        src={url}
        alt="Board cover"
        className="w-full h-full object-cover"
      />
    </div>
    <button
      type="button"
      onClick={onClick}
      aria-label="Change cover photo"
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
      🖼️
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
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
        Delete Board?
      </h3>
      <p
        className="text-[#9a958d] mb-6"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        Are you sure you want to delete this board? It will be moved to trash for 7 days before permanent deletion.
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
 * EditBoardSheet Component
 *
 * A bottom sheet modal for editing board name and cover photo.
 * Features:
 * - Board name editing
 * - Cover photo preview and change
 * - Delete with confirmation (soft delete)
 * - Save changes
 */
export const EditBoardSheet = ({
  isOpen,
  board,
  coverImageUrl,
  onClose,
  onSave,
  onDelete,
  onChangePhoto,
}: EditBoardSheetProps) => {
  const [name, setName] = useState(board.name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset form when board changes
  useEffect(() => {
    setName(board.name)
    setShowDeleteConfirm(false)
  }, [board])

  const handleSave = () => {
    onSave({
      name: name.trim() || board.name, // Don't allow empty name
    })
    onClose()
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    onDelete(board.id)
    setShowDeleteConfirm(false)
    onClose()
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const footerContent = (
    <div className="flex gap-3">
      <Button
        variant="secondary"
        onClick={handleDelete}
        className="!text-[#ff4d4d] !border-[#ff4d4d]"
        aria-label="Delete board"
      >
        🗑️ Delete
      </Button>
      <Button
        variant="primary"
        onClick={handleSave}
        className="flex-1"
      >
        Save Changes
      </Button>
    </div>
  )

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Board"
        footer={footerContent}
      >
        <div className="space-y-6">
          {/* Cover Photo Area */}
          <div data-testid="cover-photo-area" className="flex justify-center">
            {coverImageUrl ? (
              <CoverPhotoDisplay url={coverImageUrl} onClick={onChangePhoto} />
            ) : (
              <CoverPhotoPlaceholder onClick={onChangePhoto} />
            )}
          </div>

          {/* Board Name Input */}
          <Input
            label="Board Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name..."
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
