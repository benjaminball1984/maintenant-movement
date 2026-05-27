/**
 * Branchement automatique des flux V1 (don, adhésion, cagnotte) aux
 * caisses V2 (cycle V2 V2.3.27).
 *
 * Doctrine V2 D7 : « régime B (collecte vers le mouvement) = l'argent
 * arrive bien à Maintenant!, dans une Caisse dédiée. » Chaque
 * confirmation de paiement V1 doit poser une entrée dans la Caisse
 * appropriée (une caisse globale par type de contribution + une caisse
 * par cagnotte solidaire).
 *
 * Idempotence : `transaction_entrante` a un index unique partiel sur
 * `(source_type, source_id) WHERE statut IN ('initiee', 'confirmee')`,
 * donc un même `don` ou `adhesion` ne génère qu'une seule entrée. Le
 * helper retourne `ok: true` même si une entrée existait déjà.
 *
 * Fire-and-forget : tout échec ici est loggé mais n'invalide pas la
 * confirmation V1 (l'utilisateur a payé ; la trace comptable peut être
 * rejouée plus tard).
 */

import type { CanalCaisse, TypeCaisse } from '@/lib/caisse';
import { getSupabaseServer } from '@/lib/supabase';
import type { Json } from '@/types/database';

/**
 * Obtient ou crée la caisse globale pour un type donné (adhésion, don,
 * cotisation). Renvoie l'`id` de la caisse.
 *
 * Caisse globale = une par type, pas d'`objet_id`. Au sein du même
 * `typeCaisse`, une seule caisse `ouverte` à la fois (convention V2.2.3).
 */
export async function obtenirOuCreerCaisseGlobale(
  typeCaisse: Exclude<TypeCaisse, 'cagnotte'>,
): Promise<{ ok: true; caisseId: string } | { ok: false; message: string }> {
  const supabase = await getSupabaseServer();

  const { data: existante } = await supabase
    .from('caisse')
    .select('id')
    .eq('type_caisse', typeCaisse)
    .is('objet_id', null)
    .eq('statut', 'ouverte')
    .maybeSingle();

  if (existante !== null) {
    return { ok: true, caisseId: existante.id };
  }

  const libelles: Record<typeof typeCaisse, string> = {
    adhesion: 'Adhésions du mouvement',
    cotisation_solidaire: 'Cotisations solidaires',
    don_general: 'Dons généraux',
    autre: 'Caisse divers',
  };

  const { data, error } = await supabase
    .from('caisse')
    .insert({
      type_caisse: typeCaisse,
      libelle: libelles[typeCaisse],
      objet_type: null,
      objet_id: null,
    })
    .select('id')
    .single();

  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'Création de caisse impossible.' };
  }
  return { ok: true, caisseId: data.id };
}

/**
 * Obtient ou crée la caisse d'une cagnotte. Index unique partiel V2.2.3
 * garantit une seule caisse cagnotte ouverte par `objet_id`.
 */
export async function obtenirOuCreerCaisseCagnotte(
  cagnotteId: string,
  libelleCagnotte: string,
): Promise<{ ok: true; caisseId: string } | { ok: false; message: string }> {
  const supabase = await getSupabaseServer();

  const { data: existante } = await supabase
    .from('caisse')
    .select('id')
    .eq('type_caisse', 'cagnotte')
    .eq('objet_type', 'cagnotte')
    .eq('objet_id', cagnotteId)
    .eq('statut', 'ouverte')
    .maybeSingle();

  if (existante !== null) {
    return { ok: true, caisseId: existante.id };
  }

  const { data, error } = await supabase
    .from('caisse')
    .insert({
      type_caisse: 'cagnotte',
      libelle: `Cagnotte : ${libelleCagnotte.slice(0, 180)}`,
      objet_type: 'cagnotte',
      objet_id: cagnotteId,
    })
    .select('id')
    .single();

  if (error !== null || data === null) {
    return { ok: false, message: error?.message ?? 'Création de caisse cagnotte impossible.' };
  }
  return { ok: true, caisseId: data.id };
}

export interface PoserEntreeCaisseOptions {
  caisseId: string;
  sourceType:
    | 'don'
    | 'adhesion'
    | 'cagnotte'
    | 'cotisation_solidaire'
    | 'autre'
    | 'regularisation_manuelle';
  sourceId?: string;
  montant: number;
  canal: CanalCaisse;
  motif?: string;
  payeurPersonneId?: string;
  payeurExterneNom?: string;
  payeurExterneEmail?: string;
  metadata?: Json;
  statut?: 'initiee' | 'confirmee';
}

export type ResultatPoserEntree =
  | { ok: true; entreeId: string | null /* null si déjà existante */ }
  | { ok: false; message: string };

/**
 * Pose une entrée dans `transaction_entrante`. Idempotent grâce à
 * l'index unique partiel (V2.3.26). Si une entrée existe déjà avec
 * la même paire `(source_type, source_id)` en statut actif, on renvoie
 * `ok: true` avec `entreeId: null` (= déjà posée, rien à faire).
 *
 * Fire-and-forget : à appeler depuis les Server Actions V1 de
 * confirmation paiement. Les erreurs sont loggées.
 */
export async function poserEntreeCaisse(
  options: PoserEntreeCaisseOptions,
): Promise<ResultatPoserEntree> {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('transaction_entrante')
      .insert({
        caisse_id: options.caisseId,
        source_type: options.sourceType,
        source_id: options.sourceId ?? null,
        montant: options.montant,
        canal: options.canal,
        statut: options.statut ?? 'confirmee',
        motif: options.motif ?? null,
        payeur_personne_id: options.payeurPersonneId ?? null,
        payeur_externe_nom: options.payeurExterneNom ?? null,
        payeur_externe_email: options.payeurExterneEmail ?? null,
        metadata: options.metadata ?? {},
      })
      .select('id')
      .single();

    if (error !== null) {
      // Code 23505 = violation unique. Cas attendu si l'entrée existe
      // déjà (rejouée). On considère ça comme un succès idempotent.
      if (error.code === '23505') {
        return { ok: true, entreeId: null };
      }
      console.warn('[poserEntreeCaisse] insert échoué :', error.message);
      return { ok: false, message: error.message };
    }
    return { ok: true, entreeId: data?.id ?? null };
  } catch (erreur) {
    console.warn('[poserEntreeCaisse] exception :', erreur);
    return {
      ok: false,
      message: erreur instanceof Error ? erreur.message : 'Erreur inconnue.',
    };
  }
}
