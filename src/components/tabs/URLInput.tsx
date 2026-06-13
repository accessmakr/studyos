import React, { useState } from 'react'
import ToolResults from '../tool/ToolResults'
import { processText } from '../../utils/aiProcessor'

export default function URLInput() {
  const [url, setUrl] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFetch = async () => {
    if (!url) return
    setLoading(true)
    // TODO: Call Netlify function to fetch + extract text from URL
    const fakeText = `Content extracted from ${url}`
    const processed = await processText(fakeText)
    setResults(processed)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">URL Input</h1>
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://example.com/article"
        className="w-full p-4 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <button onClick={handleFetch} disabled={loading} className="px-6 py-3 bg-emerald-500 text-white rounded-lg">
        {loading? 'Fetching...' : 'Extract & Generate'}
      </button>
      {results && <ToolResults data={results} />}
    </div>
  )
}
