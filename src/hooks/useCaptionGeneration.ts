import { useState, useCallback } from 'react'
import type { UploadedFile, CaptionData } from '../types'
import { generateCaptions } from '../services/openai'

export type GenerateResult =
  | { ok: true; captions: CaptionData[] }
  | { ok: false; error: string }

export function useCaptionGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = useCallback(async (files: UploadedFile[], customPrompt?: string): Promise<GenerateResult> => {
    setIsGenerating(true)
    try {
      const captions = await generateCaptions(files, customPrompt)
      return { ok: true, captions }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to generate captions'
      return { ok: false, error }
    } finally {
      setIsGenerating(false)
    }
  }, [])

  return { generate, isGenerating }
}
