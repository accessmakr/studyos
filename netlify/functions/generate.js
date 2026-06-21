/**
 * StudyOS — /generate
 * Two modes:
 *   mode=exam   → 35+ MCQ questions in exam format, NO flashcards
 *   mode=study  → flashcards + quiz + notes + summary + terms
 *
 * Correct answers use letter keys (A/B/C/D) not array indices
 * so the always-A bug is eliminated at the schema level.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

/* ─── Exam-specific context per exam code ───────── */
const EXAM_CTX = {
  wassce: {
    name: 'WAEC WASSCE',
    paper: 'Paper 1 Objective — 50 questions, 1 hour, 1 mark each, no negative marking',
    style: 'Direct factual recall and application. West African context required.',
    stems: 'Which of the following..., The IUPAC name of..., Calculate the..., Which is NOT correct..., What is produced when..., Which statement correctly describes...',
    distractors: 'Use values/names that students genuinely confuse. For Chemistry: similar compound names, wrong formulae. For Math: include arithmetic errors students make. Each wrong option must target a specific misconception.',
    note: 'Reference West African/Nigerian context where relevant: NNPC, Dangote, local geography, institutions.'
  },
  neco_ss: {
    name: 'NECO SSCE',
    paper: 'Objective Paper — 60 questions, 1 mark each, no negative marking',
    style: 'Similar to WAEC but with NECO-specific phrasing. Nigerian context.',
    stems: 'Which..., What is..., How many..., The correct statement is...',
    distractors: 'Common Nigerian secondary school misconceptions. Options must all be plausible to a student who half-knows the topic.'
  },
  utme: {
    name: 'JAMB UTME',
    paper: 'CBT — 40 questions per subject, 1 mark each, no negative marking',
    style: 'Tests SS1–SS3 Nigerian curriculum. Questions written to trap common errors.',
    stems: 'Which of the following..., The correct definition of... is, What is the product of..., Which option correctly...',
    distractors: 'JAMB is known for cleverly crafted options that trap students who partially know the answer. Include options that are almost-correct, commonly-confused terms, and reversed relationships.',
    note: 'Use of English: test lexis & structure, comprehension, antonyms, synonyms, figures of speech, register.'
  },
  igcse: {
    name: 'Cambridge IGCSE',
    paper: 'Multiple Choice Paper 1 — 40 questions, 45 minutes, 1 mark each',
    style: 'Structured international format. Tests both knowledge and application.',
    stems: 'Which..., A student..., What is..., Which row in the table correctly shows..., Which diagram correctly...',
    distractors: 'Partial information (true but incomplete), reversed relationships, Cambridge-specific traps using similar terminology.'
  },
  caslevel: {
    name: 'Cambridge AS & A Level',
    paper: 'Multiple Choice Paper 1 — 40 questions, 1 hour, 1 mark each',
    style: 'University-entry level depth. Multi-concept questions. Higher precision required.',
    stems: 'Which..., What is the..., A student finds that..., Which of the following statements is correct...',
    distractors: 'Conceptually similar but wrong, common A-level calculation errors, partial understanding traps. Students with IGCSE knowledge will be caught by these.'
  },
  gcse_aqa: {
    name: 'GCSE (AQA)',
    paper: 'Multiple Choice Questions — 4 marks in each paper, Foundation and Higher tier',
    style: 'UK curriculum context. Tests AO1 knowledge, AO2 application, AO3 analysis.',
    stems: 'Which..., What..., Tick one box that correctly shows...',
    distractors: 'Draw from AQA examiner reports on common mistakes. UK-specific context in science and humanities questions.'
  },
  gcse_edx: {
    name: 'GCSE (Edexcel)',
    paper: 'Multiple Choice Questions — UK curriculum, Edexcel specification',
    style: 'UK context. Edexcel-specific phrasing style.',
    stems: 'Which..., What is..., Select the correct...',
    distractors: 'Edexcel common misconceptions from specification content.'
  },
  alevel_aqa: {
    name: 'A Level (AQA)',
    paper: 'Objective Questions — synoptic, links topics across specification',
    style: 'University preparation level. Sophisticated multi-concept questions.',
    stems: 'Which..., What is..., Which of the following...',
    distractors: 'Very close conceptually or numerically. Must challenge students who have studied but not mastered the topic.'
  },
  alevel_edx: {
    name: 'A Level (Edexcel)',
    paper: 'Edexcel A Level Multiple Choice — advanced UK curriculum',
    style: 'Advanced level UK content. Synoptic questions.',
    stems: 'Which..., What...',
    distractors: 'Advanced misconceptions from Edexcel specification.'
  },
  sat: {
    name: 'SAT',
    paper: 'Digital SAT — Reading & Writing: 54 questions. Math: 44 questions.',
    style: 'Evidence-based. Every Reading & Writing answer must be supported by passage text. Math: algebra, advanced math, problem solving, data analysis.',
    stems: 'Which choice most logically completes the text?, Which choice best supports the students claim?, Which is the best version of the underlined portion?, What is the value of x?',
    distractors: 'RW: plausible but NOT supported by the text. Math: common algebraic errors, sign errors, unit confusion.'
  },
  act: {
    name: 'ACT',
    paper: 'ACT — 215 questions total, 4 sections, significant time pressure',
    style: 'More straightforward than SAT. Tests speed and accuracy. Content-based.',
    stems: 'Which..., What..., How many...',
    distractors: 'Time-pressure traps. Students who rush will choose these. Plausible at first glance.'
  },
  ap: {
    name: 'AP Exams',
    paper: 'AP Multiple Choice Section — 50–55 questions depending on subject',
    style: 'College-level content. Application, analysis, evaluation required.',
    stems: 'Which of the following..., The primary purpose of..., Based on the evidence..., A student hypothesizes that...',
    distractors: 'Partially correct, college-level misconceptions, requires distinguishing between close concepts.'
  },
  ib_diploma: {
    name: 'IB Diploma Programme',
    paper: 'Paper 1 Multiple Choice — 30–40 questions depending on subject and level',
    style: 'IB criterion-referenced. International context. Command terms applied in stems.',
    stems: 'Which..., What is..., A student...',
    distractors: 'IB-specific traps, data misinterpretation, command term confusion. HL questions require deeper analysis.'
  },
  jee_main: {
    name: 'JEE Main',
    paper: 'Section A: 20 MCQ single correct answer, +4 correct −1 wrong',
    style: 'High difficulty. Multi-concept integration. Fast calculation required. Physics + Chemistry + Mathematics.',
    stems: 'Which of the following is/are correct?, The value of... is, What is the...',
    distractors: 'Calculation errors (wrong sign, forgot factor of 2), unit errors, similar but not equivalent expressions. Each distractor targets a specific solving mistake.',
    note: 'Physics: concept + calculation combined. Chemistry: IUPAC names, reaction products, numerical. Mathematics: precise algebraic manipulation required.'
  },
  jee_advanced: {
    name: 'JEE Advanced',
    paper: 'Variable format: single correct, multiple correct, paragraph-based, matrix match',
    style: 'Extreme difficulty. IIT entrance. Requires first-principles reasoning, novel problem setups.',
    stems: 'Which of the following statement(s) is(are) true?, The correct option(s) is(are)...',
    distractors: 'Appear correct under shallow analysis. Require full derivation to eliminate.',
    note: 'For MCQ format: assume single-correct unless told otherwise. Use extreme precision in numerical values.'
  },
  neet: {
    name: 'NEET',
    paper: '180 questions total — Physics 45, Chemistry 45, Botany 45, Zoology 45. +4 correct, −1 wrong.',
    style: 'NCERT-based (80%+ questions from NCERT text). Factual recall critical for Biology. Numerical for Physics/Chemistry.',
    stems: 'Which of the following..., Identify the correct statement..., The correct sequence is..., Match the following...',
    distractors: 'NCERT-adjacent: similar but wrong. Reversed sequences. Confused structures. Always test from NCERT chapter-level knowledge.',
    note: 'Biology: definitions, diagrams (described textually), classifications, sequences must all match NCERT precisely. Chemistry/Physics: standard formulas and applications.'
  },
  kcse: {
    name: 'KCSE',
    paper: 'KNEC KCSE — MCQ section in most subjects, Kenyan curriculum',
    style: 'Kenyan context. Local examples: Kenyan geography, institutions, industries.',
    stems: 'Which..., What is..., How does...',
    distractors: 'Common Kenyan student errors based on national exam reports. Local context alternatives.'
  },
  kcpe: {
    name: 'KCPE',
    paper: 'KNEC KCPE — Primary level examination, Kenya',
    style: 'Primary level. Simpler language. Local Kenyan context.',
    stems: 'Which..., What...',
    distractors: 'Common primary-level misconceptions. Age-appropriate alternatives.'
  },
  csee: {
    name: 'CSEE (Tanzania)',
    paper: 'NECTA CSEE — Objective section, partly in Kiswahili',
    style: 'Tanzanian curriculum. Kiswahili may be used in some questions.',
    stems: 'Which..., Ni ipi..., Chagua jibu sahihi...',
    distractors: 'Common Tanzanian student errors.'
  },
  acsee: {
    name: 'ACSEE (Tanzania)',
    paper: 'NECTA Advanced Certificate — A Level, Tanzania',
    style: 'Advanced Tanzanian curriculum, primarily English.',
    stems: 'Which..., What is...',
    distractors: 'Advanced level errors.'
  },
  uce: {
    name: 'UCE (Uganda)',
    paper: 'UNEB UCE — O Level, Uganda',
    style: 'Ugandan curriculum. English medium.',
    stems: 'Which..., What...',
    distractors: 'Ugandan O-Level common errors.'
  },
  uace: {
    name: 'UACE (Uganda)',
    paper: 'UNEB UACE — A Level, Uganda',
    style: 'Advanced Ugandan curriculum.',
    stems: 'Which...',
    distractors: 'A-Level misconceptions.'
  },
  nsc: {
    name: 'NSC Matric (South Africa)',
    paper: 'DBE NSC — Section A Multiple Choice, 10–20 questions per paper',
    style: 'South African CAPS curriculum. English or Afrikaans medium.',
    stems: 'Which..., What is the..., The... is best described as...',
    distractors: 'CAPS-specific misconceptions. SA context alternatives.'
  },
  zimsec_o: {
    name: 'ZIMSEC O Level',
    paper: 'ZIMSEC O Level — MCQ section, Zimbabwean curriculum',
    style: 'Zimbabwean context. ZIMSEC syllabus content.',
    stems: 'Which..., What...',
    distractors: 'Zimbabwean O-Level curriculum misconceptions.'
  },
  zimsec_a: {
    name: 'ZIMSEC A Level',
    paper: 'ZIMSEC A Level — Advanced Zimbabwean curriculum',
    style: 'Advanced Zimbabwean curriculum.',
    stems: 'Which...',
    distractors: 'Advanced level errors.'
  },
  cbse_board: {
    name: 'CBSE Board',
    paper: 'CBSE Board — 20 marks MCQ section including Assertion-Reason format',
    style: 'NCERT-based. Includes competency-based questions. Assertion-Reason format.',
    stems: 'Choose the correct option, Both A and R are correct and R is the correct explanation of A, A is correct but R is wrong, Both A and R are wrong',
    distractors: 'Assertion-Reason traps: A true R true but unrelated, A false R true, both false. Also standard MCQ with NCERT-level distractors.',
    note: 'For CBSE include some Assertion-Reason format questions as they appear in CBSE exams since 2020.'
  },
  fslic: {
    name: 'FSc / ICS (Pakistan)',
    paper: 'BISE FSc — MCQ section of intermediate examination, Pakistan',
    style: 'Pakistani curriculum. Punjab/BISE textbook content.',
    stems: 'Which..., The correct answer is..., Which of the following is correct...',
    distractors: 'Common errors from Pakistani FSc textbooks.'
  },
  baccalaureat: {
    name: 'Baccalauréat',
    paper: 'BAC — QCM (Questions à Choix Multiple), French education system',
    style: 'French academic rigor. Questions in French. Abstract and theoretical.',
    stems: 'Quelle est..., Parmi les propositions suivantes..., Laquelle..., Complétez...',
    distractors: 'French education system traps: linguistically similar but logically wrong, partially correct propositions.',
    note: 'All questions and options must be in French.'
  },
  enem: {
    name: 'ENEM',
    paper: 'ENEM — 45 questions per área, 5 options (A, B, C, D, E), Brazilian context',
    style: 'Interdisciplinary, contextual, real-world application. Portuguese language.',
    stems: 'Assinale a alternativa que..., De acordo com o texto..., Qual das alternativas...',
    distractors: 'Brazilian context alternatives. Interdisciplinary confusion between areas.',
    note: 'ENEM uses 5 options (A through E), not 4. Generate 5 options per question. All text in Portuguese.'
  }
};

function getSubjectRules(subject, examCode) {
  const s = (subject || '').toLowerCase();
  if (s.includes('physics') || s.includes('physical science')) {
    return '30% of questions must involve numerical calculations. Always include numerical values in stems. All wrong numerical options must be plausible magnitudes (e.g., if correct is 40N, options like 20N, 80N, 160N not 0.04N). Always include units.';
  }
  if (s.includes('chemistry') || s.includes('chem')) {
    return 'Include: IUPAC naming questions, reaction product questions, stoichiometry calculations, pH/concentration calculations, equation balancing, and property identification. Wrong options must use real chemical names/formulae that students confuse.';
  }
  if (s.includes('biology') || s.includes('botany') || s.includes('zoology') || s.includes('life science')) {
    return 'Include questions on: functions of organelles/structures, stages of processes (mitosis, meiosis, photosynthesis, respiration), taxonomy classifications, physiological processes. Describe diagrams textually. Wrong options must use real biological terms in wrong contexts.';
  }
  if (s.includes('mathematics') || s.includes('maths') || s.includes('math')) {
    return '60% calculation questions. Wrong options must be common student errors: forgot to square, wrong order of operations, sign error, incomplete simplification. Include both routine and problem-solving questions. Show enough data in stem to solve.';
  }
  if (s.includes('use of english') || (s.includes('english') && (examCode === 'utme' || examCode === 'neco_ss'))) {
    return 'For Use of English: include lexis & structure (30%), comprehension-based (25%), oral English phonetics (15%), figures of speech (15%), registers and synonyms (15%). JAMB Use of English tests very specific grammar patterns.';
  }
  if (s.includes('economics')) {
    return 'Include: definition questions (25%), demand/supply analysis (20%), national income calculations (15%), money & banking (15%), international trade (15%), development economics (10%). Mix theoretical and applied questions.';
  }
  if (s.includes('government') || s.includes('political')) {
    return 'Include: constitutional provisions, organs of government functions, electoral systems, international organizations (UN, AU, ECOWAS, etc.), foreign policy, federalism concepts. Questions on specific articles/sections must be exam-syllabus accurate.';
  }
  if (s.includes('history')) {
    return 'Include: chronology questions with specific dates, cause-and-effect questions, significance questions, identify-the-event questions. Cover pre-colonial, colonial, nationalist, and post-independence periods as relevant to the exam.';
  }
  if (s.includes('geography') || s.includes('geo')) {
    return 'Include: physical geography (climate, landforms, rivers), human geography (population, urbanisation), economic geography (resources, trade), cartography/map reading. Use real place names relevant to the exam region.';
  }
  if (s.includes('agricultural') || s.includes('agriculture')) {
    return 'Include: crop production practices, animal husbandry, soil science (types, conservation, pH), farm management, pest & disease control, agricultural economics. Include practical scenario questions.';
  }
  if (s.includes('computer') || s.includes('ict') || s.includes('information')) {
    return 'Include: programming concepts, data representation (binary, hex), hardware components, software types, networking, database concepts, algorithms. Questions must reflect the actual exam specification precisely.';
  }
  if (s.includes('literature')) {
    return 'Include: theme identification, character analysis, literary devices (metaphor, irony, etc.), plot events, authorial intent. Questions must reference texts specified in the exam syllabus.';
  }
  if (s.includes('accounting') || s.includes('financial')) {
    return 'Include: double-entry bookkeeping, trial balance, profit & loss account, balance sheet, bank reconciliation, depreciation, partnership accounts. Numerical questions must have sufficient data to compute.';
  }
  if (s.includes('kiswahili') || s.includes('swahili')) {
    return 'Maswali yote lazima yawe kwa lugha ya Kiswahili. Ni pamoja na: sarufi, ufahamu, uandishi, na fasihi. Maswali yanatakiwa kuakisi mitaala ya mtihani husika.';
  }
  return 'Questions must span the full breadth of this subject at the appropriate depth for this examination level. Include definition, application, analysis, and calculation questions in appropriate proportions.';
}

/* ─── EXAM MODE prompt: generates 35+ MCQ questions ─ */
function buildExamPrompt(examCode, subject, topic, year, count) {
  const ctx = EXAM_CTX[examCode] || {
    name: examCode ? examCode.toUpperCase().replace(/_/g,' ') : 'General Examination',
    paper: 'Multiple choice examination',
    style: 'Standard academic examination style',
    stems: 'Which of the following..., What is..., How many...',
    distractors: 'Plausible alternatives representing common misconceptions'
  };
  const isEnem = examCode === 'enem';
  const optionLetters = isEnem ? 'A, B, C, D, E (five options)' : 'A, B, C, D (four options)';
  const optionFields = isEnem
    ? '"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."'
    : '"A": "...", "B": "...", "C": "...", "D": "..."';
  const correctDistrib = isEnem
    ? `approximately ${Math.round(count/5)} questions each for A, B, C, D, E`
    : `approximately ${Math.round(count/4)} questions each for A, B, C, D`;
  const isFrench = examCode === 'baccalaureat';
  const isPortuguese = examCode === 'enem';

  return `You are a chief examiner for ${ctx.name} creating a ${count}-question practice examination paper.

EXAMINATION PROFILE:
Paper: ${ctx.paper}
Subject: ${subject || 'General'}
Topic: ${topic || subject || 'All topics'}
${year ? `Year style: Write questions matching the style and difficulty of ${year} past papers for this examination.` : ''}
Question style: ${ctx.style}
${ctx.note || ''}

TYPICAL QUESTION STEMS FOR THIS EXAM:
${ctx.stems}

HOW TO WRITE THE WRONG OPTIONS (DISTRACTORS):
${ctx.distractors}

SUBJECT-SPECIFIC RULES:
${getSubjectRules(subject, examCode)}

═══════════════════════════════════════════════
MANDATORY RULES — THESE WILL BE ENFORCED:
═══════════════════════════════════════════════

RULE 1 — QUANTITY: Generate EXACTLY ${count} questions. Number them 1 to ${count}.

RULE 2 — CORRECT ANSWER DISTRIBUTION (CRITICAL):
The correct answer must be distributed as: ${correctDistrib}.
DO NOT put the correct answer as the same letter repeatedly.
Before returning your response, count: how many A correct? B correct? C correct? ${isEnem ? 'D correct? E correct?' : 'D correct?'}
They must be roughly equal. This is non-negotiable.

RULE 3 — DISTRACTOR QUALITY:
Every wrong option must represent a REAL student misconception or error.
A student who has NOT fully mastered the topic should find all options plausible.
Lazy distractors (obviously wrong values, nonsensical options) are NOT acceptable.

RULE 4 — QUESTION UNIQUENESS:
Each question must test a DISTINCT concept. No two questions may test the same idea.
Cover the FULL BREADTH of "${topic || subject}": easy (35%), medium (40%), hard (25%).

RULE 5 — EXAM AUTHENTICITY:
Questions must be indistinguishable from real ${ctx.name} past paper questions.
Use the EXACT same phrasing patterns, vocabulary level, and scenario types used in actual ${ctx.name} papers.

RULE 6 — EXPLANATION QUALITY:
Each explanation must: (a) state WHY the correct answer is right, (b) explain WHY each wrong option is wrong specifically.
For calculations: show the working. For factual questions: give the reasoning.

${isFrench ? 'RULE 7: All questions, options, and explanations must be written in French.\n' : ''}
${isPortuguese ? 'RULE 7: All questions, options, and explanations must be written in Portuguese.\n' : ''}

Return ONLY a raw JSON object. No markdown. No backticks. Nothing before or after the JSON.

{
  "title": "${ctx.name} ${subject || ''} — ${topic || subject || 'Comprehensive'}: ${count}-Question Practice Paper",
  "examInfo": {
    "exam": "${ctx.name}",
    "subject": "${subject || 'General'}",
    "topic": "${topic || subject || 'All topics'}",
    "year": "${year || 'Practice'}",
    "totalQuestions": ${count},
    "totalMarks": ${count},
    "instructions": "Choose the ONE correct answer from the options provided for each question."
  },
  "questions": [
    {
      "number": 1,
      "question": "Full question text written exactly in ${ctx.name} examination style",
      ${optionFields},
      "correct": "A or B or C or D${isEnem ? ' or E' : ''} — the letter of the correct option",
      "explanation": "Detailed explanation: why correct answer is right + why each wrong option is wrong",
      "difficulty": "easy",
      "topic_area": "Specific subtopic this question tests",
      "marks": 1
    }
  ],
  "summary": "Comprehensive 5-6 paragraph summary of ${topic || subject} covering every major concept, formula, and fact a student needs to know for ${ctx.name}. Structured with clear sections.",
  "keyterms": [
    {
      "term": "Term name",
      "definition": "Exam-quality definition that would earn full marks if written verbatim in an exam"
    }
  ]
}`;
}

/* ─── STUDY MODE prompt: flashcards + quiz + notes ── */
function buildStudyPrompt(content, examPrompt, examCode, subject, topic, year) {
  const ctx = EXAM_CTX[examCode] || {};
  const examName = ctx.name || (examCode ? examCode.toUpperCase().replace(/_/g,' ') : 'General');
  const isTopicOnly = !content;

  let examBlock = '';
  if (examCode || subject) {
    examBlock = `
EXAM CONTEXT:
Exam: ${examName}
Subject: ${subject || 'General'}
Topic: ${topic || subject || 'General'}
${year ? `Year: Generate in the style of ${year} past papers.` : ''}
${examPrompt?.system_prompt ? `\nExaminer guidance:\n${examPrompt.system_prompt}` : ''}
Marking style: ${examPrompt?.marking_style || 'Each bullet point = 1 mark. State formula separately from substitution. Definition on its own = 1 mark.'}
`;
  }

  return `You are a senior examiner producing deep study materials for ${examName}.

${examBlock}

CRITICAL OUTPUT RULES:
1. FLASHCARDS: Minimum 30. Maximum unlimited. Cover every distinct subtopic.
   - Question phrased EXACTLY as it would appear in ${examName} exam paper, with mark allocation
   - mark_scheme: ONLY bullet points, one bullet = one mark. Example:
     "• States that current is rate of flow of charge (1)\\n• Gives equation I = Q/t (1)\\n• Correct unit: ampere A (1)"
   - NEVER write prose paragraphs in mark_scheme. Bullet only.
   - common_mistake: ALWAYS completed. The specific error students make on this exact question.
2. QUIZ: Minimum 20 questions. Distribute correct answers equally across A, B, C, D (5 each for 20 questions).
   Each correct answer index (0=A, 1=B, 2=C, 3=D) must appear approximately equally.
   Do NOT put correct answer at index 0 every time.
3. NOTES: Structured with clear headings. Cover all key concepts, formulae, and definitions.
4. SUMMARY: 4-5 paragraphs. One paragraph per major sub-topic.
5. KEY TERMS: Minimum 15 terms. Exam-quality definitions.

${getSubjectRules(subject, examCode)}

Return ONLY a raw JSON object. No markdown. No backticks.

{
  "title": "Specific title max 8 words",
  "notes": "Structured notes with ===HEADINGS=== for each section. Include all key formulae, definitions, examples.",
  "flashcards": [
    {
      "q": "Question as it appears in ${examName} exam paper (X marks)",
      "a": "Brief direct answer",
      "marks": 2,
      "mark_scheme": "• First marking point earning 1 mark\\n• Second marking point earning 1 mark",
      "common_mistake": "The specific error students commonly make on this question"
    }
  ],
  "quiz": [
    {
      "question": "Question in ${examName} style",
      "options": ["Option text for A", "Option text for B", "Option text for C", "Option text for D"],
      "correct": 0,
      "explanation": "Full worked explanation. Why correct is right. Why each wrong option is wrong.",
      "marks": 1
    }
  ],
  "summary": "4-5 paragraph summary, one paragraph per major sub-topic",
  "keyterms": [
    {
      "term": "Term",
      "definition": "Exam-quality definition",
      "marks": 1
    }
  ]
}

${isTopicOnly
  ? `Generate comprehensive materials covering ALL aspects of "${topic || subject}" as tested in ${examName}.`
  : `Process this content and generate study materials:\n${String(content).substring(0, 7000)}`}`;
}

function parseKit(raw) {
  try { return JSON.parse(raw); } catch {}
  const m1 = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (m1) { try { return JSON.parse(m1[1]); } catch {} }
  const m2 = raw.match(/\{[\s\S]+\}/);
  if (m2) { try { return JSON.parse(m2[0]); } catch {} }
  throw new Error('AI returned unparseable response — please try again.');
}

async function callGroq(prompt, maxTokens = 7000) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens: maxTokens
    })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error('Groq: ' + (e.error?.message || `HTTP ${r.status}`));
  }
  return (await r.json()).choices[0].message.content;
}

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
  if (!examCode || !process.env.SUPABASE_URL) return null;
  const et = await sbFetch(`exam_types?code=eq.${encodeURIComponent(examCode)}&select=id&limit=1`);
  if (!et?.id) return null;
  return sbFetch(`exam_prompts?exam_type_id=eq.${et.id}&subject_id=is.null&select=*&limit=1`);
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
    return {
      statusCode: 503, headers: CORS,
      body: JSON.stringify({ error: 'GROQ_API_KEY is not set in Netlify environment variables. Go to Netlify → Site configuration → Environment variables and add GROQ_API_KEY.' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { content, examCode, subject, topic, year, tool, userId, mode } = body;
    const count = 35;

    let prompt;
    if (mode === 'exam') {
      prompt = buildExamPrompt(examCode, subject, topic, year, count);
    } else {
      const examPrompt = await getExamPrompt(examCode).catch(() => null);
      prompt = buildStudyPrompt(content, examPrompt, examCode, subject, topic, year);
    }

    const raw = await callGroq(prompt, 7000);
    const kit = parseKit(raw);

    if (mode === 'exam') {
      if (!kit?.questions?.length) throw new Error('No questions generated — please try again.');
    } else {
      if (!kit?.flashcards?.length && !kit?.summary) throw new Error('Incomplete response — please try again.');
    }

    kit.mode = mode;
    kit.examCode = examCode;
    kit.subject = subject;
    kit.topic = topic;
    kit.year = year;

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
