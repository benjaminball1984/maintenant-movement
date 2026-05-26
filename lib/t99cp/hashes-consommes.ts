import { getSupabaseServer } from '@/lib/supabase';
import type { Json } from '@/types/database';

/**
 * Anti-réutilisation des hashes de transactions T99CP / Polygon.
 *
 * Pose le garde-fou applicatif côté serveur autour de la table
 * `t99cp_hash_consomme` (cycle V2 chantier V2.1.1). Chaque flux qui accepte
 * un `tx_hash` en provenance d'un wallet externe DOIT appeler
 * `enregistrerHashConsomme` AVANT d'octroyer ce que le paiement débloque
 * (adhésion, don, accès à un produit du marché, prestation SEL…).
 *
 * Le respect de cette discipline garantit :
 *
 * 1. **Unicité** : la table a une clé primaire `tx_hash`, donc une tentative
 *    de réutilisation échoue avec un `unique_violation` Postgres → retourne
 *    `{ ok: false, raison: 'deja_consomme' }` ici.
 * 2. **Traçabilité** : qui (`consomme_par_profil_id`) a consommé quoi
 *    (`consomme_par_type` + `consomme_par_id`) à quel moment, avec quels
 *    paramètres (`metadata`).
 * 3. **Audit individuel** : la RLS permet à chaque personne de voir SES
 *    hashes consommés. Utile pour la transparence côté profil.
 *
 * Note importante : ce module utilise le client Supabase serveur authentifié
 * par défaut, qui passe par le service_role. Ne JAMAIS l'appeler depuis un
 * Client Component : les `tx_hash` à enregistrer doivent venir d'un retour
 * de redirection vérifié serveur-side (Server Action ou route handler).
 */

export type TypeConsommation =
  | 'adhesion'
  | 'don'
  | 'cagnotte'
  | 'marche_solidaire'
  | 'sel'
  | 'autre';

export interface EnregistrementHashOptions {
  /** Hash de la transaction Polygon (`0x...`). Validé côté SQL. */
  txHash: string;

  /** Type de flux applicatif consommateur. Liste fermée extensible. */
  type: TypeConsommation;

  /** Identifiant de l'objet métier qui consomme (cagnotte, adhésion, etc.). */
  cibleId?: string;

  /** Profil qui déclenche la consommation. Récupéré depuis la session côté caller. */
  profilId: string;

  /** Métadonnées libres : montant, destinataire vérifié, bloc, etc. */
  metadata?: Json;
}

export type ResultatEnregistrement =
  | { ok: true }
  | { ok: false; raison: 'deja_consomme' | 'erreur_base'; message?: string };

/**
 * Enregistre un hash comme consommé. Retourne `{ ok: false, raison: 'deja_consomme' }`
 * si le hash est déjà présent (clé primaire violée).
 */
export async function enregistrerHashConsomme(
  options: EnregistrementHashOptions,
): Promise<ResultatEnregistrement> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('t99cp_hash_consomme').insert({
    tx_hash: options.txHash,
    consomme_par_type: options.type,
    consomme_par_id: options.cibleId ?? null,
    consomme_par_profil_id: options.profilId,
    metadata: options.metadata ?? {},
  });

  if (error === null) {
    return { ok: true };
  }

  // Code Postgres `23505` = unique_violation. Code Supabase peut aussi exposer
  // la chaîne `duplicate key value violates unique constraint` dans le message.
  if (error.code === '23505' || /duplicate key/i.test(error.message)) {
    return { ok: false, raison: 'deja_consomme' };
  }

  return { ok: false, raison: 'erreur_base', message: error.message };
}

/**
 * Vérifie sans écrire si un hash est déjà consommé. Utile pour un check
 * préventif côté UI (« ce hash a déjà été utilisé »). L'enregistrement
 * définitif passe quand même par `enregistrerHashConsomme` qui est la
 * seule source de vérité atomique grâce à la contrainte d'unicité.
 */
export async function hashDejaConsomme(txHash: string): Promise<boolean> {
  const supabase = await getSupabaseServer();
  const { count, error } = await supabase
    .from('t99cp_hash_consomme')
    .select('tx_hash', { count: 'exact', head: true })
    .eq('tx_hash', txHash);

  if (error !== null) {
    // En cas d'erreur de lecture, on retourne false pour ne pas bloquer
    // un flux légitime sur un faux positif. La sécurité réelle vient de
    // `enregistrerHashConsomme` (qui échouera proprement si le hash existe).
    return false;
  }

  return (count ?? 0) > 0;
}
