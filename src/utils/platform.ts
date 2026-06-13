export function isMobileApp(): boolean {
  return typeof window !== 'undefined' &&
    (window as any).Capacitor !== undefined &&
    (window as any).Capacitor.isNativePlatform()
}

export function getPlatform(): 'web' | 'ios' | 'android' {
  if (!isMobileApp()) return 'web'
  const platform = (window as any).Capacitor?.getPlatform()
  return platform === 'ios' ? 'ios' : 'android'
}

export function isApp(): boolean {
  return getPlatform() !== 'web'
}
