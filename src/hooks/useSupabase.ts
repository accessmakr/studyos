import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function saveStudyKit(data: any, userId: string) {
  const { error } = await supabase
    .from('study_kits')
    .insert([{ user_id: userId, data, created_at: new Date().toISOString() }])
  if (error) throw error
}
