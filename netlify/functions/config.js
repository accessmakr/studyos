/**
 * StudyOS — /config
 * Serves public config to the frontend.
 * Supabase anon key is safe to expose in browser,
 * but we keep it server-side to avoid manual
 * hardcoding in the HTML file.
 */
exports.handler = async () => ({
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600'
  },
  body: JSON.stringify({
    supabaseUrl:      process.env.SUPABASE_URL      || '',
    supabaseAnonKey:  process.env.SUPABASE_ANON_KEY || '',
    hasSupabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  })
});
