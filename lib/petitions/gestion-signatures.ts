import { getSession } from '@/lib/auth/session';
import { getSupabaseAdmin, getSupabaseServer } from '@/lib/supabase';

/**
 * Gestion des signatures d'une pétition ou d'un appel (V2.6.139).
 *
 * Demande de Lilou/Ben du 03/09/2026 : l'équipe et la personne qui a lancé le
 * texte doivent pouvoir corriger une signature (faute de frappe dans un nom
 * d'organisation) ou la retirer (insulte, doublon, demande de la personne).
 *
 * **Deux niveaux de droit, volontairement distincts :**
 *
 * - **Administration** (admin général ou modération « petitions ») : voit tout,
 *   y compris les adresses email, et peut supprimer définitivement une
 *   signature — le seul cas qui l'exige est une demande d'effacement RGPD.
 * - **Créateurice de la pétition** : peut corriger et retirer, mais ne voit
 *   des adresses email qu'une forme masquée (`ca***@exemple.fr`). C'est
 *   délibéré : lancer une pétition ne donne pas accès au carnet d'adresses de
 *   ses signataires. La règle historique reste celle de la migration 013 —
 *   la créatrice ne joint que les personnes qui ont coché « j'autorise le
 *   créateur ou la créatrice à me contacter ».
 *
 * Les lectures et écritures passent par le client `service_role`, APRÈS
 * vérification explicite du droit ici. C'est ce qui permet à une créatrice
 * non-admin de gérer ses signatures sans qu'on élargisse la RLS de la table
 * (qui, elle, resterait ouverte à toutes ses lectures, emails compris).
 */

/** Ce que voit la personne qui gère, pour une signature donnée. */
export interface SignatureAGerer {
  id: string;
  type_signataire: 'individu' | 'organisation';
  /** Prénom et nom, quand la personne les a donnés. */
  prenom: string | null;
  nom: string | null;
  /** Pseudonyme, quand la personne a choisi de ne pas donner son identité. */
  pseudonyme: string | null;
  organisation_nom: string | null;
  organisation_categorie: string | null;
  organisation_territoire: string | null;
  organisation_affichage_public: boolean;
  /** Adresse complète pour l'administration, masquée pour la créatrice. */
  email_affiche: string;
  code_postal: string;
  signee_le: string;
  /** Non nul = signature retirée (elle ne compte plus, elle est restaurable). */
  retiree_le: string | null;
  raison_retrait: string | null;
}

/** Ce que la personne courante a le droit de faire sur ces signatures. */
export interface DroitsGestionSignatures {
  /** Peut voir la liste, corriger et retirer. */
  peutGerer: boolean;
  /**
   * Peut voir les emails en clair et supprimer définitivement.
   * Réservé à l'administration.
   */
  estAdministration: boolean;
}

/**
 * Masque une adresse email en gardant juste de quoi reconnaître un doublon.
 *
 * `camille.dupont@exemple.fr` devient `ca***@exemple.fr`. On garde le domaine
 * (utile pour repérer deux inscriptions de la même personne) mais pas
 * l'identifiant, qui contient très souvent le nom complet.
 *
 * Fonction pure, testée.
 */
export function masquerEmail(email: string): string {
  const arobase = email.lastIndexOf('@');
  if (arobase <= 0) {
    // Pas un email reconnaissable : on ne prend pas le risque d'en montrer
    // une partie au hasard.
    return '***';
  }
  const identifiant = email.slice(0, arobase);
  const domaine = email.slice(arobase);
  const debut = identifiant.slice(0, 2);
  return `${debut}***${domaine}`;
}

/**
 * Droits de la personne courante sur les signatures d'une pétition donnée.
 *
 * Renvoie `{ peutGerer: false }` pour toute personne non connectée, ou
 * connectée mais étrangère à cette pétition.
 */
export async function droitsGestionSignatures(
  petitionId: string,
): Promise<DroitsGestionSignatures> {
  const session = await getSession();
  if (session === null) {
    return { peutGerer: false, estAdministration: false };
  }

  const supabase = await getSupabaseServer();

  const [{ data: estAdminGeneral }, { data: estModerateurice }] = await Promise.all([
    supabase.rpc('est_admin_general'),
    supabase.rpc('est_moderateurice', { onglet_demande: 'petitions' }),
  ]);

  const estAdministration = estAdminGeneral === true || estModerateurice === true;
  if (estAdministration) {
    return { peutGerer: true, estAdministration: true };
  }

  // Sinon : est-ce la personne qui a lancé cette pétition ?
  const { data: petition } = await supabase
    .from('petition')
    .select('createurice_id')
    .eq('id', petitionId)
    .maybeSingle();

  const estCreaturice = petition?.createurice_id === session.userId;
  return { peutGerer: estCreaturice, estAdministration: false };
}

/**
 * Liste les signatures d'une pétition pour l'écran de gestion, retirées
 * comprises (elles s'affichent grisées, avec un bouton pour les restaurer).
 *
 * Retourne une liste vide si la personne courante n'a pas le droit — jamais
 * une erreur, pour que la page se rende normalement sans bloc de gestion.
 */
export async function listerSignaturesAGerer(petitionId: string): Promise<SignatureAGerer[]> {
  const droits = await droitsGestionSignatures(petitionId);
  if (!droits.peutGerer) {
    return [];
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('signature_petition')
    .select(
      'id, type_signataire, prenom, nom, pseudonyme, organisation_nom, organisation_categorie, organisation_territoire, organisation_affichage_public, email, code_postal, created_at, retiree_le, raison_retrait',
    )
    .eq('petition_id', petitionId)
    .order('created_at', { ascending: false })
    .limit(LIMITE_GESTION);

  if (error !== null || data === null) {
    return [];
  }

  return data.map((ligne) => ({
    id: ligne.id,
    type_signataire: ligne.type_signataire === 'organisation' ? 'organisation' : 'individu',
    prenom: ligne.prenom,
    nom: ligne.nom,
    pseudonyme: ligne.pseudonyme,
    organisation_nom: ligne.organisation_nom,
    organisation_categorie: ligne.organisation_categorie,
    organisation_territoire: ligne.organisation_territoire,
    organisation_affichage_public: ligne.organisation_affichage_public,
    email_affiche: droits.estAdministration ? ligne.email : masquerEmail(ligne.email),
    code_postal: ligne.code_postal,
    signee_le: ligne.created_at,
    retiree_le: ligne.retiree_le,
    raison_retrait: ligne.raison_retrait,
  }));
}

/**
 * Plafond de l'écran de gestion. Au-delà il faudra paginer ; à ce jour la
 * pétition la plus signée en compte ~14 000, mais aucune n'a besoin d'être
 * gérée ligne à ligne au-delà des dernières arrivées.
 */
const LIMITE_GESTION = 500;
