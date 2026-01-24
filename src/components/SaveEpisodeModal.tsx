import { useState, useEffect } from 'react'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

export interface SaveEpisodeModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Suggested next episode number */
  suggestedEpisodeNumber: number
  /** Board name for display */
  boardName: string
  /** Called when modal should close */
  onClose: () => void
  /** Called when episode should be saved */
  onSave: (episodeNumber: number, label: string, notes: string) => void
}

/**
 * SaveEpisodeModal Component
 *
 * A bottom sheet modal for saving a ranking snapshot.
 * Captures episode number, optional custom label, and notes.
 */
export const SaveEpisodeModal = ({
  isOpen,
  suggestedEpisodeNumber,
  boardName,
  onClose,
  onSave,
}: SaveEpisodeModalProps) => {
  const [episodeNumber, setEpisodeNumber] = useState(suggestedEpisodeNumber)
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')

  // Reset form when modal opens with new suggested number
  useEffect(() => {
    if (isOpen) {
      setEpisodeNumber(suggestedEpisodeNumber)
      setLabel('')
      setNotes('')
    }
  }, [isOpen, suggestedEpisodeNumber])

  const handleSave = () => {
    const finalLabel = label.trim() || `Episode ${episodeNumber}`
    onSave(episodeNumber, finalLabel, notes.trim())
    onClose()
  }

  const handleEpisodeNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      setEpisodeNumber(value)
    }
  }

  const footerContent = (
    <div className="flex gap-3">
      <Button variant="secondary" onClick={onClose} className="flex-1">
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave} className="flex-1">
        Save Snapshot
      </Button>
    </div>
  )

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Save Episode Rankings"
      footer={footerContent}
    >
      <div className="space-y-6">
        {/* Board Name Display */}
        <div
          className="text-center text-[#9a958d]"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          Saving rankings for <span className="text-[#2d2d2d] font-bold">{boardName}</span>
        </div>

        {/* Episode Number Input */}
        <div>
          <label
            className="block text-[#2d2d2d] mb-2"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Episode Number
          </label>
          <input
            type="number"
            min={1}
            value={episodeNumber}
            onChange={handleEpisodeNumberChange}
            className="
              w-24 px-4 py-2
              bg-white
              border-[3px] border-[#2d2d2d]
              shadow-[4px_4px_0px_0px_#2d2d2d]
              text-center text-lg
              focus:outline-none focus:ring-0
            "
            style={{
              fontFamily: "'Patrick Hand', cursive",
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            }}
          />
        </div>

        {/* Custom Label Input */}
        <Input
          label="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`Episode ${episodeNumber}`}
        />

        {/* Notes Input */}
        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., 'After the pool date disaster'"
          multiline
          rows={2}
        />
      </div>
    </BottomSheet>
  )
}
