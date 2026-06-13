/**
 * Banque de tags des brèves et attribution automatique par mots-clés.
 *
 * Banque élaborée le 2026-06-12 à partir du corpus d'amorçage : les ~96
 * brèves de la récolte initiale (3 jours, 38 sources) + les articles
 * maison de Maintenant Médias (Appel 10 septembre, L'APRÈS, Deranque,
 * Bagayoko). Mots-clés multilingues (fr/en/es) car chaque brève garde la
 * langue de son site source.
 *
 * Attribution (fonction pure, testée) : insensible à la casse, aux
 * accents et à la ponctuation ; les mots courts ambigus (« RN », « IA »,
 * « AI ») sont entourés d'espaces pour matcher des mots entiers ; au plus
 * `MAX_TAGS_PAR_BREVE` tags, dans l'ordre éditorial de la banque (du plus
 * spécifique au plus générique).
 */

export const MAX_TAGS_PAR_BREVE = 3;

interface ReglesTag {
  tag: string;
  motsCles: string[];
}

const BANQUE_TAGS: ReglesTag[] = [
  {
    tag: 'Luttes et mobilisations',
    motsCles: [
      'manifest',
      ' greve ',
      ' greves ',
      'mobilis',
      'blocage',
      'boycott',
      'piquet',
      'rassemblement',
      'occupation',
      'soulevement',
      'petition',
      ' strike ',
      'protest',
      'huelga',
    ],
  },
  {
    tag: 'Extrême droite',
    motsCles: [
      'extreme droite',
      ' rn ',
      'rassemblement national',
      'neonazi',
      'neo nazi',
      'neofasciste',
      'fasciste',
      'fascisme',
      'zemmour',
      'reconquete',
      'identitaire',
      'ultra droite',
      'far right',
      'extrema derecha',
      'ultraderecha',
      ' bardella ',
      ' le pen ',
      'sterin',
    ],
  },
  {
    tag: 'Police et justice',
    motsCles: [
      'polic',
      'gendarm',
      'justice',
      ' proces ',
      'tribunal',
      ' juge ',
      'prison',
      'repression',
      'garde a vue',
      'perquisition',
      'surveillance',
      ' dgsi ',
      'meurtre',
      'condamn',
      ' police ',
      'incarcer',
    ],
  },
  {
    tag: 'Féminismes',
    motsCles: [
      'feminis',
      'feminicide',
      'sexis',
      'patriarc',
      'violences faites aux femmes',
      'droits des femmes',
      ' ivg ',
      ' women ',
      'mujeres',
      'natalite',
    ],
  },
  {
    tag: 'Antiracisme',
    motsCles: [
      'racis',
      'islamophob',
      'antisemit',
      'discrimination',
      'negrophob',
      'xenophob',
      ' racism ',
      'decolonial',
    ],
  },
  {
    tag: 'Migrations',
    motsCles: [
      'migrant',
      'migration',
      'refugie',
      'sans papiers',
      'exil',
      ' asile ',
      'frontiere',
      ' oqtf ',
      'regulariz',
      'refugee',
      'migracion',
    ],
  },
  {
    tag: 'Écologie',
    motsCles: [
      'ecolog',
      'climat',
      'pesticide',
      'nitrate',
      'pollu',
      'biodiversite',
      ' pfas ',
      'petrole',
      ' gaz ',
      // « agricol » (nu) matchait « site agricole », « exploitation agricole »
      // hors sujet écolo (faux positif signalé par Ben 2026-06-13). On cible
      // l'agriculture COMME SUJET (mot entier) et l'agro-industrie.
      ' agriculture ',
      'agro industrie',
      'agro alimentaire',
      'agrochimie',
      'monoculture',
      'environnement',
      'energies renouvelables',
      'nucleaire',
      'climate',
      'environment',
      'medio ambiente',
      'contaminacion',
      'acetamipride',
      'cadmium',
    ],
  },
  {
    tag: 'Guerre et paix',
    motsCles: [
      'guerre',
      ' armee ',
      'militaire',
      'frappe',
      'missile',
      'armement',
      ' otan ',
      'cessez le feu',
      ' paix ',
      'bombard',
      ' war ',
      ' army ',
      'guerra',
      'ejercito',
      'invasion',
    ],
  },
  {
    tag: 'Social et travail',
    motsCles: [
      'salari',
      ' travail ',
      'travailleurs',
      'travailleuses',
      'retraite',
      'syndic',
      'precarite',
      'pauvrete',
      'chomage',
      'logement',
      'bourses',
      ' smic ',
      'secours populaire',
      'services publics',
      ' workers ',
      ' labor ',
      'trabajadores',
      'nationalisation',
    ],
  },
  {
    tag: 'Médias',
    motsCles: [
      ' medias ',
      ' presse ',
      'journalis',
      'censure',
      'bollore',
      ' cnews ',
      'redaction',
      'audiovisuel',
      'press freedom',
      'periodis',
    ],
  },
  {
    tag: 'Santé',
    motsCles: [
      ' sante ',
      'hopital',
      'hopitaux',
      'cancer',
      'epidemie',
      'ebola',
      'vaccin',
      'securite sociale',
      ' health ',
      ' salud ',
      'psychiatri',
    ],
  },
  {
    tag: 'Tech et IA',
    motsCles: [
      'intelligence artificielle',
      ' ia ',
      ' ai ',
      'algorithme',
      'numerique',
      'spacex',
      'cybersecurite',
      'messageries chiffrees',
      ' tech ',
      'plateformes numeriques',
    ],
  },
  {
    tag: 'Économie',
    motsCles: [
      'econom',
      'milliardaire',
      'trillionaire',
      'billionaire',
      'capitalis',
      'multinationale',
      ' bourse ',
      'inflation',
      ' banque ',
      ' finance ',
      ' budget ',
      'profits',
    ],
  },
  {
    tag: 'Politique',
    motsCles: [
      'presidentielle',
      'municipales',
      'legislatives',
      'assemblee nationale',
      ' senat ',
      'gouvernement',
      ' ministre ',
      ' macron ',
      'melenchon',
      'glucksmann',
      ' parti ',
      ' election ',
      'referendum',
      ' deputes ',
      ' deputees ',
      'parlement',
    ],
  },
  {
    tag: 'International',
    motsCles: [
      ' iran ',
      ' ukraine ',
      ' russie ',
      ' chine ',
      ' gaza ',
      ' israel ',
      'palestin',
      ' etats unis ',
      ' trump ',
      ' rdc ',
      ' congo ',
      'cameroun',
      ' senegal ',
      ' mayotte ',
      ' burundi ',
      ' mexique ',
      ' mexico ',
      ' espagne ',
      ' espana ',
      ' europe ',
      ' onu ',
      ' maroc ',
      'indonesie',
      ' africa ',
      ' afrique ',
      ' belfast ',
      ' kurde ',
    ],
  },
  {
    tag: 'Culture',
    motsCles: [
      'culture',
      'cinema',
      ' film ',
      'musique',
      'concert',
      ' livre ',
      ' roman ',
      'festival',
      'theatre',
      'exposition',
      ' artiste ',
      ' music ',
      ' novel ',
      ' art ',
    ],
  },
  {
    tag: 'Sports',
    motsCles: [
      ' sport ',
      'coupe du monde',
      'football',
      ' nba ',
      'basket',
      'jeux olympiques',
      'world cup',
      'futbol',
      ' match ',
    ],
  },
];

/** Liste plate des tags (filtres de la page). */
export const TAGS_BREVES: string[] = BANQUE_TAGS.map((r) => r.tag);

// Plage Unicode des diacritiques combinants (mêmes bornes que les autres
// helpers du projet : Biome refuse la classe littérale).
const REGEX_DIACRITIQUES = new RegExp(
  `[${String.fromCodePoint(0x0300)}-${String.fromCodePoint(0x036f)}]`,
  'g',
);

/**
 * Normalisation : minuscules, accents retirés, toute ponctuation devient
 * un espace (les mots-clés avec espaces matchent donc des mots entiers).
 */
function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(REGEX_DIACRITIQUES, '')
    .replace(/[^a-z0-9]+/g, ' ');
}

/**
 * Tag de repli quand aucun mot-clé ne matche (demande Ben 2026-06-13 :
 * « il en faut au moins 1 »). « Politique » est le tag parapluie d'un
 * mouvement politique citoyen : le moins arbitraire pour un contenu de la
 * revue de presse qu'on n'a pas su classer plus finement.
 */
export const TAG_PAR_DEFAUT = 'Politique';

/**
 * Attribue les tags d'une brève d'après son titre + extrait.
 * Retourne au plus MAX_TAGS_PAR_BREVE tags, ordre éditorial de la banque,
 * et AU MOINS un (repli parapluie) : toute carte a une pastille (Ben).
 */
export function assignerTags(texte: string): string[] {
  const corps = ` ${normaliser(texte)} `;
  const tags: string[] = [];
  for (const regle of BANQUE_TAGS) {
    if (tags.length >= MAX_TAGS_PAR_BREVE) break;
    if (regle.motsCles.some((mot) => corps.includes(mot.startsWith(' ') ? mot : normaliser(mot)))) {
      tags.push(regle.tag);
    }
  }
  return tags.length > 0 ? tags : [TAG_PAR_DEFAUT];
}
