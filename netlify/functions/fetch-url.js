/**
 * StudyOS — /fetch-url endpoint
 * Fetches a URL server-side (no CORS issues),
 * strips HTML, returns clean readable text.
 * No API key needed — this is a proxy.
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json'
};

/* Tags whose entire content we remove (not just the tag) */
const REMOVE_TAGS = ['script','style','nav','footer','header','aside','iframe','noscript','svg','form'];

function stripHTML(html) {
  let text = html;
  /* Remove full blocks */
  for (const tag of REMOVE_TAGS) {
    text = text.replace(new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'gi'), ' ');
  }
  /* Convert block-level tags to newlines for readability */
  text = text.replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, '\n');
  /* Strip remaining tags */
  text = text.replace(/<[^>]+>/g, ' ');
  /* Decode common HTML entities */
  text = text
    .replace(/&nbsp;/g,  ' ')
    .replace(/&amp;/g,   '&')
    .replace(/&lt;/g,    '<')
    .replace(/&gt;/g,    '>')
    .replace(/&quot;/g,  '"')
    .replace(/&#39;/g,   "'")
    .replace(/&hellip;/g,'...');
  /* Collapse whitespace */
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const rawUrl = event.queryStringParameters?.url;
  if (!rawUrl) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'url parameter required' }) };

  /* Validate URL */
  let parsed;
  try {
    parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http/https URLs allowed');
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid URL: ' + e.message }) };
  }

  try {
    const r = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StudyOS/2.0; +https://studyos.app)',
        'Accept':     'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow'
    });

    if (!r.ok) throw new Error(`Page returned ${r.status}`);

    const contentType = r.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error('URL does not point to a readable page (got ' + contentType.split(';')[0] + ')');
    }

    const html = await r.text();
    const text = stripHTML(html);

    if (text.length < 80) throw new Error('Page has too little readable text. Try pasting the content directly.');

    /* Return first 8000 chars — enough for any study kit */
    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ text: text.substring(0, 8000), length: text.length })
    };

  } catch (e) {
    const msg = e.name === 'AbortError' ? 'Page took too long to load (>12s). Try another URL.'
              : e.message || 'Failed to fetch URL';
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: msg }) };
  }
};
