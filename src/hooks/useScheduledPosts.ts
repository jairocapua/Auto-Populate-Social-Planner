import { useState, useCallback, useEffect } from 'react'
import type { ScheduledPost } from '../types'
import { fetchScheduledPosts } from '../services/scheduler'

export function useScheduledPosts() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchScheduledPosts()
      setPosts(result)
      setLastFetched(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled posts')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { posts, isLoading, error, lastFetched, refresh }
}
