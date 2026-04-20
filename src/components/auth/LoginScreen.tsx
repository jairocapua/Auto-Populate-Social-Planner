import { useState, useCallback, useRef, useEffect } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { login } from '../../services/auth'

interface Props {
  onSuccess: () => void
}

export default function LoginScreen({ onSuccess }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!password.trim() || isLoading) return
      setIsLoading(true)
      setError(null)
      try {
        await login(password)
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed')
        setPassword('')
        inputRef.current?.focus()
      } finally {
        setIsLoading(false)
      }
    },
    [password, isLoading, onSuccess]
  )

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-surface border border-border rounded-2xl shadow-lg w-full max-w-sm p-8 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src="https://assets.cdn.filesafe.space/Gxry1a2QLdf9fdbKkdhz/media/69e3916a8696a78b8dddae2c.jpeg"
            alt="RoofPost AI"
            className="h-16 w-auto rounded-lg object-contain"
          />
          <div>
            <h1 className="font-heading text-xl font-bold text-text-primary">Social Planner Automation</h1>
            <p className="text-sm text-text-secondary mt-1">Enter your password to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={inputRef}
            id="password"
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
          />

          {error && (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
