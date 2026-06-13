import React from 'react'
import { getPlatform } from '../../utils/platform'

export default function AppStatusBar() {
  const platform = getPlatform()
  return (
    <div className="h-6 bg-emerald-600 flex items-center justify-center">
      <p className="text-xs text-white font-medium">
        StudyOS {platform === 'ios'? 'iOS' : 'Android'} App
      </p>
    </div>
  )
}
