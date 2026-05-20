import type { Database } from '@/types/database';
import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

/**
 * Client Supabase pour Client Components (navigateur).
 *
 * Singleton par fenêtre : la première création initialise le client,
 * les appels suivants retournent la même instance. Évite de multiplier
 * les connexions Realtime.
 *
 * Utilise la clé anonyme : toutes les requêtes restent soumises à RLS.
 */
type ClientSupabase = ReturnType<typeof createBrowserClient<Database>>;

let instance: ClientSupabase | null = null;

export function getSupabaseClient(): ClientSupabase {
  if (instance === null) {
    instance = createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return instance;
}

/** Réinitialise le singleton. Réservé aux tests. */
export function resetSupabaseClient(): void {
  instance = null;
}
