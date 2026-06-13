export const FEATURES = {
  studySnap: true,
  pdfHighlighter: true,
  chatAnalyzer: true,
  voiceNotes: true,
  urlInput: true,
  flashcards: true,
  quiz: true,
  summary: true,
  exportPDF: true,
  cloudSave: true,
  offline: true,
  i18n: true
} as const

export const LIMITS = {
  free: {
    uploadsPerDay: 10,
    maxFileSizeMB: 25,
    maxNotesChars: 10000
  },
  pro: {
    uploadsPerDay: -1,
    maxFileSizeMB: 100,
    maxNotesChars: 50000
  }
}

export const VERSION = '1.0.0'
export const BUILD_DATE = '2026-04-08'
