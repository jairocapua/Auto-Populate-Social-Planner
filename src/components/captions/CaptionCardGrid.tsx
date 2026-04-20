import type { CaptionData, UploadedFile } from '../../types'
import { PLATFORMS, PLATFORM_MAP } from '../../constants/platforms'
import CaptionCard from './CaptionCard'
import Spinner from '../ui/Spinner'

interface CaptionCardGridProps {
  captions: CaptionData[]
  isGenerating: boolean
  files: UploadedFile[]
  onCaptionChange: (index: number, caption: string) => void
  onDateChange: (index: number, date: string) => void
  onSchedule: (index: number) => void
}

export default function CaptionCardGrid({
  captions,
  isGenerating,
  files,
  onCaptionChange,
  onDateChange,
  onSchedule,
}: CaptionCardGridProps) {
  const imagePreview = files.find((f) => !f.isVideo)?.preview
  if (isGenerating) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map((p) => (
          <div
            key={p.id}
            className="bg-surface border border-border rounded-xl overflow-hidden animate-pulse"
          >
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderLeft: `4px solid ${p.color}` }}>
              <span className="font-heading font-bold text-sm">{p.name}</span>
            </div>
            <div className="px-4 pb-4 space-y-3">
              <div className="h-[120px] bg-surface-light rounded-lg flex items-center justify-center">
                <Spinner size="sm" />
              </div>
              <div className="h-4 bg-surface-light rounded w-1/3" />
              <div className="h-10 bg-surface-light rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (captions.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {captions.map((caption, index) => {
        const config = PLATFORM_MAP[caption.platform]
        if (!config) return null
        return (
          <CaptionCard
            key={caption.platform}
            data={caption}
            config={config}
            animationDelay={index * 70}
            imagePreview={imagePreview}
            onCaptionChange={(text) => onCaptionChange(index, text)}
            onDateChange={(date) => onDateChange(index, date)}
            onSchedule={() => onSchedule(index)}
          />
        )
      })}
    </div>
  )
}
