import React from 'react'
import { getVersionString } from '../config/version'
import { FEATURES, LIMITS } from '../config/features'

export default function Settings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <h2 className="font-semibold mb-2">Plan: Free</h2>
        <p className="text-sm text-slate-600">Uploads today: 0 / {LIMITS.free.uploadsPerDay}</p>
        <p className="text-sm text-slate-600">Max file size: {LIMITS.free.maxFileSizeMB}MB</p>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-sm">
        <h2 className="font-semibold mb-2">Features</h2>
        <ul className="text-sm text-slate-600 space-y-1">
          {Object.entries(FEATURES).map(([k, v]) => (
            <li key={k}>{v? '✓' : '✗'} {k}</li>
          ))}
        </ul>
      </div>

      <div className="text-xs text-slate-400">{getVersionString()}</div>
    </div>
  )
}
