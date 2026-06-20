/**
 * StudyOS — /generate
 * Exam-aware, mark-scheme-strict generation.
 * No artificial limits on cards or questions.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

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

async function getExamPrompt(examCode) {
  if (!examCode) return null;
  const et = await sbFetch(`exam_types?code=eq.${encodeURIComponent(examCode)}&select=id&limit=1`);
  if (!et?.id) return null;
  return sbFetch(`exam_prompts?exam_type_id=eq.${et.id}&subject_id=is.null&select=*&limit=1`);
}

/* ── The prompt that actually produces exam-grade output ── */
function buildPrompt(content, examPrompt, examCode, subject, topic, year) {

  /* Build exam-specific instructions */
  let examBlock = '';
  if (examCode || subject) {
    const examUpper = examCode ? examCode.toUpperCase().replace(/_/g,' ') : 'General';
    examBlock = `
EXAM CONTEXT:
Exam: ${examUpper}
Subject: ${subject || 'General'}
Topic: ${topic || subject || 'General'}
${year ? `Year style: Generate questions in the style and difficulty of ${year} past papers for this exam.` : ''}
${examPrompt ? `\nExaminer instructions:\n${examPrompt.system_prompt}` : ''}
${examPrompt ? `\nMarking style: ${examPrompt.marking_style}` : `\nMarking style: Each bullet point in the mark scheme = exactly 1 mark. State formula separately from substitution. Definition on its own line = 1 mark.`}
`;
  }

  const isTopicOnly = !content;

  return `You are a senior examiner producing study materials. Return ONLY a raw JSON object. No markdown. No backticks. No explanation outside the JSON.

${examBlock}

STRICT OUTPUT RULES — read these carefully:
1. Flashcards: minimum 30 cards. More is better. Cover ALL major subtopics.
2. Mark scheme format: NEVER write prose paragraphs in mark_scheme. Use ONLY bullet points where each bullet = 1 mark, like this:
   "• States that current is rate of flow of charge (1)\n• Gives equation I = Q/t (1)\n• Correct unit: ampere or A (1)"
3. Quiz: minimum 15 questions. No upper limit.
4. common_mistake: ALWAYS filled in. State the specific error students make.
5. definitions in keyterms: exam-quality, not dictionary-style.
6. If exam context given: phrase questions EXACTLY as they would appear in that exam paper. Use that exam's command words (e.g. WAEC uses "State and explain", Cambridge uses "Describe and explain", JAMB uses pure MCQ stems).
7. For JAMB/UTME: all flashcard questions must be in MCQ style with 4 options embedded in the question stem.
8. For essay-style exams (WAEC Paper 2, Cambridge A Level, GCSE): include extended mark schemes showing exactly how marks are allocated per point.
9. Year context: if a year is given, generate questions that match the typical difficulty, style and topic weighting of that year's paper.

JSON structure:
{
  "title": "Specific title: ${subject || ''} ${topic ? '— '+topic : ''} (max 8 words)",
  "notes": "Structured notes covering all key points — use headings and clear sections",
  "flashcards": [
    {
      "q": "Question exactly as it would appear in ${examCode ? examCode.toUpperCase().replace(/_/g,' ') : 'the'} exam paper, with mark allocation e.g. (3 marks)",
      "a": "Brief direct answer",
      "marks": 3,
      "mark_scheme": "• First marking point (1)\\n• Second marking point (1)\\n• Third marking point (1)",
      "common_mistake": "Specific error students make on this question"
    }
  ],
  "quiz": [
    {
      "question": "Question in exam style",
      "options": ["A. Option","B. Option","C. Option","D. Option"],
      "correct": 0,
      "explanation": "Full worked explanation showing exactly why A is correct and why B, C, D are wrong. Show working for calculations.",
      "marks": 1
    }
  ],
  "summary": "4-5 paragraph summary. Each paragraph covers a distinct sub-topic. Academic tone.",
  "keyterms": [
    {
      "term": "Term",
      "definition": "Exam-quality definition that would earn full marks if written verbatim",
      "marks": 1
    }
  ]
}

${isTopicOnly
  ? `Generate from this topic: "${topic || subject || examCode}". Create comprehensive materials covering ALL aspects of this topic as tested in ${examCode ? examCode.toUpperCase().replace(/_/g,' ') : 'this exam'}.`
  : `Content to process and generate study materials from:\n${String(content).substring(0, 7000)}`}`;
}

function parseKit(raw) {
  try { return JSON.parse(raw); } catch {}
  const m1 = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (m1) { try { return JSON.parse(m1[1]); } catch {} }
  const m2 = raw.match(/\{[\s\S]+\}/);
  if (m2) { try { return JSON.parse(m2[0]); } catch {} }
  throw new Error('AI returned unparseable response — please try again');
}

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
      temperature: 0.2,
      max_tokens: 6000
    })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error('Groq: ' + (e.error?.message || `HTTP ${r.status}`));
  }
  return (await r.json()).choices[0].message.content;
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  if (!process.env.GROQ_API_KEY) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'GROQ_API_KEY not set in Netlify environment variables. Go to Netlify → Site configuration → Environment variables and add it.' }) };
  }

  try {
    const { content, examCode, subject, topic, year, tool, userId } = JSON.parse(event.body || '{}');

    /* Fetch exam prompt from Supabase for richer context */
    const examPrompt = await getExamPrompt(examCode).catch(() => null);

    const prompt = buildPrompt(content, examPrompt, examCode, subject, topic, year);
    const raw = await callGroq(prompt);
    const kit = parseKit(raw);

    if (!kit?.flashcards?.length && !kit?.summary) {
      throw new Error('AI returned incomplete data. Please try again.');
    }

    /* Save to Supabase if user logged in */
    if (userId) {
      sbInsert('notes', {
        user_id: userId,
        title: kit.title || 'Study Kit',
        raw_content: typeof content === 'string' ? content.substring(0, 2000) : '[topic]',
        type: tool || 'topic',
        kit,
        topic: topic || null
      });
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ kit }) };

  } catch (e) {
    console.error('Generate error:', e.message);
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ error: e.message || 'Generation failed. Please try again.' })
    };
  }
};
