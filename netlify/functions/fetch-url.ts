import { Handler } from '@netlify/functions'
import * as cheerio from 'cheerio'

export const handler: Handler = async (event) => {
  const { url } = JSON.parse(event.body || '{}')
  
  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'URL required' }) }
  }

  try {
    const res = await fetch(url)
    const html = await res.text()
    const $ = cheerio.load(html)
    
    $('script, style, nav, footer').remove()
    const text = $('body').text().replace(/\s+/g, ' ').trim()
    
    return {
      statusCode: 200,
      body: JSON.stringify({ text: text.slice(0, 50000) })
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch URL' }) }
  }
}
