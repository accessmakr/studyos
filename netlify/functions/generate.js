/**
 * StudyOS — /generate endpoint
 * All AI calls happen here on the server.
 * Users never see API keys. Keys live in
 * Netlify environment variables only.
 *
 * Set in Netlify dashboard → Site settings → Environment variables:
 *   GROQ_API_KEY   = gsk_xxx   (free at console.groq.com)
 *   GEMINI_API_KEY = AIza_xxx  (free at aistudio.google.com)
 */

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = k => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${k}`;
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json'
};

/* ── Prompt ──────────────────────────────────── */
const buildPrompt = (content) => `You are a study assistant. Analyze the content and return ONLY a raw JSON object. No markdown, no backticks, no explanation — raw JSON only.

{
  "title": "Short title max 6 words",
  "notes": "Clean readable version of the raw content",
  "flashcards": [{"q":"question","a":"answer"}],
  "quiz": [{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"why correct"}],
  "summary": "3-4 paragraph plain-language summary",
  "keyterms": [{"term":"...","definition":"..."}]
}

Requirements: 15 flashcards, 10 quiz questions (correct = 0-based index), 3-4 paragraph summary, 12 key terms.

Content to analyze:
${typeof content === 'string' ? content.substring(0, 7000) : '[Image — read ALL text visible and generate study materials from it]'}`;

/* ── Parse response ──────────────────────────── */
function parseKit(raw) {
  try { return JSON.parse(raw); } catch {}
  const m1 = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (m1) { try { return JSON.parse(m1[1]); } catch {} }
  const m2 = raw.match(/\{[\s\S]+\}/);
  if (m2) { try { return JSON.parse(m2[0]); } catch {} }
  throw new Error('Could not parse AI response — please try again');
}

/* ── Groq (text only, very fast) ─────────────── */
async function callGroq(content, key) {
  const r = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: buildPrompt(content) }],
      temperature: 0.3,
      max_tokens: 4000
    })
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error('Groq: ' + (e.error?.message || r.status)); }
  return (await r.json()).choices[0].message.content;
}

/* ── Gemini (text + images) ──────────────────── */
async function callGemini(content, imageBase64, imageMime, key) {
  const parts = imageBase64
    ? [{ text: buildPrompt('[Image]') }, { inlineData: { mimeType: imageMime || 'image/jpeg', data: imageBase64 } }]
    : [{ text: buildPrompt(content) }];

  const r = await fetch(GEMINI_URL(key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
    })
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error('Gemini: ' + (e.error?.message || r.status)); }
  const d = await r.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

/* ── Handler ─────────────────────────────────── */
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const GROQ_KEY   = process.env.GROQ_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (!GROQ_KEY && !GEMINI_KEY) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }) };
  }

  try {
    const { content, imageBase64, imageMime } = JSON.parse(event.body || '{}');
    if (!content && !imageBase64) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No content provided' }) };

    let raw = '', errors = [];

    /* Groq — text only, fast */
    if (GROQ_KEY && !imageBase64) {
      try { raw = await callGroq(content, GROQ_KEY); }
      catch (e) { errors.push(e.message); console.error('Groq failed:', e.message); }
    }

    /* Gemini — images or Groq fallback */
    if (!raw && GEMINI_KEY) {
      try { raw = await callGemini(content, imageBase64, imageMime, GEMINI_KEY); }
      catch (e) { errors.push(e.message); console.error('Gemini failed:', e.message); }
    }

    if (!raw) throw new Error(errors.length ? errors.join(' | ') : 'AI providers unavailable');

    const kit = parseKit(raw);
    if (!kit.flashcards?.length && !kit.summary) throw new Error('Invalid AI response — please try again');

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ kit }) };

  } catch (e) {
    console.error('Generate error:', e.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message || 'Generation failed. Please try again.' }) };
  }
};
