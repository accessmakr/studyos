import React, { useState, useRef } from 'react'
import ToolResults from '../tool/ToolResults'
import { processText } from '../../utils/aiProcessor'

export default function VoiceNotes() {
  const [results, setResults] = useState(null)
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorderRef.current = new MediaRecorder(stream)
    chunksRef.current = []
    mediaRecorderRef.current.ondataavailable = e => chunksRef.current.push(e.data)
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      // TODO: Send to Groq Whisper API for transcription
      const fakeTranscript = "Transcribed text from voice note..."
      const processed = await processText(fakeTranscript)
      setResults(processed)
    }
    mediaRecorderRef.current.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Voice Notes</h1>
      <button
        onClick={recording? stopRecording : startRecording}
        className={`px-6 py-3 rounded-lg font-medium ${recording? 'bg-red-500' : 'bg-emerald-500'} text-white`}
      >
        {recording? 'Stop Recording' : 'Start Recording'}
      </button>
      {results && <ToolResults data={results} />}
    </div>
  )
}
