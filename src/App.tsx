import { useState, useCallback } from 'react'
import type { CaptionData } from './types'
import { useFileUpload } from './hooks/useFileUpload'
import { useCaptionGeneration } from './hooks/useCaptionGeneration'
import { useToast } from './hooks/useToast'
import { schedulePost } from './services/scheduler'
import Header from './components/layout/Header'
import UploadZone from './components/upload/UploadZone'
import ThumbnailGrid from './components/upload/ThumbnailGrid'
import GenerateButton from './components/actions/GenerateButton'
import CaptionCardGrid from './components/captions/CaptionCardGrid'
import ScheduleAllButton from './components/actions/ScheduleAllButton'
import ToastContainer from './components/feedback/ToastContainer'

export default function App() {
  const { toasts, addToast, removeToast } = useToast()
  const { files, addFiles, removeFile, isDragging, dragHandlers } = useFileUpload(
    (msg) => addToast('error', msg)
  )
  const { generate, isGenerating } = useCaptionGeneration()

  const [captions, setCaptions] = useState<CaptionData[]>([])
  const [customPrompt, setCustomPrompt] = useState('')

  const handleGenerate = useCallback(async () => {
    if (files.length === 0) return
    const result = await generate(files, customPrompt)
    if (result) {
      setCaptions(result)
      addToast('success', 'Captions generated for all 4 platforms!')
    } else {
      addToast('error', 'Failed to generate captions. Please try again.')
    }
  }, [files, generate, customPrompt, addToast])

  const handleCaptionChange = useCallback((index: number, caption: string) => {
    setCaptions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, caption } : c))
    )
  }, [])

  const handleDateChange = useCallback((index: number, scheduleDate: string) => {
    setCaptions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, scheduleDate } : c))
    )
  }, [])

  const handleSchedule = useCallback(
    async (index: number) => {
      const caption = captions[index]
      if (!caption) return

      const result = await schedulePost(caption, files)
      if (result.ok) {
        setCaptions((prev) =>
          prev.map((c, i) => (i === index ? { ...c, scheduled: true } : c))
        )
        addToast('success', `${caption.platform} post scheduled!`)
      } else if (result.error === 'upload_failed') {
        addToast('error', `Failed to upload image for ${caption.platform}.`)
      } else {
        addToast('error', `Failed to schedule ${caption.platform}: ${result.details || 'GHL rejected the post'}`)
      }
    },
    [captions, files, addToast]
  )

  const handleScheduleAll = useCallback(async () => {
    for (let i = 0; i < captions.length; i++) {
      if (!captions[i].scheduled) {
        await handleSchedule(i)
      }
    }
  }, [captions, handleSchedule])

  const allScheduled = captions.length > 0 && captions.every((c) => c.scheduled)
  const hasUnscheduled = captions.some((c) => !c.scheduled)

  return (
    <div className="min-h-screen bg-bg text-text-primary font-body">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Upload zone */}
        <UploadZone
          onFilesAdded={addFiles}
          isDragging={isDragging}
          dragHandlers={dragHandlers}
          disabled={isGenerating}
        />

        {/* Thumbnail previews */}
        <ThumbnailGrid files={files} onRemove={removeFile} />

        {/* Optional custom prompt */}
        {files.length > 0 && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-secondary">
              Custom instructions <span className="font-normal opacity-60">(optional)</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g. Mention we used Redland tiles. Keep the tone friendly. Focus on the before/after transformation."
              rows={3}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 transition"
            />
          </div>
        )}

        {/* Generate button */}
        {files.length > 0 && (
          <GenerateButton
            onClick={handleGenerate}
            disabled={files.length === 0}
            isGenerating={isGenerating}
          />
        )}

        {/* Caption cards */}
        <CaptionCardGrid
          captions={captions}
          isGenerating={isGenerating}
          onCaptionChange={handleCaptionChange}
          onDateChange={handleDateChange}
          onSchedule={handleSchedule}
        />

        {/* Schedule All button */}
        {captions.length > 0 && (
          <ScheduleAllButton
            onClick={handleScheduleAll}
            disabled={!hasUnscheduled}
            allScheduled={allScheduled}
          />
        )}
      </main>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
