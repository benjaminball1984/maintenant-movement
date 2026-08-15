/**
 * Types de la curation de collectes externes (demande Ben 2026-06-15).
 *
 * Un « candidat » est une collecte repérée sur une plateforme tierce (Ulule,
 * MiiMOSA…), normalisée vers une forme commune avant d'être déposée dans la
 * file de modération a priori (`cagnotte_externe`, statut `propose`).
 */

/** Collecte externe normalisée, prête à proposer à la modération. */
export interface CandidatCagnotte {
  titre: string;
  resume: string | null;
  organisateur: string | null;
  /** Plateforme d'origine (badge + provenance), ex. « Ulule ». */
  plateforme: string;
  /** Lien sortant ; sert aussi de clé d'idempotence et d'anti-doublon. */
  source_url: string;
  objectif_centimes: number | null;
  collecte_centimes: number | null;
  devise: string;
  pourcentage: number | null;
  /** Échéance de la collecte (ISO 8601) si exposée. */
  echeance: string | null;
  /** URL du visuel de la source (non recopiée dans notre bucket). */
  vignette_url: string | null;
  /** Thèmes détectés (aide à la modération + filtre public). */
  themes: string[];
  /** Type de collecte détecté (livre, jeu, caisse_greve, cantine…). */
  type_collecte: string | null;
  metadata: Record<string, unknown>;
}

/** Un adaptateur sait interroger une plateforme et renvoyer des candidats. */
export interface AdaptateurCollecte {
  /** Nom de la plateforme (valeur stockée dans `plateforme`). */
  nom: string;
  /** Récolte des candidats (déjà filtrés « actifs »), best-effort. */
  recolter(): Promise<CandidatCagnotte[]>;
}
