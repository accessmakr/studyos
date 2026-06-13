const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = `You are StudyOS AI. Convert input text into 3 outputs:
1. summary: 3-5 bullet points max 500 chars
2. flashcards: 10 Q&A pairs, concise
3. quiz: 5 MCQs with 4 options each, mark correct answer index
Return ONLY valid JSON with keys: summary, flashcards, quiz`

export async function processText(input: string) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input.slice(0, 10000) }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
  })
  
  if (!res.ok) throw new Error('AI processing failed')
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}
