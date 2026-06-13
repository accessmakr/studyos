export function truncateText(text: string, maxCharz: number): string {
  if (text.length <= maxCharz) return text
  return text.slice(0, maxCharz) + '...'
}

export function formatBytez(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' + sizes[i] // fixed quote here
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}
