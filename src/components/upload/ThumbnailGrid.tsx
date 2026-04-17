import type { UploadedFile } from '../../types'

interface ThumbnailGridProps {
  files: UploadedFile[]
  onRemove: (id: string) => void
}

export default function ThumbnailGrid({ files, onRemove }: ThumbnailGridProps) {
  if (files.length === 0) return null

  return (
    <div className="flex gap-3 overflow-x-auto py-2 -mx-1 px-1">
      {files.map((file) => (
        <div
          key={file.id}
          className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-surface-light border border-border group"
        >
          {file.isVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-surface-light">
              <div className="text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted mx-auto">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                <span className="text-[10px] text-text-muted mt-1 block">Video</span>
              </div>
            </div>
          ) : (
            <img
              src={file.preview}
              alt={file.file.name}
              className="w-full h-full object-cover"
            />
          )}

          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(file.id)
            }}
            className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Remove ${file.file.name}`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M2 2l6 6M8 2l-6 6" />
            </svg>
          </button>

          {/* Filename */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
            <p className="text-[10px] text-white truncate">{file.file.name}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
