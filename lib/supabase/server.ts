import type { Database } from '@/types/database';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

/**
 * Client Supabase pour Server Components et Server Actions.
 *
 * Lit/écrit les cookies de session via `next/headers`. Si appelé depuis
 * un Server Component (où `cookies()` est en lecture seule), les
 * tentatives d'écriture sont silencieusement ignorées : le middleware
 * d'auth (à poser au chantier 1.2) refresh le token de son côté.
 *
 * À appeler avec `await` : `next/headers` est asynchrone à partir de
 * Next 15 et déjà accepté avec `await` en Next 14 récent.
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component : `cookies()` est en lecture seule.
          // Le refresh du token se fait par le middleware d'auth (chantier 1.2).
        }
      },
    },
  });
}
