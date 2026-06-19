/**
 * StudyOS — /generate
 * Accepts examCode (string like "wassce", "kcse")
 * not UUID, so local exam data in browser works.
 * Fetches deep prompt from Supabase by code.
 * Falls back to strong generic prompt if not found.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

/* ── Supabase REST ─────────────────────────── */
async function sbFetch(path) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return null;
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Accept': 'application/json'
      }
    });
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d) ? (d[0] || null) : d;
  } catch { return null; }
}

async function sbInsert(table, body) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body)
    });
  } catch {}
}

/* ── Get exam prompt by code ──────────────── */
async function getExamPrompt(examCode) {
  if (!examCode) return null;
  const et = await sbFetch(`exam_types?code=eq.${encodeURIComponent(examCode)}&select=id&limit=1`);
  if (!et?.id) return null;
  return sbFetch(`exam_prompts?exam_type_id=eq.${et.id}&subject_id=is.null&select=*&limit=1`);
}

/* ── Build prompt ─────────────────────────── */
function buildPrompt(content, examPrompt, examCode, subject, topic) {
  const isImage = !content;
  let ctx = '';

  if (examPrompt) {
    ctx = `
=== EXAM CONTEXT ===
Exam: ${examCode?.toUpperCase() || 'General'}
Subject: ${subject || 'General'}
Topic: ${topic || 'General'}

Examiner Instructions:
${examPrompt.system_prompt}

Marking Style:
${examPrompt.marking_style || 'Points-based — each valid bullet point = 1 mark'}

Output Instructions:
${examPrompt.output_instructions || 'Generate exam-standard materials with mark allocations'}
====================
`;
  } else if (examCode) {
    ctx = `
=== EXAM CONTEXT ===
Exam: ${examCode.toUpperCase()}
Subject: ${subject || 'General'}
Topic: ${topic || 'General'}
Style: Generate materials appropriate for this examination standard.
====================
`;
  }

  return `${ctx}
You are an expert academic study assistant. Analyze the content and return ONLY a raw JSON object.
No markdown, no backticks, no explanation — just the JSON object.

{
  "title": "Specific title max 6 words",
  "notes": "Clean readable version of all key content",
  "flashcards": [
    {
      "q": "Question — phrased in exam style if exam given",
      "a": "Brief answer",
      "marks": 2,
      "mark_scheme": "• Point one earning 1 mark\\n• Point two earning 1 mark",
      "common_mistake": "What students commonly get wrong here"
    }
  ],
  "quiz": [
    {
      "question": "Question in exam style",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Full worked explanation with marks breakdown",
      "marks": 1
    }
  ],
  "summary": "3-4 paragraph plain summary covering every key concept",
  "keyterms": [
    {
      "term": "Term",
      "definition": "Precise exam-quality definition",
      "marks": 1
    }
  ]
}

Generate: 15 flashcards, 10 quiz questions, 3-4 paragraph summary, 12 key terms.
Every flashcard must have marks, mark_scheme (bullet per mark), and common_mistake.
Every quiz question must have marks and full explanation.

${isImage
  ? 'Content: [IMAGE] — read every character of text visible including handwriting, printed text, equations, and table data. Transcribe completely then generate the study kit.'
  : `Content:\n${String(content).substring(0, 7000)}`}`;
}

/* ── Groq call ────────────────────────────── */
async function callGroq(prompt) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4500
    })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error('Groq: ' + (e.error?.message || `HTTP ${r.status}`));
  }
  return (await r.json()).choices[0].message.content;
}

/* ── Parse ────────────────────────────────── */
function parseKit(raw) {
  try { return JSON.parse(raw); } catch {}
  const m1 = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (m1) { try { return JSON.parse(m1[1]); } catch {} }
  const m2 = raw.match(/\{[\s\S]+\}/);
  if (m2) { try { return JSON.parse(m2[0]); } catch {} }
  throw new Error('AI returned unparseable response. Please try again.');
}

/* ── Handler ──────────────────────────────── */
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  if (!process.env.GROQ_API_KEY) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'GROQ_API_KEY not configured in Netlify environment variables.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { content, examCode, subject, topic, userId } = body;

    if (!content && content !== null) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No content provided.' }) };
    }

    /* Fetch exam prompt from Supabase (non-blocking on failure) */
    const examPrompt = await getExamPrompt(examCode).catch(() => null);

    const prompt = buildPrompt(content, examPrompt, examCode, subject, topic);
    const raw = await callGroq(prompt);
    const kit = parseKit(raw);

    if (!kit?.flashcards?.length && !kit?.summary) {
      throw new Error('AI returned incomplete data. Please try again.');
    }

    /* Save to Supabase if user is logged in */
    if (userId && process.env.SUPABASE_URL) {
      sbInsert('notes', {
        user_id: userId,
        title: kit.title || 'Untitled',
        raw_content: typeof content === 'string' ? content.substring(0, 2000) : '[image]',
        type: body.tool || 'text',
        kit,
        topic: topic || null
      });
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ kit }) };

  } catch (e) {
    console.error('Generate error:', e.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message || 'Generation failed. Please try again.' }) };
  }
};
