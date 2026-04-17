import { cn } from '../../utils/cn'

interface CharCounterProps {
  current: number
  limit: number
}

export default function CharCounter({ current, limit }: CharCounterProps) {
  const isOver = current > limit
  const percentage = (current / limit) * 100

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'text-xs tabular-nums',
          isOver ? 'text-error font-medium' : percentage > 90 ? 'text-warning' : 'text-text-muted'
        )}
      >
        {current.toLocaleString()} / {limit.toLocaleString()}
      </span>
      {isOver && (
        <span className="text-xs text-error">Over limit</span>
      )}
    </div>
  )
}
