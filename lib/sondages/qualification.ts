/**
 * Panel de qualification progressive du profil (sondages V2).
 *
 * Refonte 2026-06-14 (demande Ben, validée question par question) : panel
 * resserré et réécrit avec le **vocabulaire des instituts de sondage** (INSEE
 * PCS 2020 et grille de densité, enquête Logement, TeO2 INED, CEVIPOF, IFOP,
 * Ipsos, CRÉDOC, ministère de l'Intérieur pour les libellés électoraux ;
 * recherche multi-agents documentée dans
 * `docs/sondages-profil-25-propositions.md`).
 *
 * Décisions Ben de cette session :
 *   - « taille de l'agglomération » (en nb d'habitants) RETIRÉE → remplacée par
 *     « type de commune » (continuum rural→métropole, avec repère d'habitant·es).
 *   - Revenu : échelle ÉLARGIE VERS LE BAS (sous le RSA / au RSA) pour capter la
 *     précarité (RSA personne seule 651,69 € et AAH 1 041,59 €/mois au 1ᵉʳ avril
 *     2026).
 *   - Tranche d'âge : ajout des 15-17 ans (lycéen·nes).
 *   - Ajouts : patrimoine, aisance financière (CRÉDOC), confiance dans les
 *     institutions (CEVIPOF).
 *   - Retirées : statut dans l'emploi, origine sociale, législatives 2024, dons,
 *     intérêt pour la politique.
 *
 * Règles de tirage (CDC §6) : pondération de la fréquence (les questions les
 * plus utiles à la fiabilité sortent plus souvent), jamais deux fois la même
 * question pour une même personne.
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
  /** Poids de tirage (socio-démo de redressement + vote sortent plus souvent). */
  poidsTirage: number;
  /** Forme de la question (choix unique par défaut). */
  type: TypeQuestionQualification;
  /** Second champ du même écran (ex. domaine de bénévolat, syndicat). */
  secondaire?: {
    intitule: string;
    options: string[];
    /**
     * Valeur(s) de la réponse principale qui rendent le second champ requis
     * (une seule valeur, ou plusieurs — ex. « adhérent·e » OU « anciennement »).
     */
    requisSi: string | readonly string[];
  };
}

/** Options de CSP (libellés PCS 2020 INSEE, validés Ben 2026-06-14). */
const OPTIONS_CSP = [
  'Agriculteur·rice exploitant·e',
  'Artisan·e, commerçant·e ou chef·fe d’entreprise',
  'Cadre ou profession intellectuelle supérieure',
  'Profession intermédiaire (technicien·ne, agent·e de maîtrise, enseignant·e du primaire, infirmier·ère…)',
  'Employé·e',
  'Ouvrier·ère',
  'Retraité·e',
  'Étudiant·e ou élève',
  'Sans activité professionnelle (au foyer, recherche d’emploi de longue durée, autre)',
  'Ne souhaite pas répondre',
] as const;

/**
 * Options « genre » (Ben, 2026-06-12) : posées dans le formulaire de vote
 * ET disponibles dans le panel pour les personnes qui n'ont pas répondu.
 */
export const OPTIONS_GENRE = ['Homme', 'Femme', 'Non binaire', 'Autre'] as const;

/**
 * Options « logement » (statut d'occupation INSEE, version 6 postes des
 * instituts, validée Ben 2026-06-14). Les parts cibles (approx. enquête
 * Logement INSEE, personnes majeures) servent au redressement par quotas.
 */
export const OPTIONS_LOGEMENT: ReadonlyArray<{ libelle: string; partCible: number }> = [
  { libelle: 'Propriétaire (y compris accédant·e à la propriété)', partCible: 0.575 },
  { libelle: 'Locataire du parc privé', partCible: 0.228 },
  { libelle: 'Locataire d’un logement social (HLM)', partCible: 0.165 },
  {
    libelle: 'Hébergé·e gratuitement en logement privé (proche, famille, employeur)',
    partCible: 0.022,
  },
  {
    libelle:
      'Hébergé·e en logement collectif (foyer, résidence sociale, EHPAD, internat, caserne, CADA…)',
    partCible: 0.007,
  },
  { libelle: 'Sans domicile (rue, hébergement d’urgence, habitat de fortune)', partCible: 0.003 },
];

/** Listes du bulletin des européennes 2024 (exhaustif, zéro regroupement). */
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
 * Le panel (23 questions, validées une par une avec Ben le 2026-06-14).
 * L'ordre est documentaire ; le tirage est aléatoire pondéré parmi les
 * questions non répondues.
 */
export const QUESTIONS_QUALIFICATION: QuestionQualification[] = [
  // ----- Bloc 1 : socle sociologique --------------------------------
  {
    cle: 'genre',
    intitule: 'Quel est ton genre ?',
    options: [...OPTIONS_GENRE],
    poidsTirage: 2,
    type: 'choix_unique',
  },
  {
    cle: 'tranche_age_fine',
    intitule: 'Quelle est ta tranche d’âge ?',
    options: [
      '15-17 ans',
      '18-24 ans',
      '25-34 ans',
      '35-49 ans',
      '50-64 ans',
      '65-74 ans',
      '75 ans et plus',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'csp',
    intitule: 'Quelle est ta catégorie socioprofessionnelle ?',
    options: [...OPTIONS_CSP],
    poidsTirage: 3,
    type: 'choix_unique',
  },
  {
    cle: 'secteur_activite',
    intitule: 'Dans quel secteur travailles-tu (ou as-tu travaillé en dernier) ?',
    options: [
      'Secteur public (État, collectivités, hôpital public)',
      'Secteur privé (entreprise, association classique)',
      'Économie sociale et solidaire (coopérative, mutuelle, association, fondation)',
      'À mon compte / indépendant·e',
      'Je n’ai jamais travaillé',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'diplome',
    intitule: 'Quel est le plus haut diplôme que tu as obtenu ?',
    options: [
      'Aucun diplôme',
      'Certificat d’études primaires (CEP), brevet des collèges, BEPC',
      'CAP, BEP ou équivalent',
      'Baccalauréat (général, technologique ou professionnel), brevet professionnel',
      'Bac+2 (BTS, BUT/DUT, DEUG, écoles sanitaires et sociales…)',
      'Bac+3 ou Bac+4 (licence, licence pro, master 1, maîtrise…)',
      'Bac+5 et plus (master, diplôme d’ingénieur·e, école de commerce, doctorat, médecine…)',
      'En cours d’études (pas encore de diplôme correspondant)',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'revenu_foyer',
    intitule: 'Quel est le revenu mensuel net de ton foyer ?',
    options: [
      'Moins de 650 € (sous le RSA)',
      '650 à 999 €',
      '1 000 à 1 499 €',
      '1 500 à 1 999 €',
      '2 000 à 2 499 €',
      '2 500 à 2 999 €',
      '3 000 à 3 999 €',
      '4 000 à 5 999 €',
      '6 000 € et plus',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 2,
    type: 'choix_unique',
  },
  {
    cle: 'logement',
    intitule: 'Quel est ton statut d’occupation de ton logement ?',
    options: OPTIONS_LOGEMENT.map((o) => o.libelle).concat('Ne souhaite pas répondre'),
    poidsTirage: 3,
    type: 'choix_unique',
  },
  {
    cle: 'type_commune',
    intitule: 'Comment décrirais-tu la commune où tu habites ?',
    options: [
      'Une grande ville ou une métropole (100 000 habitant·es et plus)',
      'Une ville moyenne (20 000 à 100 000 habitant·es)',
      'Une petite ville (2 000 à 20 000 habitant·es)',
      'Une commune de banlieue ou de périphérie (couronne d’une grande ville)',
      'Un village ou un bourg rural (moins de 2 000 habitant·es)',
      'Une commune rurale isolée (habitat dispersé, hameaux)',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 3,
    type: 'choix_unique',
  },
  {
    cle: 'region_residence',
    intitule: 'Dans quelle région habites-tu ?',
    options: [
      'Auvergne-Rhône-Alpes',
      'Bourgogne-Franche-Comté',
      'Bretagne',
      'Centre-Val de Loire',
      'Corse',
      'Grand Est',
      'Hauts-de-France',
      'Île-de-France',
      'Normandie',
      'Nouvelle-Aquitaine',
      'Occitanie',
      'Pays de la Loire',
      'Provence-Alpes-Côte d’Azur',
      'Guadeloupe',
      'Martinique',
      'Guyane',
      'La Réunion',
      'Mayotte',
      'Hors de France (à l’étranger)',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'situation_maritale',
    intitule: 'Quelle est ta situation conjugale ?',
    options: [
      'Marié·e',
      'Pacsé·e',
      'En couple (union libre, concubinage)',
      'Célibataire',
      'Divorcé·e ou séparé·e',
      'Veuf·ve',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'composition_foyer',
    intitule: 'Comment décrirais-tu la composition de ton foyer ?',
    options: [
      'Je vis seul·e',
      'En couple sans enfant',
      'En couple avec enfant(s)',
      'Famille monoparentale (seul·e avec enfant(s))',
      'Je vis chez mes parents ou ma famille',
      'En colocation ou logement partagé',
      'Autre configuration',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'patrimoine',
    intitule: 'Quelle est ta situation d’épargne ?',
    options: [
      'Aucune épargne',
      'Épargne de précaution (moins de 3 mois de revenus)',
      'Épargne confortable',
      'Patrimoine immobilier (hors résidence principale)',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'aisance_financiere',
    intitule: 'Avec les revenus de ton foyer, dirais-tu que…',
    options: [
      'Tu vis confortablement',
      'Ça va, c’est correct',
      'C’est juste, il faut faire attention',
      'Tu y arrives difficilement',
      'Tu ne t’en sors pas sans t’endetter',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  // ----- Bloc 2 : politique (listes exhaustives, zéro regroupement) --
  {
    cle: 'presidentielle_2022',
    intitule: 'Au 1er tour de la présidentielle 2022, pour quel·le candidat·e as-tu voté ?',
    options: [
      'Nathalie Arthaud (Lutte ouvrière)',
      'Nicolas Dupont-Aignan (Debout la France)',
      'Anne Hidalgo (Parti socialiste)',
      'Yannick Jadot (Europe Écologie-Les Verts)',
      'Jean Lassalle (Résistons !)',
      'Marine Le Pen (Rassemblement national)',
      'Emmanuel Macron (La République en marche)',
      'Jean-Luc Mélenchon (La France insoumise)',
      'Valérie Pécresse (Les Républicains)',
      'Philippe Poutou (Nouveau Parti anticapitaliste)',
      'Fabien Roussel (Parti communiste français)',
      'Éric Zemmour (Reconquête !)',
      'Vote blanc ou nul',
      'Je me suis abstenu·e',
      'Je n’étais pas en âge de voter / pas inscrit·e',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 3,
    type: 'choix_unique',
  },
  {
    cle: 'presidentielle_2022_t2',
    intitule: 'Et au 2nd tour de la présidentielle 2022, pour qui as-tu voté ?',
    options: [
      'Emmanuel Macron',
      'Marine Le Pen',
      'Vote blanc ou nul',
      'Je me suis abstenu·e',
      'Je n’étais pas en âge de voter / pas inscrit·e',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 2,
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
    intitule: 'Sur un axe de gauche (0) à droite (10), où te situes-tu ?',
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
    cle: 'source_info_politique',
    intitule: 'Par quel moyen t’informes-tu le plus souvent sur l’actualité politique ?',
    options: [
      'La télévision',
      'La radio',
      'La presse écrite (journaux, magazines)',
      'Les sites et applications d’information en ligne',
      'Les réseaux sociaux (Instagram, TikTok, X, YouTube…)',
      'Les podcasts ou les vidéos en ligne',
      'Les discussions avec ton entourage',
      'Je ne m’informe pas vraiment sur la politique',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_unique',
  },
  {
    cle: 'confiance_institutions',
    intitule:
      'À quelles institutions ou acteurs fais-tu plutôt confiance ? (plusieurs choix possibles)',
    options: [
      'La science',
      'L’hôpital public',
      'Les associations',
      'Les syndicats',
      'La justice',
      'Les médias',
      'La police',
      'L’armée',
      'Ta mairie / les collectivités locales',
      'Le gouvernement',
      'L’Assemblée nationale',
      'Les partis politiques',
      'Les banques',
      'Les grandes entreprises',
      'Les réseaux sociaux',
      'L’Union européenne',
      'Aucune de ces institutions',
    ],
    poidsTirage: 1,
    type: 'choix_multiple',
  },
  // ----- Bloc 3 : engagement -----------------------------------------
  {
    cle: 'formes_engagement',
    intitule:
      'Au cours des deux dernières années, quelles formes d’engagement t’est-il arrivé de pratiquer ? (plusieurs choix possibles)',
    options: [
      'Signer une pétition (papier ou en ligne)',
      'Participer à une manifestation',
      'Faire grève',
      'Boycotter des produits ou des marques',
      'Faire du bénévolat',
      'Faire un don à une association ou une cause',
      'Militer dans un parti politique',
      'Militer dans un syndicat',
      'Participer à une réunion publique, un conseil de quartier ou un débat citoyen',
      'Participer à une consultation citoyenne, une votation ou un référendum local',
      'Interpeller un·e élu·e',
      'T’exprimer sur un sujet de société sur les réseaux sociaux',
      'Participer à une action de désobéissance civile (blocage, occupation, ZAD…)',
      'Aucune de ces formes d’engagement',
    ],
    poidsTirage: 1,
    type: 'choix_multiple',
  },
  {
    cle: 'benevolat',
    intitule: 'Donnes-tu de ton temps gratuitement pour une association ou une cause ?',
    options: [
      'Oui, régulièrement (chaque semaine ou presque)',
      'Oui, de temps en temps dans l’année',
      'Oui, ponctuellement (un événement, une mission courte)',
      'Non, mais je l’ai déjà fait par le passé',
      'Non, jamais',
    ],
    poidsTirage: 1,
    type: 'double',
    secondaire: {
      intitule: 'Dans quel domaine principal ?',
      options: [
        'Sport',
        'Culture, arts, patrimoine',
        'Loisirs, vie locale',
        'Action sociale, caritative ou humanitaire',
        'Santé',
        'Éducation, jeunesse',
        'Environnement, protection de la nature et des animaux',
        'Défense des droits et de causes citoyennes',
        'Religion',
        'Autre',
      ],
      requisSi: [
        'Oui, régulièrement (chaque semaine ou presque)',
        'Oui, de temps en temps dans l’année',
        'Oui, ponctuellement (un événement, une mission courte)',
      ],
    },
  },
  {
    cle: 'pratique_syndicale',
    intitule: 'En ce qui concerne les syndicats, dans quelle situation te trouves-tu ?',
    options: [
      'Adhérent·e actuellement',
      'Anciennement (plus aujourd’hui)',
      'Jamais',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'double',
    secondaire: {
      intitule: 'De quel syndicat s’agit-il (ou s’agissait-il) ?',
      options: [
        'CGT',
        'CFDT',
        'FO',
        'CFE-CGC',
        'CFTC',
        'UNSA',
        'Solidaires (SUD)',
        'FSU',
        'Syndicat étudiant ou lycéen',
        'Autre',
        'Ne souhaite pas répondre',
      ],
      requisSi: ['Adhérent·e actuellement', 'Anciennement (plus aujourd’hui)'],
    },
  },
  {
    cle: 'adhesion_organisation',
    intitule:
      'Es-tu adhérent·e ou membre d’une ou plusieurs de ces organisations ? (plusieurs choix possibles)',
    options: [
      'Une association (sport, culture, loisirs…)',
      'Une association caritative, humanitaire ou de solidarité',
      'Une association de défense des droits ou de l’environnement',
      'Un syndicat',
      'Un parti ou un mouvement politique',
      'Aucune de ces organisations',
      'Ne souhaite pas répondre',
    ],
    poidsTirage: 1,
    type: 'choix_multiple',
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
