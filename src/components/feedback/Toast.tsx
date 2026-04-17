import { cn } from '../../utils/cn'
import type { Toast as ToastType } from '../../types'

interface ToastProps {
  toast: ToastType
  onClose: (id: string) => void
}

export default function Toast({ toast, onClose }: ToastProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in-up',
        toast.type === 'success' && 'bg-success/15 border border-success/30 text-success',
        toast.type === 'error' && 'bg-error/15 border border-error/30 text-error'
      )}
    >
      <span className="shrink-0">
        {toast.type === 'success' ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.3 5.3L7 9.6 4.7 7.3a1 1 0 00-1.4 1.4l3 3a1 1 0 001.4 0l5-5a1 1 0 00-1.4-1.4z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm1 11a1 1 0 10-2 0 1 1 0 002 0zm-.25-2.5a.75.75 0 001.5 0v-4a.75.75 0 00-1.5 0v4z" />
          </svg>
        )}
      </span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l8 8M11 3l-8 8" />
        </svg>
      </button>
    </div>
  )
}
