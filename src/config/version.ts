export const APP_VERSION = '1.0.0'
export const BUILD_NUMBER = 1
export const CHANGELOG = [
  { version: '1.0.0', date: '2026-04-08', changes: ['Initial release', '5 study tools', 'Offline PWA', 'Multi-language'] }
]

export function getVersionString(): string {
  return `v${APP_VERSION} (${BUILD_NUMBER})`
}
