import { useState, useCallback } from 'react'
import type { UploadedFile } from '../types'
import { validateFiles, fileToBase64, canEncodeBase64, isVideoFile } from '../utils/fileHelpers'

export function useFileUpload(onError?: (msg: string) => void) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      const { valid, error } = validateFiles(newFiles, files.length)
      if (error) onError?.(error)
      if (valid.length === 0) return

      const processed: UploadedFile[] = await Promise.all(
        valid.map(async (file) => {
          const id = crypto.randomUUID()
          const preview = URL.createObjectURL(file)
          const isVideo = isVideoFile(file)
          let base64: string | undefined

          if (canEncodeBase64(file)) {
            try {
              base64 = await fileToBase64(file)
            } catch {
              // Failed to encode — proceed without base64
            }
          }

          return { id, file, preview, base64, mediaType: file.type, isVideo }
        })
      )

      setFiles((prev) => [...prev, ...processed])
    },
    [files.length, onError]
  )

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) URL.revokeObjectURL(file.preview)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const clearFiles = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview))
    setFiles([])
  }, [files])

  const dragHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFiles = Array.from(e.dataTransfer.files)
      addFiles(droppedFiles)
    },
  }

  return { files, addFiles, removeFile, clearFiles, isDragging, dragHandlers }
}
