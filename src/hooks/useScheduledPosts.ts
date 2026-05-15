import { useState, useCallback, useEffect } from 'react'
import type { ScheduledPost } from '../types'
import { fetchScheduledPosts, type PartialFetchInfo } from '../services/scheduler'

export function useScheduledPosts() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partial, setPartial] = useState<PartialFetchInfo | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchScheduledPosts()
      setPosts(result.posts)
      setPartial(result.partial)
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

  return { posts, isLoading, error, partial, lastFetched, refresh }
}
