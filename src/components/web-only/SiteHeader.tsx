import React from 'react'
import { APP_VERSION } from '../../config/version'

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-emerald-600">StudyOS</h1>
          <p className="text-xs text-slate-500">v{APP_VERSION}</p>
        </div>
        <nav className="hidden md:flex gap-6 text-sm">
          <a href="#features" className="text-slate-600 hover:text-emerald-600">Features</a>
          <a href="#pricing" className="text-slate-600 hover:text-emerald-600">Pricing</a>
          <a href="#docs" className="text-slate-600 hover:text-emerald-600">Docs</a>
        </nav>
      </div>
    </header>
  )
}
