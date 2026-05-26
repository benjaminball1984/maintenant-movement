/**
 * Helpers de gestion des consentements RGPD granulaires (cycle V2 D8).
 *
 * Cycle V2 chantier V2.1.2 : entité `Consentement` greffée par-dessus
 * les booléens historiques de `signature_petition`. Chaque case devient
 * une ligne distincte dans la table `consentement`, traçable et
 * révocable. Voir `supabase/migrations/20260527010000_consentement.sql`
 * pour le schéma et les policies RLS.
 *
 * **Cycle de vie d'un consentement** :
 *
 * 1. **Création** (au moment de la signature, de l'inscription, ou via
 *    paramètres profil) : `enregistrerConsentement` insère une ligne.
 *    Si la ligne existe déjà pour le même (profil, type, objet), on bascule
 *    en update — l'unicité est gérée par la contrainte SQL.
 * 2. **Révocation** : `revoquerConsentement` met `valeur = false` sur la
 *    ligne existante. Ne supprime PAS (trace conservée pour audit RGPD).
 * 3. **Lecture** : `listerConsentementsDuProfil` retourne tous les
 *    consentements (actifs ET révoqués) pour affichage côté profil.
 *
 * Limite de V2.1.2 : pas d'historique multi-versions (une seule ligne par
 * triplet). Si on veut tracer la séquence des changements, il faudra une
 * table `consentement_historique` dans un chantier ultérieur.
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type TypeConsentement =
  | 'newsletter_plateforme'
  | 'contact_createur'
  | 'partage_donnees_anonymisees'
  | 'communications_thematique';

export type TypeObjetConsentement =
  | 'petition'
  | 'cagnotte'
  | 'mobilisation'
  | 'sondage'
  | 'campagne'
  | 'autre';

export type SourceConsentement =
  | 'signature_petition_v1'
  | 'signature_petition_v2'
  | 'parametres_profil'
  | 'backfill_signature_v1'
  | 'import_base44';

export interface ConsentementOptions {
  /** Identifiant de la personne (table `profil_unifie`, pas auth.users). */
  profilUnifieId: string;
  /** Nature du consentement (liste fermée extensible). */
  type: TypeConsentement;
  /** État du consentement (`true` = accepté, `false` = refusé/révoqué). */
  valeur: boolean;
  /** Origine du consentement (audit RGPD). */
  source: SourceConsentement;
  /** Objet métier rattaché (optionnel). Si fourni, `objetId` doit l'être aussi. */
  objetType?: TypeObjetConsentement;
  objetId?: string;
  /** Date à appliquer (par défaut now). Utile pour le backfill (date d'origine). */
  dateConsentement?: Date;
}

export type ResultatConsentement =
  | { ok: true; consentementId: string }
  | { ok: false; message: string };

/**
 * Enregistre un consentement. Si une ligne existe déjà pour le même
 * `(profil_unifie_id, type_consentement, objet_id)`, l'opération bascule
 * en UPDATE de la valeur et de la date — c'est le comportement attendu
 * pour les révocations / réacceptations.
 *
 * En base, l'insertion utilise `upsert` (ON CONFLICT DO UPDATE) avec
 * l'index unique de la table.
 */
export async function enregistrerConsentement(
  options: ConsentementOptions,
): Promise<ResultatConsentement> {
  // Cohérence des objet_type / objet_id (rappel de la contrainte CHECK SQL).
  if (
    (options.objetType !== undefined && options.objetId === undefined) ||
    (options.objetId !== undefined && options.objetType === undefined)
  ) {
    return {
      ok: false,
      message: 'objetType et objetId doivent être fournis ensemble (ou tous deux absents).',
    };
  }

  const supabase = await getSupabaseServer();
  const enregistrement: Database['public']['Tables']['consentement']['Insert'] = {
    profil_unifie_id: options.profilUnifieId,
    type_consentement: options.type,
    valeur: options.valeur,
    source: options.source,
    objet_type: options.objetType ?? null,
    objet_id: options.objetId ?? null,
    date_consentement: (options.dateConsentement ?? new Date()).toISOString(),
  };

  const { data, error } = await supabase
    .from('consentement')
    .upsert(enregistrement, {
      // L'index unique de la migration porte sur l'expression
      // (profil_unifie_id, type_consentement, coalesce(objet_id, '00000000...')).
      // Supabase JS attend une liste de colonnes ; on passe la triple
      // logique, le COALESCE étant fait par l'index SQL côté serveur.
      onConflict: 'profil_unifie_id,type_consentement,objet_id',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (error !== null || data === null) {
    return {
      ok: false,
      message: error?.message ?? 'Insertion impossible (cause inconnue).',
    };
  }

  return { ok: true, consentementId: data.id };
}

/**
 * Révoque un consentement (UPDATE valeur à false, jamais DELETE).
 * Si aucun consentement de ce type/objet n'existe pour ce profil,
 * retourne `{ ok: false }` sans créer de ligne fantôme.
 */
export async function revoquerConsentement(
  options: Omit<ConsentementOptions, 'valeur' | 'source' | 'dateConsentement'> & {
    /** Source de la révocation (par défaut `parametres_profil`). */
    source?: SourceConsentement;
  },
): Promise<ResultatConsentement> {
  const supabase = await getSupabaseServer();
  let requete = supabase
    .from('consentement')
    .update({
      valeur: false,
      source: options.source ?? 'parametres_profil',
      // `date_consentement` est mis à jour automatiquement par le trigger SQL
      // quand `valeur` change.
    })
    .eq('profil_unifie_id', options.profilUnifieId)
    .eq('type_consentement', options.type);

  if (options.objetId !== undefined) {
    requete = requete.eq('objet_id', options.objetId);
  } else {
    requete = requete.is('objet_id', null);
  }

  const { data, error } = await requete.select('id').maybeSingle();

  if (error !== null) {
    return { ok: false, message: error.message };
  }

  if (data === null) {
    return {
      ok: false,
      message: 'Aucun consentement existant à révoquer pour cette cible.',
    };
  }

  return { ok: true, consentementId: data.id };
}

export interface LigneConsentement {
  id: string;
  type: TypeConsentement;
  objetType: TypeObjetConsentement | null;
  objetId: string | null;
  valeur: boolean;
  source: SourceConsentement;
  dateConsentement: string;
}

/**
 * Liste tous les consentements (actifs ET révoqués) d'un profil unifié.
 * Tri par date de consentement décroissante (plus récent d'abord).
 */
export async function listerConsentementsDuProfil(
  profilUnifieId: string,
): Promise<LigneConsentement[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('consentement')
    .select('id, type_consentement, objet_type, objet_id, valeur, source, date_consentement')
    .eq('profil_unifie_id', profilUnifieId)
    .order('date_consentement', { ascending: false });

  if (error !== null || data === null) {
    return [];
  }

  return data.map((ligne) => ({
    id: ligne.id,
    type: ligne.type_consentement as TypeConsentement,
    objetType: (ligne.objet_type as TypeObjetConsentement | null) ?? null,
    objetId: ligne.objet_id ?? null,
    valeur: ligne.valeur,
    source: ligne.source as SourceConsentement,
    dateConsentement: ligne.date_consentement,
  }));
}
