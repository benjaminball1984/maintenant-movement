/**
 * Point d'export unique des clients Supabase.
 *
 * Usage côté serveur :
 *   const supabase = await getSupabaseServer();
 *   const { data } = await supabase.from('personne').select('*').single();
 *
 * Usage côté client (React component avec `'use client'`) :
 *   const supabase = getSupabaseClient();
 *
 * Usage admin (jamais exposé côté client) :
 *   const supabase = getSupabaseAdmin();
 */
export { getSupabaseAdmin, resetSupabaseAdmin } from './admin';
export { getSupabaseClient, resetSupabaseClient } from './client';
export {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from './env';
export { getSupabaseServer } from './server';
