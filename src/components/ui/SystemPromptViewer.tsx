import { useState } from 'react'
import { SYSTEM_PROMPT, VIDEO_FALLBACK_PROMPT } from '../../constants/prompts'
import { cn } from '../../utils/cn'

const PROMPTS = [
  { key: 'main', label: 'Caption Generation', prompt: SYSTEM_PROMPT },
  { key: 'video', label: 'Video Fallback', prompt: VIDEO_FALLBACK_PROMPT },
]

export default function SystemPromptViewer() {
  const [open, setOpen] = useState(false)
  const [activeKey, setActiveKey] = useState('main')
  const [copied, setCopied] = useState(false)

  const active = PROMPTS.find((p) => p.key === activeKey)!

  function handleCopy() {
    navigator.clipboard.writeText(active.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-light transition-colors group"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-text-muted shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
          </svg>
          <span className="text-sm font-medium text-text-secondary">Active System Prompt</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium border border-accent/20">
            Claude Sonnet 4.6
          </span>
        </div>
        <svg
          className={cn('w-4 h-4 text-text-muted transition-transform duration-200', open && 'rotate-180')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-border">
          {/* Tab row + copy button */}
          <div className="flex items-center justify-between px-4 py-2 bg-surface-light border-b border-border">
            <div className="flex gap-1">
              {PROMPTS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setActiveKey(p.key)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                    activeKey === p.key
                      ? 'bg-accent text-white'
                      : 'text-text-muted hover:text-text-primary hover:bg-border/40'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                copied
                  ? 'border-success/40 text-success bg-success/5'
                  : 'border-border text-text-muted hover:border-accent/60 hover:text-text-primary'
              )}
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Prompt text */}
          <pre className="px-4 py-3 text-[12px] leading-relaxed text-text-secondary font-mono whitespace-pre-wrap break-words bg-surface max-h-64 overflow-y-auto">
            {active.prompt}
          </pre>
        </div>
      )}
    </div>
  )
}
