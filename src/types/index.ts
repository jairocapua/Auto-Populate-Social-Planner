export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'google_business'

export interface PlatformConfig {
  id: Platform
  name: string
  color: string
  charLimit: number
  defaultHour: number
  logoUrl: string
}

export interface UploadedFile {
  id: string
  file: File
  preview: string
  base64?: string
  mediaType: string
  isVideo: boolean
}

export interface CaptionData {
  platform: Platform
  caption: string
  scheduleDate: string
  scheduled: boolean
}

export interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}
