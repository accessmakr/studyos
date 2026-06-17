/**
 * StudyOS — /generate
 * Exam-aware AI study kit generation.
 * Fetches exam prompt context from Supabase,
 * builds a deep prompt, calls Groq, returns
 * structured kit with marks and mark schemes.
 *
 * ENV VARS REQUIRED:
 *   GROQ_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

/* ── Supabase REST helper ──────────────────── */
async function sbGet(path) {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Accept': 'application/json'
    }
  });
  if (!r.ok) return null;
  const data = await r.json();
  return Array.isArray(data) ? data[0] || null : data;
}

async function sbPost(path, body) {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });
  return r.ok;
}

/* ── Fetch exam context from Supabase ────────── */
async function getExamContext(examTypeId, subjectId) {
  if (!examTypeId) return null;
  const filter = subjectId
    ? `exam_type_id=eq.${examTypeId}&subject_id=eq.${subjectId}`
    : `exam_type_id=eq.${examTypeId}&subject_id=is.null`;
  return sbGet(`exam_prompts?${filter}&limit=1`);
}

async function getExamType(examTypeId) {
  if (!examTypeId) return null;
  return sbGet(`exam_types?id=eq.${examTypeId}&select=name,exam_language,description&limit=1`);
}

async function getSubject(subjectId) {
  if (!subjectId) return null;
  return sbGet(`subjects?id=eq.${subjectId}&select=name,papers&limit=1`);
}

/* ── Build deep prompt ───────────────────────── */
function buildPrompt(content, examCtx, examType, subject, topic) {
  const isImage = !content || content === '[image]';

  let contextBlock = '';
  if (examCtx || examType) {
    contextBlock = `
=== EXAM CONTEXT ===
Exam: ${examType?.name || 'General'}
Subject: ${subject?.name || 'General'}
Topic: ${topic || 'General'}
${examCtx?.system_prompt ? `\nExaminer Instructions:\n${examCtx.system_prompt}` : ''}
${examCtx?.marking_style ? `\nMarking Style: ${examCtx.marking_style}` : ''}
${examCtx?.output_instructions ? `\nOutput Instructions: ${examCtx.output_instructions}` : ''}
===================
`;
  }

  return `${contextBlock}
You are an expert study assistant. Analyze the content below and return ONLY a raw JSON object — no markdown, no backticks, no explanation before or after.

JSON structure:
{
  "title": "Short specific title max 6 words",
  "notes": "Clean readable version of the content with key concepts highlighted",
  "flashcards": [
    {
      "q": "question text — phrased in the style of the exam if exam context given",
      "a": "answer text",
      "marks": 2,
      "mark_scheme": "bullet point 1 (1 mark)\\nbullet point 2 (1 mark)",
      "common_mistake": "what students typically get wrong here"
    }
  ],
  "quiz": [
    {
      "question": "question text in exam style",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "full worked explanation of why this is correct and others are wrong",
      "marks": 1
    }
  ],
  "summary": "3-4 paragraph plain-language summary covering all key concepts",
  "keyterms": [
    {
      "term": "term name",
      "definition": "precise definition as required by this exam",
      "marks": 1
    }
  ]
}

Requirements:
- 15 flashcards — in the style and depth appropriate for this specific exam
- Each flashcard has realistic mark allocation and mark scheme bullets (each bullet = 1 mark)
- 10 quiz questions — matching the format of this exam (MCQ style, option count, difficulty)
- 3-4 paragraph summary
- 12 key terms with exam-quality definitions
- If no exam context: use clear academic style suitable for general study

${isImage
  ? 'Content type: IMAGE — read every character of text visible in this image including handwriting, printed text, diagrams, tables, equations. Transcribe completely then generate the study kit.'
  : `Content to analyze:\n${String(content).substring(0, 7000)}`}`;
}

/* ── Parse AI response ───────────────────────── */
function parseKit(raw) {
  try { return JSON.parse(raw); } catch {}
  const m1 = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (m1) { try { return JSON.parse(m1[1]); } catch {} }
  const m2 = raw.match(/\{[\s\S]+\}/);
  if (m2) { try { return JSON.parse(m2[0]); } catch {} }
  throw new Error('Could not parse AI response. Please try again.');
}

/* ── Groq API call ───────────────────────────── */
async function callGroq(prompt, key) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
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
  const d = await r.json();
  return d.choices[0].message.content;
}

/* ── Main handler ────────────────────────────── */
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Service temporarily unavailable.' }) };

  try {
    const { content, examTypeId, subjectId, topic, userId } = JSON.parse(event.body || '{}');
    if (!content && content !== '[image]') {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No content provided.' }) };
    }

    /* Fetch exam context in parallel */
    const [examCtx, examType, subject] = await Promise.all([
      getExamContext(examTypeId, subjectId),
      getExamType(examTypeId),
      getSubject(subjectId)
    ]);

    const prompt = buildPrompt(content, examCtx, examType, subject, topic);
    const raw = await callGroq(prompt, GROQ_KEY);
    const kit = parseKit(raw);

    if (!kit?.flashcards?.length && !kit?.summary) {
      throw new Error('Invalid AI response structure. Please try again.');
    }

    /* Optionally save to Supabase if userId provided */
    if (userId && process.env.SUPABASE_URL) {
      await sbPost('notes', {
        user_id: userId,
        title: kit.title || 'Untitled',
        raw_content: typeof content === 'string' ? content.substring(0, 2000) : '[image]',
        kit,
        exam_type_id: examTypeId || null,
        subject_id: subjectId || null,
        topic: topic || null
      }).catch(() => {}); /* non-blocking */
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ kit }) };

  } catch (e) {
    console.error('Generate error:', e.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: e.message || 'Generation failed. Please try again.' })
    };
  }
};
