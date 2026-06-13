import React from 'react'

export default function LegalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-12">
      <div className="max-w-4xl mx-auto px-4 py-8 text-sm text-slate-500">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-700">StudyOS</p>
            <p>Turn anything into study kits in 3 seconds</p>
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-emerald-600">Privacy</a>
            <a href="/terms" className="hover:text-emerald-600">Terms</a>
            <a href="/support" className="hover:text-emerald-600">Support</a>
          </div>
        </div>
        <p className="mt-4 text-xs">© 2026 StudyOS. All rights reserved.</p>
      </div>
    </footer>
  )
}
