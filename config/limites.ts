/**
 * Limites techniques transverses du site.
 *
 * Source : `docs/specs/01_ARCHITECTURE.md §12`.
 *
 * Toute valeur consommée en plusieurs endroits doit venir d'ici plutôt
 * que d'être dupliquée dans le code applicatif.
 */
export const LIMITES = {
  upload: {
    /** Image : 10 Mo. */
    imageOctets: 10 * 1024 * 1024,
    /** Document : 25 Mo. */
    documentOctets: 25 * 1024 * 1024,
    /** Vidéo : 200 Mo. */
    videoOctets: 200 * 1024 * 1024,
    /** Audio : 100 Mo. */
    audioOctets: 100 * 1024 * 1024,
    /** Total par compte : 5 Go. */
    totalCompteOctets: 5 * 1024 * 1024 * 1024,
  },

  pagination: {
    /** Pagination par défaut sur les listes. */
    parDefaut: 20,
    /** Maximum admis. */
    maximum: 100,
  },

  rateLimit: {
    /** Formulaires publics : 5 soumissions par minute par IP. */
    formulairePublicParMinute: 5,
  },

  commune: {
    /** Maximum de communes par personne (cf. 01_ARCHITECTURE.md §7B). */
    maximumParPersonne: 3,
    /** Maximum de communes où poster simultanément. */
    maximumPostage: 3,
  },

  decider: {
    /** Maximum de propositions au jugement majoritaire. */
    maxPropositionsJugement: 10,
    /** Fenêtre de vote en minutes. */
    fenetreVoteMinutes: 10,
  },
} as const;
