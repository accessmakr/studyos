import { LIMITS } from '../config/features'

export function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > LIMITS.free.maxFileSizeMB * 1024 * 1024) {
    return { valid: false, error: `Max ${LIMITS.free.maxFileSizeMB}MB for free tier` }
  }
  return { valid: true }
}

export function validateTextLength(text: string): { valid: boolean; error?: string } {
  if (text.length < 50) {
    return { valid: false, error: 'Input too short. Add at least 50 characters' }
  }
  if (text.length > 50000) {
    return { valid: false, error: 'Input too long. Max 50,000 characters' }
  }
  return { valid: true }
}

export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
