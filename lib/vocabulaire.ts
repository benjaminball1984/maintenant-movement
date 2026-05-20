/**
 * Lexique fixé du mouvement Maintenant!
 *
 * Source de vérité : `docs/specs/03_VOCABULAIRE.md`.
 *
 * Ces termes sont **non négociables**. Toute UI qui affiche un libellé
 * issu de ce vocabulaire doit l'importer d'ici, jamais le réécrire en dur.
 * Cela garantit qu'un renommage éventuel se fait en un seul endroit.
 *
 * Cette liste sera enrichie au fil des chantiers (réseau social, Décider,
 * Moments solidaires, etc.). On n'y ajoute QUE des termes déjà validés
 * dans le pack de specs.
 */
export const VOCABULAIRE = {
  /** Nom officiel du mouvement, avec capitale et point d'exclamation. */
  nomMouvement: 'Maintenant!',

  /** Rôle de présidence du mouvement. Jamais « président·e ». */
  cosecGe: 'Cosec gé',

  /** Personne adhérente. Jamais « membre » seul (ambigu). */
  adherent: 'adhérent·e',
  sympathisant: 'sympathisant·e',
  signataire: 'signataire',
  donateur: 'donateur·ice',

  /** Monnaie : « 99-coin » avec tiret obligatoire. T99CP = The 99 Coin Project. */
  monnaie: '99-coin',
  monnaieAbbrev: 'T99CP',

  /** Espace de décision. Verbe à l'infinitif. */
  decider: 'Décider',

  /** Méthode de décision. Jamais « consentement ». */
  leveeObjections: 'levée d’objections',
  jugementMajoritaire: 'jugement majoritaire',
  consensus: 'consensus',

  /** Distinction politique structurante. */
  empouvoirement: 'Empouvoirement',
  captationDePouvoir: 'Captation de pouvoir',

  /** Toujours au pluriel. */
  momentsSolidaires: 'Moments solidaires',

  /** Niveau d'organisation territoriale. */
  communeLibre: 'Commune libre',
  assembleeConfederale: 'Assemblée Confédérale des Communes et Territoires Libres',

  /** Marque média. Pluriel à la fin. */
  maintenantMedias: 'Maintenant Médias',

  /** Forme spécifique de cagnotte. */
  cotisationSolidaire: 'Cotisation solidaire',
} as const;

export type CleVocabulaire = keyof typeof VOCABULAIRE;
