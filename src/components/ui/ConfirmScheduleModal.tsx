import type { CaptionData, PlatformConfig } from '../../types'
import Button from './Button'

type SinglePayload = {
  type: 'single'
  caption: CaptionData
  config: PlatformConfig
}

type AllPayload = {
  type: 'all'
  items: Array<{ caption: CaptionData; config: PlatformConfig }>
}

interface Props {
  payload: SinglePayload | AllPayload
  onConfirm: () => void
  onCancel: () => void
}

function formatSchedule(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatScheduleShort(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const CharIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
)

export default function ConfirmScheduleModal({ payload, onConfirm, onCancel }: Props) {
  const isSingle = payload.type === 'single'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden opacity-0 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <CalendarIcon />
          </div>
          <div>
            <h2 className="font-heading font-bold text-text-primary text-[15px] leading-tight">
              {isSingle ? 'Confirm Schedule' : 'Confirm Schedule All'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isSingle
                ? 'Review the details below before posting'
                : `${payload.items.length} post${payload.items.length > 1 ? 's' : ''} will be scheduled`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {isSingle ? (
            <>
              {/* Platform badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold"
                style={{
                  backgroundColor: `${payload.config.color}12`,
                  borderColor: `${payload.config.color}30`,
                  color: payload.config.color,
                }}
              >
                <img src={payload.config.logoUrl} alt={payload.config.name} className="w-4 h-4 object-contain" />
                {payload.config.name}
              </div>

              {/* Caption preview */}
              <div className="bg-surface-light border border-border rounded-xl p-3">
                <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Caption</p>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {payload.caption.caption}
                </p>
              </div>

              {/* Schedule time + char count */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-light border border-border rounded-xl p-3 flex items-start gap-2">
                  <ClockIcon />
                  <div>
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Scheduled for</p>
                    <p className="text-xs text-text-primary font-medium leading-snug">
                      {formatSchedule(payload.caption.scheduleDate)}
                    </p>
                  </div>
                </div>
                <div className="bg-surface-light border border-border rounded-xl p-3 flex items-start gap-2">
                  <CharIcon />
                  <div>
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Characters</p>
                    <p className="text-xs text-text-primary font-medium">
                      {payload.caption.caption.length.toLocaleString()}
                      <span className="text-text-muted font-normal"> / {payload.config.charLimit.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Schedule All — list */
            <div className="space-y-2">
              {payload.items.map(({ caption, config }) => (
                <div
                  key={config.id}
                  className="flex items-center gap-3 bg-surface-light border border-border rounded-xl px-3 py-2.5"
                  style={{ borderLeftWidth: 3, borderLeftColor: config.color }}
                >
                  <img src={config.logoUrl} alt={config.name} className="w-6 h-6 object-contain shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: config.color }}>{config.name}</p>
                    <p className="text-[11px] text-text-muted mt-0.5 truncate">
                      {caption.caption.slice(0, 60)}{caption.caption.length > 60 ? '…' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-text-muted leading-snug">{formatScheduleShort(caption.scheduleDate)}</p>
                    <p className="text-[10px] text-text-muted/60 mt-0.5">{caption.caption.length} chars</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex gap-2.5 border-t border-border">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={onConfirm}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {isSingle ? 'Confirm & Schedule' : 'Confirm & Schedule All'}
          </Button>
        </div>
      </div>
    </div>
  )
}
