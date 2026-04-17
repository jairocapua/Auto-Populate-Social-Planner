import { useState, useCallback } from 'react'
import type { UploadedFile, CaptionData } from '../types'
import { generateCaptions } from '../services/openai'

export function useCaptionGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (files: UploadedFile[], customPrompt?: string): Promise<CaptionData[] | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      const captions = await generateCaptions(files, customPrompt)
      return captions
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate captions'
      setError(message)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  return { generate, isGenerating, error }
}
