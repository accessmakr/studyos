import React, { useState } from 'react'
import ToolResults from './ToolResults'

interface Props {
  title: string
  placeholder: string
  processFn: (input: string) => Promise<any>
}

export default function ToolCore({ title, placeholder, processFn }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleGenerate = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      const data = await processFn(input)
      setResults(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-full h-48 p-4 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Generate'}
      </button>
      {results && <ToolResults data={results} />}
    </div>
  )
}
