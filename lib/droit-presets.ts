/**
 * Presets de droits (cycle V2 D10/MD1) et mapping des 6 niveaux V1 vers
 * la liste atomique V2.
 *
 * Conformément à MD1 : « Un preset = un paquet de `type_droit` coché en
 * un clic, PUIS affinable case par case ». Les presets sont des
 * raccourcis d'attribution, pas des entités rigides ; ils vivent ici en
 * dur (côté code) et la table SQL `droit` reste atomique.
 *
 * Deux familles de presets :
 *
 * 1. **Presets V2** (MD1 explicite) : les 5 « fonctions d'admin » d'une
 *    commune libre, ré-utilisables sur tout espace/objet.
 * 2. **Presets V1** : les 6 niveaux de `droit_admin` (`national`, `admin`,
 *    `moderation`, `tresorerie`, `animation`, `dpd`) traduits en paquets
 *    de droits atomiques V2. Utilisés par le backfill V2.1.3.
 */

import type { TypeDroit } from './droit';

/**
 * Identifiant d'un preset V2 (utilisable côté UI pour « Appliquer le preset
 * Rédacteur·ice »).
 */
export type PresetV2 =
  | 'redacteurice'
  | 'moderateurice'
  | 'editeur_media'
  | 'gestionnaire_espace'
  | 'tresorier_iere';

/**
 * Identifiant d'un preset V1 (niveau historique de `droit_admin`).
 */
export type PresetV1 = 'national' | 'admin' | 'moderation' | 'tresorerie' | 'animation' | 'dpd';

/**
 * Presets V2 — cf. MD1 (« presets de départ, calqués sur les fonctions
 * d'admin d'une commune libre »).
 */
export const PRESETS_V2: Record<PresetV2, readonly TypeDroit[]> = {
  redacteurice: ['ecrire_article', 'modifier_article_propre', 'publier_mini_blog'],
  moderateurice: ['moderer_a_posteriori', 'traiter_signalement'],
  editeur_media: ['selectionner_pour_media', 'editorialiser'],
  gestionnaire_espace: ['administrer_espace', 'gerer_membres', 'gerer_image'],
  tresorier_iere: ['gerer_caisse', 'valider_reversement', 'consulter_journal'],
};

/**
 * Presets V1 — traduction des 6 niveaux historiques de `droit_admin` vers
 * la liste atomique V2. Utilisé par le script de backfill V2.1.3 pour ne
 * faire perdre aucun droit existant en attendant la migration applicative
 * vers la table `droit`.
 *
 * Les choix d'inclusion suivent la logique du V1 (cf. migration 008
 * `droit_admin.sql`) :
 *
 * - `national` = compte admin total plateforme (cf. MD5 V2) → on lui pose
 *   le marqueur `admin_total_plateforme` qui sert de drapeau. Les helpers
 *   RLS V1 continuent par ailleurs de lire `droit_admin.niveau = 'national'`.
 * - `admin` = administration générale, sans la finance par défaut (la
 *   trésorerie est un niveau séparé en V1) → tous les droits sauf
 *   `gerer_caisse`, `valider_reversement`, `consulter_journal` (que
 *   `tresorerie` couvre).
 * - `moderation` = preset modérateur V2 + `moderer_a_priori` quand le
 *   périmètre inclut « petitions » (file de pétitions, cf. §8 V2).
 * - `tresorerie` = preset trésorier V2.
 * - `animation` = preset gestionnaire d'espace V2 sur la commune scopée.
 * - `dpd` = lecture du journal admin + traitement des signalements (cf.
 *   RGPD §7 V1).
 */
export const PRESETS_V1: Record<PresetV1, readonly TypeDroit[]> = {
  national: ['admin_total_plateforme'],
  admin: [
    'ecrire_article',
    'modifier_article_propre',
    'modifier_article_autrui',
    'supprimer_article',
    'publier_mini_blog',
    'creer_objet',
    'modifier_objet',
    'supprimer_objet',
    'telecharger_fichier',
    'gerer_image',
    'moderer_a_posteriori',
    'moderer_editorial',
    'traiter_signalement',
    'gerer_membres',
    'gerer_mandataires',
    'administrer_espace',
    'gerer_droits',
  ],
  moderation: ['moderer_a_posteriori', 'traiter_signalement'],
  tresorerie: ['gerer_caisse', 'valider_reversement', 'consulter_journal'],
  animation: ['administrer_espace', 'gerer_membres', 'gerer_image'],
  dpd: ['consulter_journal', 'traiter_signalement'],
};

/**
 * Pour `moderation` : si le périmètre d'onglet contient `petitions`, on
 * ajoute `moderer_a_priori` (cohérent avec la doctrine §8 V2 sur la file
 * de pétitions).
 */
export const DROITS_ADDITIONNELS_MODERATION_PETITIONS: readonly TypeDroit[] = ['moderer_a_priori'];

/**
 * Retourne la liste de droits atomiques pour un preset V2 donné.
 */
export function droitsPourPresetV2(preset: PresetV2): readonly TypeDroit[] {
  return PRESETS_V2[preset];
}

/**
 * Retourne la liste de droits atomiques pour un niveau V1 donné, en
 * tenant compte du périmètre d'onglet pour la modération.
 */
export function droitsPourPresetV1(
  preset: PresetV1,
  options: { perimetreOnglet?: readonly string[] | null } = {},
): readonly TypeDroit[] {
  const baseDroits = PRESETS_V1[preset];
  if (preset === 'moderation') {
    const perimetreInclutPetitions =
      options.perimetreOnglet === undefined ||
      options.perimetreOnglet === null ||
      options.perimetreOnglet.includes('petitions');
    if (perimetreInclutPetitions) {
      return [...baseDroits, ...DROITS_ADDITIONNELS_MODERATION_PETITIONS];
    }
  }
  return baseDroits;
}
