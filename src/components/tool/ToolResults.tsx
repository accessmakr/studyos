import React, { useState } from 'react'
import { generatePDF } from '../../utils/exportPDF'

interface Results {
  summary: string
  flashcards: { q: string; a: string }[]
  quiz: { q: string; options: string[]; answer: number }[]
}

export default function ToolResults({ data }: { data: Results }) {
  const [activeView, setActiveView] = useState<'summary' | 'flashcards' | 'quiz'>('summary')
  const [flipped, setFlipped] = useState<number | null>(null)

  const handleExport = async () => {
    await generatePDF(data, 'StudyOS_Export')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200">
        {(['summary', 'flashcards', 'quiz'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveView(tab)}
            className={`px-4 py-2 font-medium ${activeView === tab? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        <button onClick={handleExport} className="ml-auto px-4 py-2 text-sm bg-slate-100 rounded-lg">
          Download PDF
        </button>
      </div>

      {activeView === 'summary' && (
        <div className="prose max-w-none p-4 bg-white rounded-lg shadow-sm">
          {data.summary}
        </div>
      )}

      {activeView === 'flashcards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.flashcards.map((card, i) => (
            <div
              key={i}
              onClick={() => setFlipped(flipped === i? null : i)}
              className="p-6 bg-white rounded-lg shadow-sm cursor-pointer min-h-32 flex items-center justify-center text-center"
            >
              {flipped === i? card.a : card.q}
            </div>
          ))}
        </div>
      )}

      {activeView === 'quiz' && (
        <div className="space-y-4">
          {data.quiz.map((q, i) => (
            <div key={i} className="p-4 bg-white rounded-lg shadow-sm">
              <p className="font-medium mb-3">{i + 1}. {q.q}</p>
              <div className="space-y-2">
                {q.options.map((opt, j) => (
                  <label key={j} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={`q${i}`} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
