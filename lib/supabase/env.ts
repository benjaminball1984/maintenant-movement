/**
 * Lecture validée des variables d'environnement Supabase.
 *
 * Chaque getter est paresseux : il ne lit `process.env` qu'au moment de
 * l'appel. Cela permet aux fichiers du projet d'`import` les fonctions
 * sans déclencher d'erreur, et garantit qu'au premier usage réel de
 * Supabase (création d'un client), l'absence de variable est signalée
 * immédiatement avec un message clair pointant vers `.env.example`.
 *
 * Tant que `NEXT_PUBLIC_SUPABASE_URL` n'est pas fourni (instance non
 * créée), aucun appel à Supabase n'aboutit, mais le code applicatif
 * peut être importé, typé et linté.
 */

function lireObligatoire(nom: string): string {
  const valeur = process.env[nom];
  if (valeur === undefined || valeur === '') {
    throw new Error(
      `Variable d'environnement "${nom}" manquante. Voir .env.example et créer .env.local avec les clés du projet Supabase (région Francfort).`,
    );
  }
  return valeur;
}

/** URL HTTPS du projet Supabase. Exposée côté client. */
export function getSupabaseUrl(): string {
  return lireObligatoire('NEXT_PUBLIC_SUPABASE_URL');
}

/** Clé publique anonyme. Exposée côté client, soumise à RLS. */
export function getSupabaseAnonKey(): string {
  return lireObligatoire('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Clé service_role. Bypasse RLS. **Jamais** exposée côté client.
 * Utilisée uniquement dans les routes API serveur (webhooks, cron,
 * migrations applicatives).
 */
export function getSupabaseServiceRoleKey(): string {
  return lireObligatoire('SUPABASE_SERVICE_ROLE_KEY');
}
