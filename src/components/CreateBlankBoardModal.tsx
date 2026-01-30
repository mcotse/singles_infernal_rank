/**
 * CreateBlankBoardModal Component
 *
 * A simple modal for creating a new blank board with just a name.
 */

import { useState } from 'react'
import { Button } from './ui/Button'
import { wobbly } from '../styles/wobbly'

export interface CreateBlankBoardModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Called when the modal should close */
  onClose: () => void
  /** Called when a board is created with the given name */
  onCreate: (name: string) => void
}

export const CreateBlankBoardModal = ({
  isOpen,
  onClose,
  onCreate,
}: CreateBlankBoardModalProps) => {
  const [name, setName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim())
      setName('')
      onClose()
    }
  }

  const handleClose = () => {
    setName('')
    onClose()
  }

  return (
    <div
      data-testid="create-board-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative bg-[#fdfbf7] border-[3px] border-[#2d2d2d] p-6 w-full max-w-sm shadow-[8px_8px_0px_0px_#2d2d2d]"
        style={{ borderRadius: wobbly.lg }}
      >
        <h2
          className="text-2xl text-[#2d2d2d] mb-4"
          style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
        >
          New Ranking Board
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name..."
            autoFocus
            className="w-full px-4 py-3 mb-4 border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] placeholder:text-[#9a958d]"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '1.125rem',
              borderRadius: wobbly.sm,
            }}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!name.trim()}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
