import type { Database } from '@/types/database';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env';

/**
 * Client Supabase administrateur (clé `service_role`).
 *
 * **À utiliser uniquement côté serveur**, dans des routes API ou des
 * Server Actions clairement identifiées comme admin (webhooks Stripe,
 * cron d'anonymisation, scripts de migration applicatifs).
 *
 * Ce client **bypasse Row Level Security**. Toute opération qui passe
 * par lui doit être :
 *   - justifiée par un cas d'usage admin légitime,
 *   - journalisée dans `journal_admin` quand elle modifie des données.
 *
 * Singleton par process (jamais exposé côté client par construction :
 * `SUPABASE_SERVICE_ROLE_KEY` n'est pas préfixé `NEXT_PUBLIC_`).
 */
type AdminSupabase = ReturnType<typeof createClient<Database>>;

let instance: AdminSupabase | null = null;

export function getSupabaseAdmin(): AdminSupabase {
  if (instance === null) {
    instance = createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return instance;
}

/** Réinitialise le singleton. Réservé aux tests. */
export function resetSupabaseAdmin(): void {
  instance = null;
}
