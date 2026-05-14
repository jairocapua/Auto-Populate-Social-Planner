import { useRef, useLayoutEffect, useState } from 'react'
import type { CaptionData, PlatformConfig } from '../../types'
import { reviseCaption } from '../../services/openai'
import CharCounter from './CharCounter'
import PostMockup from './PostMockup'
import Button from '../ui/Button'
import { cn } from '../../utils/cn'

interface CaptionCardProps {
  data: CaptionData
  config: PlatformConfig
  animationDelay: number
  imagePreviews: string[]
  onCaptionChange: (caption: string) => void
  onDateChange: (date: string) => void
  onSchedule: () => void
}

export default function CaptionCard({
  data,
  config,
  animationDelay,
  imagePreviews,
  onCaptionChange,
  onDateChange,
  onSchedule,
}: CaptionCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [reviseInput, setReviseInput] = useState('')
  const [isRevising, setIsRevising] = useState(false)
  const [reviseError, setReviseError] = useState<string | null>(null)
  const [tab, setTab] = useState<'preview' | 'edit'>('preview')

  useLayoutEffect(() => {
    if (tab !== 'edit') return
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [data.caption, tab])

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
      className="opacity-0 animate-fade-in-up bg-surface border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-accent/40 transition-all"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Header: platform logo + name + tab toggle */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderLeft: `4px solid ${config.color}` }}>
        <div className="flex items-center gap-2">
          <img src={config.logoUrl} alt={config.name} className="w-5 h-5 object-contain shrink-0" />
          <span className="font-heading font-bold text-sm">{config.name}</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            {config.charLimit.toLocaleString()} chars
          </span>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-border text-xs">
          {(['preview', 'edit'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 font-medium capitalize transition-colors',
                t === 'edit' && 'border-l border-border',
                tab === t ? 'text-white' : 'bg-surface text-text-muted hover:text-text-primary'
              )}
              style={tab === t ? { backgroundColor: config.color } : {}}
            >
              {t === 'preview' ? 'Preview' : 'Edit'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview tab */}
      {tab === 'preview' && (
        <div className="p-3">
          <PostMockup
            platform={data.platform}
            caption={data.caption}
            imagePreviews={imagePreviews}
          />
        </div>
      )}

      {/* Edit tab */}
      {tab === 'edit' && (
        <div className="px-4 pt-3 pb-1 space-y-3">
          <textarea
            ref={textareaRef}
            value={data.caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            disabled={data.scheduled}
            className={cn(
              'w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary',
              'placeholder:text-text-muted hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
              'transition-colors resize-none overflow-hidden min-h-[80px]',
              data.scheduled && 'opacity-60 cursor-not-allowed'
            )}
          />

          <CharCounter current={data.caption.length} limit={config.charLimit} />

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
                  placeholder="e.g. Make it shorter, add a joke…"
                  className={cn(
                    'flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text-primary',
                    'placeholder:text-text-muted/50 hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent',
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
                  style={{
                    borderColor: reviseInput.trim() && !isRevising ? config.color : undefined,
                    color: reviseInput.trim() && !isRevising ? config.color : undefined,
                  }}
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
              {reviseError && <p className="text-xs text-red-400">{reviseError}</p>}
            </div>
          )}
        </div>
      )}

      {/* Schedule section — always visible */}
      <div className="px-4 pt-3 pb-4 border-t border-border mt-2 space-y-3">
        {/* Section label */}
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-xs font-medium text-text-muted">Schedule post</span>
        </div>

        {/* Date + Time inputs */}
        <div className="flex gap-2">
          <input
            type="date"
            value={data.scheduleDate.split('T')[0]}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => onDateChange(`${e.target.value}T${data.scheduleDate.split('T')[1] ?? '08:00'}`)}
            disabled={data.scheduled}
            className={cn(
              'flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text-primary',
              'hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
              'transition-colors cursor-pointer',
              data.scheduled && 'opacity-60 cursor-not-allowed'
            )}
          />
          <input
            type="time"
            value={data.scheduleDate.split('T')[1]?.slice(0, 5) ?? '08:00'}
            onChange={(e) => onDateChange(`${data.scheduleDate.split('T')[0]}T${e.target.value}`)}
            disabled={data.scheduled}
            className={cn(
              'bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text-primary',
              'hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
              'transition-colors cursor-pointer',
              data.scheduled && 'opacity-60 cursor-not-allowed'
            )}
          />
        </div>

        {/* Quick time presets */}
        {!data.scheduled && (
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '8 AM', value: '08:00' },
              { label: '9 AM', value: '09:00' },
              { label: '10 AM', value: '10:00' },
              { label: '11 AM', value: '11:00' },
              { label: '12 PM', value: '12:00' },
              { label: '2 PM', value: '14:00' },
              { label: '5 PM', value: '17:00' },
            ].map(({ label, value }) => {
              const active = (data.scheduleDate.split('T')[1]?.slice(0, 5) ?? '') === value
              return (
                <button
                  key={value}
                  onClick={() => onDateChange(`${data.scheduleDate.split('T')[0]}T${value}`)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                    active
                      ? 'border-accent bg-accent text-white'
                      : 'border-border bg-surface-light text-text-muted hover:border-accent/60 hover:text-text-primary'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}

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
