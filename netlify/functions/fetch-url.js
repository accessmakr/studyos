/**
 * StudyOS — /fetch-url
 * Server-side URL content extractor.
 * Primary: direct fetch + HTML strip.
 * Fallback: Jina AI Reader (handles JS-rendered pages).
 * No API key needed for either approach.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const REMOVE_TAGS = ['script','style','nav','footer','header','aside','iframe','noscript','svg','form','button','menu'];

function stripHTML(html) {
  let t = html;
  REMOVE_TAGS.forEach(tag => {
    t = t.replace(new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'gi'), ' ');
  });
  t = t.replace(/<\/(p|div|li|h[1-6]|blockquote|tr|br)>/gi, '\n');
  t = t.replace(/<[^>]+>/g, ' ');
  return t
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&hellip;/g, '...').replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
}

async function fetchDirect(url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; StudyOS/2.0)',
      'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
    },
    signal: AbortSignal.timeout(10000),
    redirect: 'follow'
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('text/html') && !ct.includes('text/plain')) {
    throw new Error('Not a readable page');
  }
  const html = await r.text();
  return stripHTML(html);
}

async function fetchViaJina(url) {
  /* Jina AI Reader: renders JS pages server-side, returns clean markdown */
  const r = await fetch(`https://r.jina.ai/${url}`, {
    headers: { 'Accept': 'text/plain', 'User-Agent': 'StudyOS/2.0' },
    signal: AbortSignal.timeout(15000)
  });
  if (!r.ok) throw new Error(`Jina HTTP ${r.status}`);
  return (await r.text()).trim();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const rawUrl = event.queryStringParameters?.url;
  if (!rawUrl) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'url parameter required' }) };

  let parsed;
  try {
    parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http/https URLs allowed');
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid URL: ' + e.message }) };
  }

  let text = '';
  let method = '';

  try {
    text = await fetchDirect(rawUrl);
    method = 'direct';
  } catch (e1) {
    console.log('Direct fetch failed:', e1.message, '— trying Jina');
    try {
      text = await fetchViaJina(rawUrl);
      method = 'jina';
    } catch (e2) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ error: 'Could not read this page. Try pasting the text directly instead.' })
      };
    }
  }

  if (!text || text.length < 80) {
    return {
      statusCode: 422,
      headers: CORS,
      body: JSON.stringify({ error: 'Page has too little readable text. Paste the content directly.' })
    };
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ text: text.substring(0, 8000), length: text.length, method })
  };
};
