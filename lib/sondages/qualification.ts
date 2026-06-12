/**
 * Panel de qualification progressive du profil (sondages V2).
 *
 * Source du contenu : CDC `docs/cdc-v2/CDC-Maintenant-V2/02-Sinformer/
 * sondages-V2.md` §7 (panel de 22 questions, base validée le 26/05),
 * ajusté par Ben le 2026-06-12 :
 *   - Q8 Genre : « Homme · Femme · Non binaire · Autre » (« autre » au
 *     singulier), posée directement dans le formulaire de vote ;
 *   - Q7 Logement : 5 catégories alignées sur l'enquête Logement INSEE 2021
 *     (France portrait social 2023, personnes majeures) avec leurs parts
 *     cibles pour la méthode des quotas : propriétaires 57,1 %, locataires
 *     34,9 %, hébergé·es à titre gratuit ~5 %, logements collectifs ~2,7 %,
 *     sans domicile ~0,3 %.
 *
 * Règles de tirage (CDC §6) : pondération de la fréquence (les questions
 * les plus utiles à la fiabilité sortent plus souvent), jamais deux fois
 * la même question pour une même personne.
 */

import { calculerAge } from '@/lib/age';

export type TypeQuestionQualification = 'choix_unique' | 'choix_multiple' | 'double';

export interface QuestionQualification {
  /** Clé stable stockée en base (`profil_qualification.question_cle`). */
  cle: string;
  /** Intitulé affiché. */
  intitule: string;
  /** Options proposées (libellés stockés tels quels). */
  options: string[];
  /**
   * Poids de tirage (CDC §6 : CSP, type de commune, taille d'agglo,
   * vote 2022, et logement sortent plus souvent).
   */
  poidsTirage: number;
  /** Forme de la question (choix unique par défaut). */
  type: TypeQuestionQualification;
  /** Second champ du même écran (Q22 : secteur de bénévolat). */
  secondaire?: {
    intitule: string;
    options: string[];
    /** Valeur de la réponse principale qui rend le second champ requis. */
    requisSi: string;
  };
}

/** Options de CSP (réutilisées par Q1 et Q11 « origine sociale »). */
const OPTIONS_CSP = [
  'Agriculteur·ice',
  'Artisan·e, commerçant·e, chef·fe d’entreprise',
  'Cadre, profession intellectuelle supérieure',
  'Profession intermédiaire',
  'Employé·e',
  'Ouvrier·ère',
  'Retraité·e',
  'Étudiant·e',
  'Sans activité',
  'Ne souhaite pas répondre',
] as const;

/**
 * Options « genre » (Ben, 2026-06-12) : posées dans le formulaire de vote
 * ET disponibles dans le panel pour les personnes qui n'ont pas répondu.
 */
export const OPTIONS_GENRE = ['Homme', 'Femme', 'Non binaire', 'Autre'] as const;

/**
 * Options « logement » avec parts cibles INSEE (enquête Logement 2021,
 * personnes majeures ; France portrait social 2023). Les parts servent au
 * redressement par quotas (barèmes modifiables par l'admin à terme,
 * CDC §2 « Référence de population »).
 */
export const OPTIONS_LOGEMENT: ReadonlyArray<{ libelle: string; partCible: number }> = [
  { libelle: 'Propriétaire', partCible: 0.571 },
  { libelle: 'Locataire ou sous-locataire', partCible: 0.349 },
  { libelle: 'Hébergé·e à titre gratuit (par un proche ou un employeur)', partCible: 0.05 },
  { libelle: 'Logement collectif (EHPAD, foyer, internat, caserne…)', partCible: 0.027 },
  { libelle: 'Sans domicile', partCible: 0.003 },
];

const LISTES_EUROPEENNES_2024 = [
  'La France revient ! (RN, Bardella)',
  'Besoin d’Europe (Renaissance, Hayer)',
  'Réveiller l’Europe (PS-Place publique, Glucksmann)',
  'La France insoumise – Union populaire (LFI, Aubry)',
  'La droite pour faire entendre la voix de la France en Europe (LR, Bellamy)',
  'Europe Écologie (EELV, Toussaint)',
  'La France fière (Reconquête, Maréchal)',
  'Gauche unie pour le monde du travail (PCF, Deffontaines)',
  'Alliance rurale (Lassalle)',
  'Parti animaliste – Les animaux comptent, votre voix aussi (Thouy)',
  'Écologie au centre (Governatori)',
  'Liste Asselineau-Frexit (UPR)',
  'L’Europe ça suffit ! (Les Patriotes, Philippot)',
  'Lutte ouvrière – Le camp des travailleurs (Arthaud)',
  'Écologie positive et territoires (Wehrling)',
  'Équinoxe : écologie pratique et renouveau démocratique (Cholley)',
  'Europe Territoires Écologie',
  'Pour un monde sans frontières ni patrons, urgence révolution ! (NPA-R, Labib)',
  'Parti pirate (Zorn)',
  'Free Palestine (UDMF, Azergui)',
  'Nous le peuple',
  'Changer l’Europe',
  'Esperanto langue commune',
  'PACE – Parti des citoyens européens',
  'France libre (Lalanne)',
  'Défendre les enfants (Coste-Meunier)',
  'Forteresse Europe – Liste d’unité nationaliste (Bonneau)',
  '« Pour le pain, la paix, la liberté ! » (POID, Adoue)',
  'La ruche citoyenne',
  'Paix et décroissance',
  'Pour une autre Europe (Nouvelle Donne, Larrouturou)',
  'Non à l’UE et à l’OTAN, communistes pour la paix et le progrès social (PRCF, Terrien)',
  'Non ! Prenons-nous en mains',
  'Parti révolutionnaire Communistes',
  'Pour une démocratie réelle : décidons nous-mêmes ! (Ponge)',
  'Pour une humanité souveraine (Deher-Lesaint)',
  'Liberté démocratique française (Grudé)',
  'Démocratie représentative',
  'Vote blanc ou nul',
  'N’a pas voté',
  'Pas en âge de voter',
  'Ne souhaite pas répondre',
] as const;

/**
 * Le panel complet (CDC §7). L'ordre est documentaire ; le tirage est
 * aléatoire pondéré parmi les questions non répondues.
 */
export const QUESTIONS_QUALIFICATION: QuestionQualification[] = [
  // ----- Bloc 1 : socle sociologique --------------------------------
  {
    cle: 'csp',
    intitule: 'Quelle est ta catégorie socioprofessionnelle ?',
    options: [...OPTIONS_CSP],
    poidsTirage: 3,
    type: 'choix_unique',
  },
  {
    cle: 'diplome',
    intitule: 'Quel est ton plus haut diplôme ?',
    options: [
      'Aucun ou brevet',
      'CAP-BEP',
      'Bac',
      'Bac+2/3',
      'Bac+5 et plus',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'revenu_foyer',
    intitule: 'Quel est le revenu mensuel net de ton foyer ?',
    options: [
      'Moins de 1 500 €',
      '1 500 à 2 500 €',
      '2 500 à 4 000 €',
      '4 000 à 6 000 €',
      'Plus de 6 000 €',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'situation_maritale',
    intitule: 'Quelle est ta situation maritale ?',
    options: ['Célibataire', 'En couple, marié·e ou pacsé·e', 'Séparé·e ou divorcé·e', 'Veuf·ve'],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'composition_foyer',
    intitule: 'Quelle est la composition de ton foyer ?',
    options: ['Seul·e', 'Couple sans enfant', 'Avec enfant(s)', 'Famille monoparentale', 'Autre'],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'type_commune',
    intitule: 'Où habites-tu ?',
    options: [
      'Rural',
      'Petite ville',
      'Ville moyenne',
      'Grande ville',
      'Métropole ou cœur d’agglomération',
    ],
    poidsTirage: 3,
    type: 'choix_unique',
  },
  {
    cle: 'logement',
    intitule: 'Quelle est ta situation de logement ?',
    options: OPTIONS_LOGEMENT.map((o) => o.libelle),
    poidsTirage: 3,
    type: 'choix_unique',
  },
  {
    cle: 'genre',
    intitule: 'Quel est ton genre ?',
    options: [...OPTIONS_GENRE],
    poidsTirage: 2,
    type: 'choix_unique',
  },
  {
    cle: 'secteur_activite',
    intitule: 'Dans quel secteur travailles-tu ?',
    options: [
      'Public, fonction publique',
      'Privé',
      'Indépendant ou libéral',
      'Associatif, économie sociale et solidaire',
      'Sans emploi',
      'Retraité·e',
      'Étudiant·e',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'patrimoine',
    intitule: 'Quelle est ta situation d’épargne ?',
    options: [
      'Aucune épargne',
      'Épargne de précaution (moins de 3 mois)',
      'Épargne confortable',
      'Patrimoine immobilier (hors résidence principale)',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'origine_sociale',
    intitule:
      'Pendant ton enfance, quelle était la catégorie socioprofessionnelle de ton père ou de ta mère ?',
    options: [...OPTIONS_CSP],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'taille_agglomeration',
    intitule: 'Quelle est la taille de ton agglomération ?',
    options: [
      'Moins de 2 000 habitant·es',
      '2 000 à 20 000',
      '20 000 à 100 000',
      '100 000 à 200 000',
      'Plus de 200 000',
      'Agglomération parisienne',
    ],
    poidsTirage: 3,
    type: 'choix_unique',
  },
  {
    cle: 'statut_emploi',
    intitule: 'Quel est ton statut dans l’emploi ?',
    options: [
      'CDI',
      'CDD ou intérim',
      'Fonctionnaire',
      'Indépendant·e',
      'Chômage',
      'Inactif·ve',
      'Études',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'tranche_age_fine',
    intitule: 'Quelle est ta tranche d’âge ?',
    options: ['18-24 ans', '25-34 ans', '35-49 ans', '50-64 ans', '65-74 ans', '75 ans et plus'],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  // ----- Bloc 2 : politique (listes exhaustives, zéro regroupement) --
  {
    cle: 'presidentielle_2022',
    intitule: 'Au premier tour de la présidentielle 2022, pour qui as-tu voté ?',
    options: [
      'Nathalie Arthaud',
      'Nicolas Dupont-Aignan',
      'Anne Hidalgo',
      'Yannick Jadot',
      'Jean Lassalle',
      'Marine Le Pen',
      'Emmanuel Macron',
      'Jean-Luc Mélenchon',
      'Valérie Pécresse',
      'Philippe Poutou',
      'Fabien Roussel',
      'Éric Zemmour',
      'Vote blanc ou nul',
      'N’a pas voté',
      'Pas en âge de voter',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 3,
    type: 'choix_unique',
  },
  {
    cle: 'europeennes_2024',
    intitule: 'Aux élections européennes 2024, pour quelle liste as-tu voté ?',
    options: [...LISTES_EUROPEENNES_2024],
    poidsTirage: 2,
    type: 'choix_unique',
  },
  {
    cle: 'gauche_droite',
    intitule: 'Sur un axe gauche-droite de 0 à 10, où te situes-tu ?',
    options: [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'Cet axe ne veut rien dire pour moi',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'interet_politique',
    intitule: 'À quel point t’intéresses-tu à la politique ?',
    options: ['Très', 'Assez', 'Peu', 'Pas du tout'],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  // ----- Bloc 3 : engagement -----------------------------------------
  {
    cle: 'formes_engagement',
    intitule: 'Quelles formes d’engagement pratiques-tu ? (plusieurs choix possibles)',
    options: [
      'Manifestation',
      'Pétition',
      'Grève',
      'Action directe',
      'Bénévolat',
      'Adhésion à un parti ou un syndicat',
      'Mandat local',
      'Aucune',
    ],
    poidsTirage: 1,
    type: 'choix_multiple',
  },
  {
    cle: 'pratique_syndicale',
    intitule: 'Es-tu syndiqué·e ?',
    options: ['Syndiqué·e actuellement', 'Anciennement', 'Jamais', 'Pas concerné·e'],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'pratique_don',
    intitule: 'Fais-tu des dons à des associations ou des causes ?',
    options: [
      'Donateur·ice régulier·ière (mensuel ou récurrent)',
      'Ponctuel·le',
      'A déjà donné 1 ou 2 fois',
      'Jamais',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'benevolat',
    intitule: 'Es-tu bénévole ?',
    options: ['Oui', 'Non'],
    poidsTirage: 1,
    type: 'double',
    secondaire: {
      intitule: 'Quel secteur ?',
      options: [
        'Social, solidarité',
        'Humanitaire',
        'Environnement',
        'Culture',
        'Sport',
        'Éducation, jeunesse',
        'Santé',
        'Droits humains',
        'Animaux',
        'Autre',
      ],
      requisSi: 'Oui',
    },
  },
];

/** Accès direct à une question par sa clé. */
export const QUESTIONS_PAR_CLE: ReadonlyMap<string, QuestionQualification> = new Map(
  QUESTIONS_QUALIFICATION.map((q) => [q.cle, q]),
);

/**
 * Tranche d'âge des sondages (enum de `reponse_sondage.tranche_age`)
 * déduite de la date de naissance du profil : « deux variables déjà
 * gratuites : âge (via date de naissance), zone (via code postal) »
 * (CDC §6.3). Retourne null si la date est absente ou invalide.
 */
export function trancheAgeDepuisDateNaissance(
  dateNaissance: string | null,
  reference: Date = new Date(),
): 'moins_18' | '18_24' | '25_34' | '35_49' | '50_64' | '65_plus' | null {
  if (dateNaissance === null || dateNaissance === '') return null;
  const age = calculerAge(dateNaissance, reference);
  if (age === null) return null;
  if (age < 18) return 'moins_18';
  if (age <= 24) return '18_24';
  if (age <= 34) return '25_34';
  if (age <= 49) return '35_49';
  if (age <= 64) return '50_64';
  return '65_plus';
}

/**
 * Tire la prochaine question à proposer : aléatoire PONDÉRÉ parmi les
 * questions non encore répondues (CDC §6 : jamais deux fois la même,
 * les plus utiles à la fiabilité sortent plus souvent).
 *
 * Fonction pure : l'aléa est injecté (testabilité), `clesExclues` couvre
 * les questions déjà répondues ET celles dont la donnée existe ailleurs
 * (ex. tranche d'âge déduite de la date de naissance du profil).
 */
export function tirerProchaineQuestion(
  clesExclues: ReadonlySet<string>,
  aleatoire: () => number = Math.random,
): QuestionQualification | null {
  const candidates = QUESTIONS_QUALIFICATION.filter((q) => !clesExclues.has(q.cle));
  if (candidates.length === 0) return null;

  const poidsTotal = candidates.reduce((somme, q) => somme + q.poidsTirage, 0);
  let curseur = aleatoire() * poidsTotal;
  for (const question of candidates) {
    curseur -= question.poidsTirage;
    if (curseur < 0) return question;
  }
  // Garde-fou d'arrondi flottant : la dernière candidate.
  return candidates[candidates.length - 1] ?? null;
}
