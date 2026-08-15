/**
 * Périmètre éditorial de la curation de collectes externes (fond fourni par
 * Ben 2026-06-15). DEUX axes :
 *   - THÈMES : les causes du mouvement (sert au tag + au pré-filtre) ;
 *   - TYPES : les formats de collecte recherchés (livre, jeu, caisse de grève…).
 *
 * Plus une liste d'EXCLUSIONS (marqueurs d'extrême droite) : la curation par
 * mots-clés ne suffit pas à elle seule (ex. la catégorie « Jeux » d'Ulule
 * héberge « Antifa le jeu » MAIS aussi des jeux d'extrême droite), donc on
 * écarte d'office ces marqueurs ET un·e admin valide tout a priori.
 *
 * Tout est éditable ici (le fond politique appartient à Ben) : ajouter un
 * thème, un mot-clé ou une exclusion = une ligne.
 */

export interface ThemeCuration {
  /** Libellé du thème (stocké dans `themes`, affiché en puce). */
  theme: string;
  /** Mots-clés qui rattachent une collecte à ce thème (sans accents, minuscules). */
  motsCles: string[];
}

/** Normalise pour comparaison : minuscules, sans accents, espaces compactés. */
export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const THEMES_CURATION: ThemeCuration[] = [
  {
    theme: 'Écologie',
    motsCles: [
      'ecologie',
      'ecologique',
      'climat',
      'climatique',
      'environnement',
      'environnemental',
      'biodiversite',
      'pollution',
    ],
  },
  {
    theme: 'Écologie populaire',
    motsCles: ['ecologie populaire', 'quartiers populaires ecologie'],
  },
  {
    theme: 'Décroissance',
    motsCles: ['decroissance', 'sobriete', 'anti-productiviste', 'antiproductiviste'],
  },
  { theme: 'Écoféminisme', motsCles: ['ecofeminisme', 'ecofeministe'] },
  {
    theme: 'Féminisme',
    motsCles: ['feminisme', 'feministe', 'patriarcat', 'droits des femmes', 'sexisme'],
  },
  {
    theme: 'LGBTQIA+',
    motsCles: [
      'lgbt',
      'lgbtqia',
      'queer',
      'trans',
      'homophobie',
      'transphobie',
      'gay',
      'lesbienne',
    ],
  },
  {
    theme: 'Antiracisme',
    motsCles: ['antiracisme', 'antiraciste', 'racisme', 'discrimination raciale'],
  },
  { theme: 'Décolonial', motsCles: ['decolonial', 'decoloniale', 'colonialisme', 'postcolonial'] },
  {
    theme: 'Peuples autochtones',
    motsCles: ['autochtone', 'autochtones', 'peuples premiers', 'indigene'],
  },
  { theme: 'Autodétermination des peuples', motsCles: ['autodetermination', 'droit des peuples'] },
  {
    theme: 'Lanceur·euses d’alerte',
    motsCles: ['lanceur d alerte', 'lanceuse d alerte', 'lanceurs d alerte', 'whistleblower'],
  },
  { theme: 'Enfantisme', motsCles: ['enfantisme', 'droits des enfants', 'enfance'] },
  {
    theme: 'Protection animale',
    motsCles: ['protection animale', 'cause animale', 'antispecisme', 'antispeciste', 'animaux'],
  },
  {
    theme: 'Droits des paysan·nes',
    motsCles: [
      'paysan',
      'paysanne',
      'paysans',
      'paysannes',
      'agriculture paysanne',
      'souverainete alimentaire',
      'agroecologie',
      'agroecologique',
      'permaculture',
      'maraichage',
      'semences paysannes',
      'circuit court',
      'agriculture biologique',
    ],
  },
  {
    theme: 'Droit du travail',
    motsCles: [
      'droit du travail',
      'syndicat',
      'syndicale',
      'salaries',
      'travailleurs',
      'travailleuses',
    ],
  },
  {
    theme: 'Justice sociale',
    motsCles: ['justice sociale', 'inegalites', 'precarite', 'pauvrete'],
  },
  {
    theme: 'Droit au logement',
    motsCles: ['droit au logement', 'mal-logement', 'mal loges', 'sans-abri', 'expulsion'],
  },
  {
    theme: 'Droit à la santé',
    motsCles: ['droit a la sante', 'acces aux soins', 'sante publique'],
  },
  {
    theme: 'Personnes exilées',
    motsCles: [
      'exiles',
      'exilees',
      'migrants',
      'migrantes',
      'refugies',
      'sans-papiers',
      'solidarite migrants',
    ],
  },
  {
    theme: 'Anti-répression',
    motsCles: [
      'anti-repression',
      'antirepression',
      'repression',
      'violences policieres',
      'prisonniers politiques',
      'soutien juridique',
    ],
  },
  {
    theme: 'Lutte contre l’extrême droite',
    motsCles: ['antifasciste', 'antifascisme', 'antifa', 'contre l extreme droite', 'no pasaran'],
  },
  { theme: 'Anarchisme', motsCles: ['anarchisme', 'anarchiste', 'libertaire'] },
  { theme: 'Communalisme', motsCles: ['communalisme', 'municipalisme', 'commune libre'] },
  { theme: 'Marxisme', motsCles: ['marxisme', 'marxiste', 'communiste'] },
  { theme: 'Trotskisme', motsCles: ['trotskisme', 'trotskiste'] },
  { theme: 'Altermondialisme', motsCles: ['altermondialisme', 'altermondialiste'] },
  { theme: 'Antiguerre', motsCles: ['antiguerre', 'anti-guerre', 'pacifisme', 'paix'] },
  { theme: 'Géopolitique', motsCles: ['geopolitique', 'international solidaire'] },
  {
    theme: 'Démocratie',
    motsCles: [
      'democratie',
      'democratique',
      'liberte publique',
      'libertes publiques',
      'liberte associative',
      'libertes associatives',
    ],
  },
  { theme: 'Droits humains', motsCles: ['droits humains', 'droits de l homme', 'human rights'] },
];

export interface TypeCollecte {
  type: string;
  motsCles: string[];
}

export const TYPES_COLLECTE: TypeCollecte[] = [
  {
    type: 'livre',
    motsCles: [
      'livre',
      'ouvrage',
      'edition',
      'bande dessinee',
      'roman',
      'essai',
      'revue',
      'fanzine',
      'beau livre',
      'recueil',
    ],
  },
  {
    type: 'jeu',
    motsCles: [
      'jeu de societe',
      'jeu de plateau',
      'jeu de role',
      'jeu video',
      'jeu militant',
      'ludique',
    ],
  },
  {
    type: 'caisse_greve',
    motsCles: [
      'caisse de greve',
      'caisse de lutte',
      'caisse de solidarite',
      'soutien aux grevistes',
      'greve',
    ],
  },
  {
    type: 'cantine',
    motsCles: ['cantine solidaire', 'cantine', 'repas solidaire', 'epicerie solidaire'],
  },
  { type: 'film', motsCles: ['documentaire', 'film', 'court-metrage', 'webserie'] },
];

/**
 * Marqueurs d'extrême droite : une collecte qui en contient un est écartée
 * d'office (jamais proposée). Conservateur, complète la modération a priori.
 */
export const EXCLUSIONS: string[] = [
  'remigration',
  'grand remplacement',
  'reconquete',
  'rassemblement national',
  'identitaire',
  'nationaliste',
  'vive la france',
  'zemmour',
  'soral',
  'civilisation chretienne',
  'anti-immigration',
];

function echapper(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Recherche un mot-clé en MOT ENTIER (et non en sous-chaîne) dans un texte
 * déjà normalisé. Évite les faux positifs du type « trans » dans
 * « transition » ou « ia » dans « familiales » (leçon des tags de presse).
 * Les frontières sont tout caractère non alphanumérique (espace, +, tiret…).
 */
export function contientMot(texteNormalise: string, mot: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${echapper(mot)}([^a-z0-9]|$)`).test(texteNormalise);
}

/** Thèmes détectés dans un texte (titre + résumé). */
export function detecterThemes(texte: string): string[] {
  const t = normaliser(texte);
  const trouves: string[] = [];
  for (const { theme, motsCles } of THEMES_CURATION) {
    if (motsCles.some((m) => contientMot(t, m))) trouves.push(theme);
  }
  return trouves;
}

/** Type de collecte détecté (le premier qui matche), ou null. */
export function detecterType(texte: string): string | null {
  const t = normaliser(texte);
  for (const { type, motsCles } of TYPES_COLLECTE) {
    if (motsCles.some((m) => contientMot(t, m))) return type;
  }
  return null;
}

/** Vrai si le texte porte un marqueur d'exclusion (extrême droite). */
export function estExclu(texte: string): boolean {
  const t = normaliser(texte);
  return EXCLUSIONS.some((m) => contientMot(t, m));
}

/**
 * Requêtes de recherche envoyées aux plateformes : couvrent l'ensemble des
 * thèmes du mouvement (chaque requête = un appel à l'API Ulule). Élargissable :
 * ajouter un thème = ajouter une ligne. Les types de collecte recherchés
 * (caisses de grève, cantines) y figurent aussi comme requêtes directes.
 */
export const REQUETES_RECHERCHE: string[] = [
  'écologie',
  'féminisme',
  'antiraciste',
  'LGBTQIA',
  'écoféminisme',
  'décroissance',
  'anticapitalisme',
  'antifasciste',
  'climat',
  'solidarité migrants',
  'droit au logement',
  'cause animale',
  'agriculture paysanne',
  'décolonial',
  'justice sociale',
  'anarchisme',
  'communalisme',
  'marxisme',
  'altermondialisme',
  'pacifisme',
  'droits humains',
  'accès aux soins',
  'libertés publiques',
  'antispécisme',
  'peuples autochtones',
  'caisse de grève',
  'cantine solidaire',
  'lanceur alerte',
  'antivalidisme',
  'syndicat',
];
