import { useState } from 'react'
import type { Platform, ScheduledPost } from '../../types'
import { PLATFORM_MAP } from '../../constants/platforms'
import { cn } from '../../utils/cn'
import Spinner from '../ui/Spinner'

interface ScheduledPostsPanelProps {
  posts: ScheduledPost[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function SocialIcons({ platforms }: { platforms: Platform[] }) {
  const list = platforms || []
  const MAX_VISIBLE = 3
  const visible = list.slice(0, MAX_VISIBLE)
  const extra = list.length - visible.length
  return (
    <div className="flex items-center gap-1">
      {visible.map((p) => {
        const cfg = PLATFORM_MAP[p]
        return cfg?.logoUrl ? (
          <img key={p} src={cfg.logoUrl} alt={cfg.name} title={cfg.name} className="w-6 h-6 rounded" />
        ) : (
          <span key={p} className="w-6 h-6 rounded bg-border" />
        )
      })}
      {extra > 0 && (
        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-border/60 text-text-secondary font-medium">
          +{extra}
        </span>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      {label}
    </span>
  )
}

export default function ScheduledPostsPanel({
  posts,
  isLoading,
  error,
  onRefresh,
}: ScheduledPostsPanelProps) {
  const [open, setOpen] = useState(false)
  const count = posts.length

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-in-up">
      <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-light transition-colors">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <svg
            className={cn('w-4 h-4 text-text-muted transition-transform duration-200', open && 'rotate-90')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <svg
            className="w-4 h-4 text-text-muted shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-sm font-medium text-text-secondary">Scheduled Posts</span>
          {!isLoading && !error && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium border border-accent/20">
              {count} upcoming
            </span>
          )}
          {isLoading && <Spinner size="sm" />}
        </button>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-border/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Refresh"
          aria-label="Refresh scheduled posts"
        >
          <svg
            className={cn('w-4 h-4', isLoading && 'animate-spin')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-border">
          {error ? (
            <div className="px-4 py-4 text-sm text-error flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={onRefresh}
                className="px-3 py-1 rounded-md text-xs font-medium border border-error/40 text-error hover:bg-error/5 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : isLoading && posts.length === 0 ? (
            <div className="px-4 py-6 flex items-center justify-center gap-2 text-sm text-text-muted">
              <Spinner size="sm" />
              <span>Loading scheduled posts…</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="px-4 py-6 text-sm text-text-muted text-center">
              No posts scheduled in the next 30 days.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-border/30 text-[11px] uppercase tracking-wider text-text-muted">
                    <th className="text-left font-semibold px-4 py-2">Caption</th>
                    <th className="text-left font-semibold px-4 py-2 w-20">Media</th>
                    <th className="text-left font-semibold px-4 py-2 w-28">Status</th>
                    <th className="text-left font-semibold px-4 py-2 w-36">Type</th>
                    <th className="text-left font-semibold px-4 py-2 w-36">Date</th>
                    <th className="text-left font-semibold px-4 py-2 w-28">Social</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.map((post) => {
                    const thumb = post.mediaUrls?.[0]
                    return (
                      <tr key={post.id} className="hover:bg-surface-light transition-colors">
                        <td className="px-4 py-3 align-top">
                          <div className="text-text-primary line-clamp-2 max-w-lg">
                            {post.caption || <em className="text-text-muted">No caption</em>}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="w-12 h-12 rounded-md object-cover border border-border"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-border/40 border border-border" />
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <StatusBadge status={post.status} />
                        </td>
                        <td className="px-4 py-3 align-top text-text-secondary">
                          <span className="inline-block px-2 py-1 rounded-md bg-border/40 text-xs">
                            {post.type || 'Post Composer'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top tabular-nums">
                          <div className="text-text-primary">{formatDate(post.scheduleDate)}</div>
                          <div className="text-xs text-text-muted">{formatTime(post.scheduleDate)}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <SocialIcons platforms={post.platforms} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
