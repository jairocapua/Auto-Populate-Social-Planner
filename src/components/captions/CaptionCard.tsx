import { useRef, useEffect, useState } from 'react'
import type { CaptionData, PlatformConfig } from '../../types'
import { reviseCaption } from '../../services/openai'
import CharCounter from './CharCounter'
import Button from '../ui/Button'
import { cn } from '../../utils/cn'

interface CaptionCardProps {
  data: CaptionData
  config: PlatformConfig
  animationDelay: number
  onCaptionChange: (caption: string) => void
  onDateChange: (date: string) => void
  onSchedule: () => void
}

export default function CaptionCard({
  data,
  config,
  animationDelay,
  onCaptionChange,
  onDateChange,
  onSchedule,
}: CaptionCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [reviseInput, setReviseInput] = useState('')
  const [isRevising, setIsRevising] = useState(false)
  const [reviseError, setReviseError] = useState<string | null>(null)

  // Auto-expand textarea to fit content
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [data.caption])

  async function handleRevise() {
    if (!reviseInput.trim() || isRevising) return
    setIsRevising(true)
    setReviseError(null)
    try {
      const revised = await reviseCaption(data.platform, data.caption, reviseInput.trim())
      onCaptionChange(revised)
      setReviseInput('')
    } catch (err) {
      setReviseError(err instanceof Error ? err.message : 'Revision failed')
    } finally {
      setIsRevising(false)
    }
  }

  return (
    <div
      className="opacity-0 animate-fade-in-up bg-surface border border-border rounded-xl overflow-hidden"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Color stripe header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderLeft: `4px solid ${config.color}` }}>
        <span className="font-heading font-bold text-sm">{config.name}</span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: `${config.color}20`, color: config.color }}
        >
          {config.charLimit.toLocaleString()} chars
        </span>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Editable caption — auto-expanding */}
        <textarea
          ref={textareaRef}
          value={data.caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          disabled={data.scheduled}
          className={cn(
            'w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary',
            'placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
            'transition-colors resize-none overflow-hidden min-h-[80px]',
            data.scheduled && 'opacity-60 cursor-not-allowed'
          )}
        />

        {/* Character counter */}
        <CharCounter current={data.caption.length} limit={config.charLimit} />

        {/* Revise caption panel */}
        {!data.scheduled && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted">Revise this caption:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={reviseInput}
                onChange={(e) => setReviseInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRevise()}
                disabled={isRevising}
                placeholder={`e.g. Make it shorter, add a joke…`}
                className={cn(
                  'flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text-primary',
                  'placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent',
                  'transition-colors disabled:opacity-50'
                )}
              />
              <button
                onClick={handleRevise}
                disabled={!reviseInput.trim() || isRevising}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0',
                  'border border-border bg-surface-light text-text-primary',
                  'hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed'
                )}
                style={{ borderColor: reviseInput.trim() && !isRevising ? config.color : undefined, color: reviseInput.trim() && !isRevising ? config.color : undefined }}
              >
                {isRevising ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Revising
                  </span>
                ) : 'Revise'}
              </button>
            </div>
            {reviseError && (
              <p className="text-xs text-red-400">{reviseError}</p>
            )}
          </div>
        )}

        {/* Schedule date picker */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs text-text-muted shrink-0">Schedule:</label>
          <input
            type="datetime-local"
            value={data.scheduleDate}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={data.scheduled}
            className={cn(
              'bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text-primary',
              'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors',
              'w-full sm:w-auto',
              data.scheduled && 'opacity-60 cursor-not-allowed'
            )}
          />
        </div>

        {/* Schedule button */}
        {data.scheduled ? (
          <Button variant="success" className="w-full" disabled>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.3 5.3L7 9.6 4.7 7.3a1 1 0 00-1.4 1.4l3 3a1 1 0 001.4 0l5-5a1 1 0 00-1.4-1.4z" />
            </svg>
            Scheduled
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            onClick={onSchedule}
            disabled={data.caption.length === 0}
          >
            Approve & Schedule
          </Button>
        )}
      </div>
    </div>
  )
}
