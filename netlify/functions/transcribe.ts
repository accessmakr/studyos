import { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No audio data' }) }
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY
  
  try {
    const formData = new FormData()
    const audioBlob = new Blob([event.body], { type: 'audio/webm' })
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'whisper-large-v3')
    formData.append('response_format', 'json')

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: formData
    })

    const data = await res.json()
    return {
      statusCode: 200,
      body: JSON.stringify({ text: data.text })
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Transcription failed' }) }
  }
}
