import Button from '../ui/Button'

interface ScheduleAllButtonProps {
  onClick: () => void
  disabled: boolean
  allScheduled: boolean
}

export default function ScheduleAllButton({ onClick, disabled, allScheduled }: ScheduleAllButtonProps) {
  if (allScheduled) {
    return (
      <Button variant="success" size="lg" className="w-full" disabled>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 0a10 10 0 110 20 10 10 0 0110-20zm4.1 6.6L8.7 12l-2.8-2.8a1.2 1.2 0 00-1.8 1.6l3.7 3.8a1.2 1.2 0 001.8 0l6.3-6.2a1.2 1.2 0 00-1.8-1.8z" />
        </svg>
        All Posts Scheduled
      </Button>
    )
  }

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className="w-full"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="14" height="14" rx="2" />
        <path d="M7 2v4M13 2v4M3 8h14" />
      </svg>
      Approve & Schedule All
    </Button>
  )
}
