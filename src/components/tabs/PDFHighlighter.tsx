import React, { useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import ToolResults from '../tool/ToolResults'
import { processText } from '../../utils/aiProcessor'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PDFHighlighter() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) return alert('Max 25MB for free tier')

    setLoading(true)
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item: any) => item.str).join(' ')
    }
    const processed = await processText(text)
    setResults(processed)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">PDF Highlighter</h1>
      <input type="file" accept="application/pdf" onChange={handleFile} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
      {loading && <p>Extracting text...</p>}
      {results && <ToolResults data={results} />}
    </div>
  )
}
