import Button from '../ui/Button'
import { useHealthCheck } from '../../hooks/useHealthCheck'

interface Props {
  onLogout?: () => void
}

function HealthBadge() {
  const health = useHealthCheck()

  const dot =
    health.status === 'loading'
      ? 'bg-gray-400'
      : health.status === 'ok'
        ? 'bg-green-500 animate-pulse'
        : 'bg-red-500'

  const label =
    health.status === 'loading'
      ? 'Checking systems…'
      : health.status === 'ok'
        ? 'All systems go'
        : [
            !health.openai && 'OpenAI key missing',
            !health.ghl && 'GHL API key missing',
            !health.ghlLocation && 'GHL Location ID missing',
            !health.ghlUser && 'GHL User ID missing',
          ]
            .filter(Boolean)
            .join(' · ')

  return (
    <div className="group relative flex items-center gap-1.5 cursor-default select-none">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-xs text-text-secondary hidden sm:inline">{health.status === 'ok' ? 'All systems go' : health.status === 'loading' ? 'Checking…' : 'Degraded'}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
          {label}
        </div>
      </div>
    </div>
  )
}

export default function Header({ onLogout }: Props) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-surface">
      <div className="flex items-center gap-3">
        <img
          src="https://assets.cdn.filesafe.space/Gxry1a2QLdf9fdbKkdhz/media/69e3916a8696a78b8dddae2c.jpeg"
          alt="Social Planner Automation"
          className="h-16 w-auto rounded-lg object-contain"
        />
        <h1 className="font-heading text-xl font-bold text-text-primary">Social Planner Automation</h1>
      </div>
      <div className="flex items-center gap-4">
        <HealthBadge />
        {onLogout && (
          <Button variant="secondary" onClick={onLogout}>
            Log out
          </Button>
        )}
      </div>
    </header>
  )
}
