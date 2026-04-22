import Button from '../ui/Button'
import { useHealthCheck, type HealthStatus } from '../../hooks/useHealthCheck'

interface Props {
  onLogout?: () => void
}

function buildHealthLabel(health: HealthStatus): string {
  if (health.status === 'loading') return 'Checking systems…'
  if (health.status === 'ok') return 'All systems go'

  const reasons: string[] = []

  if (!health.anthropic.ok) {
    if (health.anthropic.reason === 'key_missing') reasons.push('Anthropic key missing')
    else if (health.anthropic.message) reasons.push(`Anthropic: ${health.anthropic.message}`)
    else reasons.push('Anthropic error')
  }
  if (!health.ghl.ok) {
    if (health.ghl.reason === 'key_missing') reasons.push('GHL API key missing')
    else if (health.ghl.message) reasons.push(`GHL: ${health.ghl.message.slice(0, 80)}`)
    else reasons.push('GHL error')
  }
  if (!health.ghlLocation) reasons.push('GHL Location ID missing')
  if (!health.ghlUser) reasons.push('GHL User ID missing')

  if (health.ghlAccounts) {
    for (const a of health.ghlAccounts) {
      if (a.isExpired) {
        reasons.push(`${a.platform} connection expired — reconnect in GHL`)
      } else if (a.daysUntilExpiry !== null && a.daysUntilExpiry <= 7) {
        reasons.push(`${a.platform} expires in ${a.daysUntilExpiry}d`)
      }
    }
  }

  return reasons.length ? reasons.join(' · ') : 'Unknown issue'
}

function HealthBadge() {
  const health = useHealthCheck()

  const dot =
    health.status === 'loading'
      ? 'bg-gray-400'
      : health.status === 'ok'
        ? 'bg-green-500 animate-pulse'
        : health.status === 'warning'
          ? 'bg-yellow-500 animate-pulse'
          : 'bg-red-500'

  const shortLabel =
    health.status === 'loading'
      ? 'Checking…'
      : health.status === 'ok'
        ? 'All systems go'
        : health.status === 'warning'
          ? 'Warning'
          : 'Degraded'

  const tooltip = buildHealthLabel(health)

  return (
    <div className="group relative flex items-center gap-1.5 cursor-default select-none">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-xs text-text-secondary hidden sm:inline">{shortLabel}</span>
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 max-w-xs shadow-lg leading-relaxed">
          {tooltip}
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
