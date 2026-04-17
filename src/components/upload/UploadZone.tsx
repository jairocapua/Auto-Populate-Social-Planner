import { useRef } from 'react'
import { cn } from '../../utils/cn'
import { ACCEPT_STRING } from '../../utils/fileHelpers'

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void
  isDragging: boolean
  dragHandlers: {
    onDragEnter: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
  disabled?: boolean
}

export default function UploadZone({ onFilesAdded, isDragging, dragHandlers, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) onFilesAdded(files)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div
      {...dragHandlers}
      onClick={handleClick}
      className={cn(
        'relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all',
        isDragging
          ? 'border-accent bg-accent/5 scale-[1.01]'
          : 'border-border hover:border-text-muted hover:bg-surface-light/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_STRING}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17,8 12,3 7,8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p className="text-text-primary font-medium">
            {isDragging ? 'Drop your files here' : 'Drag & drop photos or videos'}
          </p>
          <p className="text-text-muted text-sm mt-1">
            JPG, PNG, HEIC, MP4, MOV — up to 4 files
          </p>
        </div>
      </div>
    </div>
  )
}
