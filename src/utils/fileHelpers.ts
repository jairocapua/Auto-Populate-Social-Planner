const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']
const ALL_ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]
const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20MB max per image
const MAX_FILES = 4

export function isAcceptedFileType(file: File): boolean {
  return ALL_ACCEPTED_TYPES.includes(file.type)
}

export function isVideoFile(file: File): boolean {
  return ACCEPTED_VIDEO_TYPES.includes(file.type)
}

export function isImageFile(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type)
}

export function canEncodeBase64(file: File): boolean {
  return isImageFile(file) && file.size <= MAX_IMAGE_SIZE
}

export function validateFiles(
  newFiles: File[],
  existingCount: number
): { valid: File[]; error?: string } {
  const remaining = MAX_FILES - existingCount
  if (remaining <= 0) {
    return { valid: [], error: `Maximum ${MAX_FILES} files allowed.` }
  }

  const accepted = newFiles.filter(isAcceptedFileType)
  const rejected = newFiles.length - accepted.length

  const valid = accepted.slice(0, remaining)
  const errors: string[] = []

  if (rejected > 0) {
    errors.push(`${rejected} file(s) skipped — unsupported format.`)
  }
  if (accepted.length > remaining) {
    errors.push(`Only ${remaining} more file(s) can be added.`)
  }

  return { valid, error: errors.length > 0 ? errors.join(' ') : undefined }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix: "data:image/jpeg;base64,"
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export const ACCEPT_STRING = '.jpg,.jpeg,.png,.heic,.heif,.mp4,.mov'
