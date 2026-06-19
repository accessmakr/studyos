/**
 * StudyOS — /transcribe
 * Voice audio → Groq Whisper → text
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  if (!process.env.GROQ_API_KEY) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'GROQ_API_KEY not set in Netlify environment variables.' }) };
  }

  try {
    const { audioBase64, mimeType } = JSON.parse(event.body || '{}');
    if (!audioBase64) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No audio data provided' }) };

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    if (audioBuffer.length > 24 * 1024 * 1024) {
      return { statusCode: 413, headers: CORS, body: JSON.stringify({ error: 'Recording too long. Keep under 2 minutes.' }) };
    }

    const boundary = 'sos_' + Date.now().toString(36);
    const ext  = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('ogg') ? 'ogg' : 'webm';
    const mime = mimeType || 'audio/webm';

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="rec.${ext}"\r\nContent-Type: ${mime}\r\n\r\n`),
      audioBuffer,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n--${boundary}--\r\n`)
    ]);

    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
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
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
