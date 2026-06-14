/**
 * StudyOS — /transcribe endpoint
 * Receives audio as base64, sends to Groq Whisper,
 * returns transcript text. Developer's key only.
 *
 * Required env var: GROQ_API_KEY
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Transcription service not configured' }) };

  try {
    const { audioBase64, mimeType } = JSON.parse(event.body || '{}');
    if (!audioBase64) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No audio data provided' }) };

    /* Decode base64 → Buffer */
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    /* Check size — Netlify functions have a 6MB body limit */
    if (audioBuffer.length > 24 * 1024 * 1024) {
      return { statusCode: 413, headers: CORS, body: JSON.stringify({ error: 'Recording too long. Please keep recordings under 2 minutes.' }) };
    }

    /* Build multipart form data without any npm packages */
    const boundary = 'sos_boundary_' + Date.now().toString(36);
    const ext      = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('ogg') ? 'ogg' : 'webm';
    const filename = `recording.${ext}`;
    const mime     = mimeType || 'audio/webm';

    const preamble = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${mime}\r\n\r\n`
    );
    const modelPart = Buffer.from(
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-large-v3\r\n` +
      `--${boundary}--\r\n`
    );

    const body = Buffer.concat([preamble, audioBuffer, modelPart]);

    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method:  'POST',
      headers: {
        'Authorization':  `Bearer ${GROQ_KEY}`,
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length)
      },
      body
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error?.message || `Whisper error ${r.status}`);
    }

    const data = await r.json();
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ text: data.text || '' }) };

  } catch (e) {
    console.error('Transcribe error:', e.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
