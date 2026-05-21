import type { SousTypeMomentPaP, TypeMomentSolidaire } from '@/types/database';

/**
 * Configuration centralisée des Moments solidaires (chantier 5.3).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §7C`.
 *
 * 8 types principaux + 7 sous-types pour le porte-à-porte solidaire.
 * La config sert à générer automatiquement les 7 RDV enfants d'un
 * porte-à-porte (cf. spec §7C « Porte-à-porte solidaire en 7 moments »).
 */

export interface ConfigType {
  type: TypeMomentSolidaire;
  libelle: string;
  description: string;
  /** Indique si le type génère 7 RDV enfants à la création. */
  genere7RDV: boolean;
}

export const TYPES_MOMENTS: Record<TypeMomentSolidaire, ConfigType> = {
  porte_a_porte: {
    type: 'porte_a_porte',
    libelle: 'Porte-à-porte solidaire',
    description:
      "Cycle en 7 moments : 1er passage caddie, 2e passage, tri, distribution, maraude d'invitation, repas solidaire, volontaires. Cf. doctrine §7C.",
    genere7RDV: true,
  },
  maraude: {
    type: 'maraude',
    libelle: 'Maraude solidaire',
    description: 'Café/thé aux personnes de la rue. Géolocalisé, agendé.',
    genere7RDV: false,
  },
  vide_grenier_solidaire: {
    type: 'vide_grenier_solidaire',
    libelle: 'Vide-grenier solidaire',
    description: 'Vente + surplus pour cause locale.',
    genere7RDV: false,
  },
  soutien: {
    type: 'soutien',
    libelle: 'Soutien',
    description: 'Présence collective : gréviste, expulsion, procès, démarche.',
    genere7RDV: false,
  },
  manifestation: {
    type: 'manifestation',
    libelle: 'Manifestation',
    description:
      'Groupe constitué dans la rue. À distinguer des Mobilisations (qui peuvent être individuelles).',
    genere7RDV: false,
  },
  rencontre: {
    type: 'rencontre',
    libelle: 'Rencontre',
    description: 'Café citoyen, apéro de quartier, soirée débat.',
    genere7RDV: false,
  },
  concert_solidaire: {
    type: 'concert_solidaire',
    libelle: 'Concert solidaire',
    description: 'Culturel + recettes pour cause locale.',
    genere7RDV: false,
  },
  repas_solidaire: {
    type: 'repas_solidaire',
    libelle: 'Repas solidaire',
    description:
      'Auberge espagnole + surplus végétarien par défaut + sollicitation commerçants. Le soir, pas le midi.',
    genere7RDV: false,
  },
};

export const LISTE_TYPES_MOMENTS: ConfigType[] = Object.values(TYPES_MOMENTS);

// ============================================================
// Les 7 RDV du porte-à-porte (cf. spec §7C)
// ============================================================

export interface RDVPortAPorte {
  sous_type: SousTypeMomentPaP;
  libelle: string;
  description: string;
  /** Décalage en jours par rapport au 1er passage (J = 0). */
  decalageJours: number;
}

/**
 * Les 7 moments du porte-à-porte solidaire, dans l'ordre. La fonction
 * `genererRdvsPortAPorte` (Server Action) crée 7 lignes
 * `moment_solidaire` enfants à partir du parent.
 */
export const SEPT_RDV: RDVPortAPorte[] = [
  {
    sous_type: 'pap_1er_passage',
    libelle: '1er passage caddie',
    description:
      "Groupe de 2 à 5 personnes. On demande de l'aide (pas qu'on propose). Liste prédéterminée : couches, petits pots, lait maternel, vêtements enfants, pâtes, hygiène, vêtements chauds. Notation des besoins constatés.",
    decalageJours: 0,
  },
  {
    sous_type: 'pap_2e_passage',
    libelle: '2e passage / collecte renforcée',
    description: 'Retour dans le quartier 1 semaine après pour la collecte.',
    decalageJours: 7,
  },
  {
    sous_type: 'pap_tri',
    libelle: 'Tri convivial',
    description: 'Apéro ou vin chaud sur place, tri des dons collectés, recrutement de bénévoles.',
    decalageJours: 9,
  },
  {
    sous_type: 'pap_distribution',
    libelle: 'Distribution',
    description:
      'Distribution des biens collectés + appels pour les absent·es + services (cours de maths, jardinage, bénévoles désintéressé·es).',
    decalageJours: 13,
  },
  {
    sous_type: 'pap_maraude_invit',
    libelle: "Maraude d'invitation",
    description: 'Café/thé aux personnes de la rue. Invitation au repas solidaire du soir.',
    decalageJours: 14,
  },
  {
    sous_type: 'pap_repas',
    libelle: 'Repas solidaire',
    description:
      'Le soir, pas le midi. Auberge espagnole + surplus végétarien par défaut + sollicitation commerçants + prise de parole asso locale + collecte pour leur cause.',
    decalageJours: 14,
  },
  {
    sous_type: 'pap_volontaires',
    libelle: 'Feuille volontaires',
    description:
      'Pendant le repas. Technique de la levée de mains (engagement public oral, pression sociale positive pour dignité et fierté).',
    decalageJours: 14,
  },
];

// ============================================================
// Gabarit du flyer SANS écriture inclusive (accessibilité tactique
// — cf. spec §7C « Flyer "Entrez dans nous..." SANS écriture
// inclusive (accessibilité tactique) »).
// ============================================================

/**
 * Génère le texte d'un flyer de porte-à-porte SANS écriture inclusive
 * (volontairement). Cette concession au lectorat le moins habitué à
 * l'écriture inclusive est un choix politique consigné dans la spec
 * §7C. Le reste du site reste inclusif (cf. §10 du vocabulaire).
 *
 * Pas de surcouche émotionnelle. Reprend la microcopy proposée par la
 * spec et l'adapte au contexte (lieu + date + contact).
 */
export interface FlyerInfos {
  lieu: string;
  dateHumaine: string;
  contact: string;
}

export function gabaritFlyerPortAPorte(infos: FlyerInfos): string {
  return [
    'Entrez dans nous, le mouvement Maintenant!',
    '',
    `Nous passons dans le quartier de ${infos.lieu} le ${infos.dateHumaine}.`,
    '',
    'Si vous avez besoin de quelque chose ou si vous voulez aider,',
    "écrivez-nous, on s'organise ensemble.",
    '',
    `Contact : ${infos.contact}`,
  ].join('\n');
}
