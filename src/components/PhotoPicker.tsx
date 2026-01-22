import { useRef, useEffect, type ChangeEvent } from 'react'

export interface PhotoPickerProps {
  /** Called when a photo file is selected */
  onPhotoSelect: (file: File) => void
  /** Called with trigger function when component mounts */
  onTriggerReady?: (trigger: () => void) => void
}

/**
 * PhotoPicker Component
 *
 * A hidden file input that opens the device's photo picker.
 * Use onTriggerReady to get a function that opens the picker.
 *
 * Example:
 * ```tsx
 * const [trigger, setTrigger] = useState<(() => void) | null>(null)
 *
 * <PhotoPicker
 *   onPhotoSelect={handlePhoto}
 *   onTriggerReady={setTrigger}
 * />
 *
 * <button onClick={() => trigger?.()}>Choose Photo</button>
 * ```
 */
export const PhotoPicker = ({
  onPhotoSelect,
  onTriggerReady,
}: PhotoPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // Expose trigger function to parent
  useEffect(() => {
    if (onTriggerReady && inputRef.current) {
      onTriggerReady(() => {
        inputRef.current?.click()
      })
    }
  }, [onTriggerReady])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onPhotoSelect(file)
      // Reset input to allow selecting same file again
      e.target.value = ''
    }
  }

  return (
    <input
      ref={inputRef}
      data-testid="photo-input"
      type="file"
      accept="image/*"
      onChange={handleChange}
      className="hidden"
    />
  )
}
