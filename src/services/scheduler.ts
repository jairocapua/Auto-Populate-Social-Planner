import type { CaptionData, UploadedFile } from '../types'

export type ScheduleResult =
  | { ok: true; postId?: string }
  | { ok: false; error: 'upload_failed' | 'schedule_failed'; details?: string }

async function uploadImage(file: UploadedFile): Promise<string | null> {
  if (file.isVideo || !file.base64) return null

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64: file.base64,
        fileName: file.file.name,
        mediaType: file.mediaType,
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.url || null
  } catch {
    return null
  }
}

export async function schedulePost(
  caption: CaptionData,
  files: UploadedFile[]
): Promise<ScheduleResult> {
  const firstFile = files[0]

  let imageUrl: string | null = null
  let imageType: string | undefined
  if (firstFile && !firstFile.isVideo) {
    imageUrl = await uploadImage(firstFile)
    if (!imageUrl) return { ok: false, error: 'upload_failed' }
    imageType = firstFile.mediaType
  }

  try {
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: caption.platform,
        caption: caption.caption,
        scheduleDate: caption.scheduleDate,
        imageUrl,
        imageType,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: 'schedule_failed', details: data.error || data.details }
    return { ok: true, postId: data.postId }
  } catch (err) {
    return {
      ok: false,
      error: 'schedule_failed',
      details: err instanceof Error ? err.message : 'unknown',
    }
  }
}
