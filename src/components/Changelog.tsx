import React from 'react'
import { CHANGELOG } from '../config/version'

export default function Changelog() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Changelog</h1>
      {CHANGELOG.map((entry, i) => (
        <div key={i} className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">{entry.version}</h2>
            <span className="text-sm text-slate-500">{entry.date}</span>
          </div>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
            {entry.changes.map((c, j) => <li key={j}>{c}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}
