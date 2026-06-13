import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

export default function StudySnap() {
  const [image, setImage] = useState<string | null>(null)
  const [text, setText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImage(url)
    // TODO: Add OCR with tesseract.js or cloud API
    setText('OCR result will appear here')
  }

  return (
    <div className="p-6 pb-24">
      <h2 className="text-xl font-bold mb-4">StudySnap</h2>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} className="mb-4" />
      {image && <img src={image} className="w-full rounded-lg mb-4" />}
      <div className="bg-zinc-900 p-4 rounded-lg min-h-32">{text}</div>
    </div>
  )
}
