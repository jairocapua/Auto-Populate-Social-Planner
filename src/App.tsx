import { useState, useCallback, useEffect } from 'react'
import type { CaptionData } from './types'
import { useFileUpload } from './hooks/useFileUpload'
import { useCaptionGeneration } from './hooks/useCaptionGeneration'
import { useToast } from './hooks/useToast'
import { useScheduledPosts } from './hooks/useScheduledPosts'
import { schedulePost } from './services/scheduler'
import LoginScreen from './components/auth/LoginScreen'
import Header from './components/layout/Header'
import { getToken, clearToken, registerUnauthorizedHandler } from './services/auth'
import UploadZone from './components/upload/UploadZone'
import ThumbnailGrid from './components/upload/ThumbnailGrid'
import GenerateButton from './components/actions/GenerateButton'
import CaptionCardGrid from './components/captions/CaptionCardGrid'
import ScheduleAllButton from './components/actions/ScheduleAllButton'
import ToastContainer from './components/feedback/ToastContainer'
import SystemPromptViewer from './components/ui/SystemPromptViewer'
import ConfirmScheduleModal from './components/ui/ConfirmScheduleModal'
import ScheduledPostsPanel from './components/schedule/ScheduledPostsPanel'
import { PLATFORM_MAP } from './constants/platforms'

const SESSION_KEY = 'roofpost_captions'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getToken() !== null)

  const handleLogout = useCallback(() => {
    clearToken()
    setIsAuthenticated(false)
  }, [])

  useEffect(() => {
    registerUnauthorizedHandler(handleLogout)
  }, [handleLogout])

  const { toasts, addToast, removeToast } = useToast()
  const { files, addFiles, removeFile, isDragging, dragHandlers } = useFileUpload(
    (msg) => addToast('error', msg)
  )
  const { generate, isGenerating } = useCaptionGeneration()
  const {
    posts: scheduledPosts,
    isLoading: isLoadingScheduled,
    error: scheduledError,
    partial: scheduledPartial,
    refresh: refreshScheduled,
  } = useScheduledPosts()

  const [captions, setCaptions] = useState<CaptionData[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (!saved) return []
      const parsed = JSON.parse(saved) as CaptionData[]
      if (parsed.every((c) => c.scheduled)) {
        sessionStorage.removeItem(SESSION_KEY)
        return []
      }
      return parsed
    } catch {
      return []
    }
  })
  useEffect(() => {
    if (captions.length > 0) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(captions))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }, [captions])

  const [customPrompt, setCustomPrompt] = useState(() =>
    sessionStorage.getItem('roofpost_prompt') ?? ''
  )

  useEffect(() => {
    if (customPrompt) {
      sessionStorage.setItem('roofpost_prompt', customPrompt)
    } else {
      sessionStorage.removeItem('roofpost_prompt')
    }
  }, [customPrompt])
  const [pendingConfirm, setPendingConfirm] = useState<{ type: 'single'; index: number } | { type: 'all' } | null>(null)

  const handleGenerate = useCallback(async () => {
    if (files.length === 0) return
    const result = await generate(files, customPrompt)
    if (result.ok) {
      setCaptions(result.captions)
      addToast('success', 'Captions generated for all 4 platforms!')
    } else {
      addToast('error', result.error)
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
        refreshScheduled()
      } else if (result.error === 'upload_failed') {
        addToast('error', `Failed to upload image for ${caption.platform}: ${result.details || 'GHL Media Library rejected the upload'}`)
      } else {
        addToast('error', `Failed to schedule ${caption.platform}: ${result.details || 'GHL rejected the post'}`)
      }
    },
    [captions, files, addToast, refreshScheduled]
  )

  const handleScheduleAll = useCallback(async () => {
    for (let i = 0; i < captions.length; i++) {
      if (!captions[i].scheduled) {
        await handleSchedule(i)
      }
    }
  }, [captions, handleSchedule])

  const handleConfirm = useCallback(async () => {
    if (!pendingConfirm) return
    const snapshot = pendingConfirm
    setPendingConfirm(null)
    if (snapshot.type === 'single') {
      await handleSchedule(snapshot.index)
    } else {
      await handleScheduleAll()
    }
  }, [pendingConfirm, handleSchedule, handleScheduleAll])

  const allScheduled = captions.length > 0 && captions.every((c) => c.scheduled)
  const hasUnscheduled = captions.some((c) => !c.scheduled)

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary font-body">
      <Header onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Scheduled posts panel (read-only, GHL) */}
        <ScheduledPostsPanel
          posts={scheduledPosts}
          isLoading={isLoadingScheduled}
          error={scheduledError}
          partial={scheduledPartial}
          onRefresh={refreshScheduled}
        />

        {/* Upload zone */}
        <UploadZone
          onFilesAdded={addFiles}
          isDragging={isDragging}
          dragHandlers={dragHandlers}
          disabled={isGenerating}
        />

        {/* Thumbnail previews */}
        <ThumbnailGrid files={files} onRemove={removeFile} />

        {/* System prompt viewer */}
        <SystemPromptViewer />

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
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 resize-none hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 transition-colors"
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
          files={files}
          onCaptionChange={handleCaptionChange}
          onDateChange={handleDateChange}
          onSchedule={(index) => setPendingConfirm({ type: 'single', index })}
        />

        {/* Schedule All button */}
        {captions.length > 0 && (
          <ScheduleAllButton
            onClick={() => setPendingConfirm({ type: 'all' })}
            disabled={!hasUnscheduled}
            allScheduled={allScheduled}
          />
        )}
      </main>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Confirmation modal */}
      {pendingConfirm && (() => {
        if (pendingConfirm.type === 'single') {
          const caption = captions[pendingConfirm.index]
          const config = PLATFORM_MAP[caption.platform]
          if (!caption || !config) return null
          return (
            <ConfirmScheduleModal
              payload={{ type: 'single', caption, config }}
              onConfirm={handleConfirm}
              onCancel={() => setPendingConfirm(null)}
            />
          )
        }
        const items = captions
          .filter((c) => !c.scheduled)
          .map((c) => ({ caption: c, config: PLATFORM_MAP[c.platform] }))
          .filter((item) => item.config != null)
        return (
          <ConfirmScheduleModal
            payload={{ type: 'all', items }}
            onConfirm={handleConfirm}
            onCancel={() => setPendingConfirm(null)}
          />
        )
      })()}
    </div>
  )
}
