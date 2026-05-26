/**
 * Helpers pour la table `droit` atomique V2 (cycle V2 D10/MD1-MD6).
 *
 * Cycle V2 chantier V2.1.3 : ces helpers sont la couche TypeScript
 * au-dessus de la table SQL `droit` (cf. migration `20260527020000_droit.sql`).
 * Ils servent :
 *
 * - À **accorder** un droit (`accorderDroit`) ou un **preset entier**
 *   (`appliquerPreset`) à une personne sur une cible (espace ou objet).
 * - À **retirer** un droit (`retirerDroit`) via soft delete (`retire_le`),
 *   cohérent avec `droit_admin` et la doctrine MD3 (traçabilité obligatoire).
 * - À **vérifier** un droit (`verifierDroit`) ou **lister** les droits
 *   actifs d'une personne (`listerDroitsDuProfil`).
 *
 * **Important** : les helpers RLS V1 (`est_admin_general`, `est_moderateurice`,
 * etc.) continuent de lire la table V1 `droit_admin` tant que la migration
 * applicative n'est pas faite. Cette coexistence est volontaire (doctrine
 * de greffe, MD1 V2) : aucun droit n'est perdu pendant la transition.
 *
 * **Règle MD3 « non-élévation »** : un appel à `accorderDroit` doit, côté
 * Server Action, vérifier que l'appelant·e détient elle-même le droit
 * accordé sur la cible — sinon refus. Cette logique vit côté Server Action
 * applicative (pas dans la migration RLS qui ne peut pas raisonner sur
 * la sous-relation entre droits). L'aide `peutAccorder` ci-dessous est le
 * helper recommandé.
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Liste exhaustive des permissions atomiques V2 (cf. MD1). À garder
 * synchronisée avec le check `type_droit` de la migration et avec les
 * presets `lib/droit-presets.ts`.
 */
export type TypeDroit =
  // Contenu / rédaction
  | 'ecrire_article'
  | 'modifier_article_propre'
  | 'modifier_article_autrui'
  | 'supprimer_article'
  | 'publier_mini_blog'
  // Objets
  | 'creer_objet'
  | 'modifier_objet'
  | 'supprimer_objet'
  | 'telecharger_fichier'
  | 'gerer_image'
  // Modération
  | 'moderer_a_priori'
  | 'moderer_a_posteriori'
  | 'moderer_editorial'
  | 'traiter_signalement'
  // Média
  | 'selectionner_pour_media'
  | 'editorialiser'
  | 'mega_edito'
  // Membres / espace
  | 'gerer_membres'
  | 'gerer_mandataires'
  | 'administrer_espace'
  | 'gerer_droits'
  // Finance / caisse
  | 'gerer_caisse'
  | 'valider_reversement'
  | 'consulter_journal'
  // Admin plateforme (MD5)
  | 'admin_total_plateforme';

/**
 * Type de cible d'un droit (cf. MD2). NULL pour les droits globaux
 * (admin total). Liste fermée extensible.
 */
export type TypeCibleDroit =
  | 'espace_commune'
  | 'espace_federation'
  | 'espace_confederation'
  | 'espace_campagne'
  | 'espace_gt'
  | 'objet_petition'
  | 'objet_mobilisation'
  | 'objet_cagnotte'
  | 'objet_moment_solidaire'
  | 'objet_article'
  | 'objet_offre_marche'
  | 'objet_offre_entraide'
  | 'objet_service_sel'
  | 'objet_sondage'
  | 'plateforme';

export interface AccorderDroitOptions {
  /** À qui (FK `personne.id`, donc `auth.users.id`). */
  personneId: string;
  /** Quel droit atomique accorder. */
  typeDroit: TypeDroit;
  /** Sur quelle cible. NULL pour un droit global. */
  cibleType?: TypeCibleDroit | null;
  cibleId?: string | null;
  /** Qui accorde (auditabilité MD3). */
  accordeParPersonneId?: string;
  /** Métadonnées libres (preset d'origine, motif…). */
  metadata?: Record<string, unknown>;
  /** Date d'accord (par défaut now). Utile pour le backfill. */
  accordeLe?: Date;
}

export type ResultatDroit = { ok: true; droitId: string } | { ok: false; message: string };

/**
 * Accorde un droit. Si une ligne ACTIVE existe déjà pour le même triplet
 * `(personne, type, cible)`, retourne `{ ok: true }` avec l'id existant
 * (idempotence — utile pour le backfill ou ré-application d'un preset).
 *
 * **Garde-fou MD3 (non-élévation)** : la vérification que l'appelant·e
 * peut accorder ce droit DOIT être faite par le caller via
 * `peutAccorder(...)` AVANT d'appeler cette fonction. La RLS de la
 * migration ne couvre que la défense secondaire « est_admin_general ».
 */
export async function accorderDroit(options: AccorderDroitOptions): Promise<ResultatDroit> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('droit')
    .upsert(
      {
        personne_id: options.personneId,
        type_droit: options.typeDroit,
        cible_type: options.cibleType ?? null,
        cible_id: options.cibleId ?? null,
        accorde_par: options.accordeParPersonneId ?? null,
        accorde_le: (options.accordeLe ?? new Date()).toISOString(),
        metadata: (options.metadata ?? {}) as never,
      },
      {
        onConflict: 'personne_id,type_droit,cible_type,cible_id',
        ignoreDuplicates: true,
      },
    )
    .select('id')
    .maybeSingle();

  if (error !== null) {
    return { ok: false, message: error.message };
  }
  if (data === null) {
    return { ok: false, message: 'Aucune ligne renvoyée après upsert.' };
  }

  return { ok: true, droitId: data.id };
}

export interface RetirerDroitOptions {
  personneId: string;
  typeDroit: TypeDroit;
  cibleType?: TypeCibleDroit | null;
  cibleId?: string | null;
  retireParPersonneId?: string;
}

/**
 * Retire un droit (soft delete : remplit `retire_le` et `retire_par`,
 * ne supprime pas la ligne pour audit). Si aucun droit actif n'existe,
 * retourne `{ ok: false }` sans toucher au passé.
 */
export async function retirerDroit(options: RetirerDroitOptions): Promise<ResultatDroit> {
  const supabase = await getSupabaseServer();
  let requete = supabase
    .from('droit')
    .update({
      retire_le: new Date().toISOString(),
      retire_par: options.retireParPersonneId ?? null,
    })
    .eq('personne_id', options.personneId)
    .eq('type_droit', options.typeDroit)
    .is('retire_le', null);

  if (options.cibleType === null || options.cibleType === undefined) {
    requete = requete.is('cible_type', null);
  } else {
    requete = requete.eq('cible_type', options.cibleType);
  }
  if (options.cibleId === null || options.cibleId === undefined) {
    requete = requete.is('cible_id', null);
  } else {
    requete = requete.eq('cible_id', options.cibleId);
  }

  const { data, error } = await requete.select('id').maybeSingle();
  if (error !== null) {
    return { ok: false, message: error.message };
  }
  if (data === null) {
    return { ok: false, message: 'Aucun droit actif à retirer pour cette cible.' };
  }
  return { ok: true, droitId: data.id };
}

/**
 * Vérifie qu'une personne détient un droit actif sur une cible. Lecture
 * directe de la table V2 ; pour les vérifications V1, continuer à utiliser
 * les helpers SQL `est_admin_general`, `est_moderateurice`, etc. tant que
 * la migration applicative n'est pas faite.
 */
export async function verifierDroit(
  personneId: string,
  typeDroit: TypeDroit,
  cible?: { type: TypeCibleDroit | null; id: string | null },
): Promise<boolean> {
  const supabase = await getSupabaseServer();
  let requete = supabase
    .from('droit')
    .select('id', { count: 'exact', head: true })
    .eq('personne_id', personneId)
    .eq('type_droit', typeDroit)
    .is('retire_le', null);

  if (cible?.type === undefined || cible.type === null) {
    requete = requete.is('cible_type', null);
  } else {
    requete = requete.eq('cible_type', cible.type);
  }
  if (cible?.id === undefined || cible.id === null) {
    requete = requete.is('cible_id', null);
  } else {
    requete = requete.eq('cible_id', cible.id);
  }

  const { count, error } = await requete;
  if (error !== null) {
    return false;
  }
  return (count ?? 0) > 0;
}

/**
 * Garde-fou MD3 « non-élévation » : vérifie qu'un accordant détient lui-même
 * le droit qu'il veut accorder sur la cible visée. À appeler dans les Server
 * Actions AVANT `accorderDroit`. Une admin total plateforme passe toujours.
 *
 * Cas particulier : `gerer_droits` ne peut PAS être accordé en dehors de
 * l'exception haute MD3 (admin du Cercle de plateforme, marqueur
 * `admin_total_plateforme`).
 */
export async function peutAccorder(
  accordantPersonneId: string,
  typeDroit: TypeDroit,
  cible?: { type: TypeCibleDroit | null; id: string | null },
): Promise<boolean> {
  // Verrou particulier : `gerer_droits` requiert l'admin total plateforme.
  if (typeDroit === 'gerer_droits') {
    return verifierDroit(accordantPersonneId, 'admin_total_plateforme', {
      type: null,
      id: null,
    });
  }
  // Cas général : l'accordant doit détenir le droit sur la cible (non-élévation).
  // Un admin total plateforme passe toujours.
  const estAdminTotal = await verifierDroit(accordantPersonneId, 'admin_total_plateforme', {
    type: null,
    id: null,
  });
  if (estAdminTotal) return true;
  return verifierDroit(accordantPersonneId, typeDroit, cible);
}

/**
 * Liste les droits actifs d'une personne. Pour audit ou affichage côté
 * UI d'admin.
 */
export interface LigneDroit {
  id: string;
  typeDroit: TypeDroit;
  cibleType: TypeCibleDroit | null;
  cibleId: string | null;
  accordeLe: string;
  accordePar: string | null;
}

export async function listerDroitsDuProfil(personneId: string): Promise<LigneDroit[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('droit')
    .select('id, type_droit, cible_type, cible_id, accorde_le, accorde_par')
    .eq('personne_id', personneId)
    .is('retire_le', null)
    .order('accorde_le', { ascending: false });

  if (error !== null || data === null) return [];

  return data.map((ligne) => ({
    id: ligne.id,
    typeDroit: ligne.type_droit as TypeDroit,
    cibleType: (ligne.cible_type as TypeCibleDroit | null) ?? null,
    cibleId: ligne.cible_id ?? null,
    accordeLe: ligne.accorde_le,
    accordePar: ligne.accorde_par ?? null,
  }));
}
