import React from 'react'
import { FileText, MessageSquare, Mic, Link2, Settings } from 'lucide-react'

const TABS = [
  { icon: FileText, label: 'Snap' },
  { icon: FileText, label: 'PDF' },
  { icon: MessageSquare, label: 'Chat' },
  { icon: Mic, label: 'Voice' },
  { icon: Link2, label: 'URL' },
  { icon: Settings, label: 'Settings' }
]

export default function BottomTabBar({ active, onChange }: { active: string, onChange: (t: string) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden">
      <div className="grid grid-cols-6">
        {TABS.map(tab => (
          <button
            key={tab.label}
            onClick={() => onChange(tab.label.toLowerCase())}
            className={`py-2 flex-col items-center gap-1 ${active === tab.label.toLowerCase()? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <tab.icon size={20} />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
