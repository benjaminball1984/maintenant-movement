/**
 * Registre des sources de brèves (revue de presse, demande Ben 2026-06-12).
 *
 * Deux familles :
 *   - PRIORITAIRES (80 % des tirages horaires) : la liste fournie par Ben.
 *   - COMPLÉMENTAIRES (20 %) : une sélection de médias indépendants
 *     répertoriés par le Portail des médias indépendants animé par Basta!
 *     (https://portail.basta.media/sources, plus de 900 sources).
 *
 * Chaque brève importée garde la langue du site source (fr, en, es, he...).
 * Les URL de flux RSS/Atom ont été vérifiées à l'import initial du
 * 2026-06-12 ; une source dont le flux casse est simplement sautée par
 * l'importeur (dégradation propre, signalée dans le rapport).
 */

export interface SourceBreve {
  /** Nom affiché (colonne `provenance_externe`). */
  nom: string;
  /** URL du flux RSS ou Atom. */
  flux: string;
  /** Langue des contenus (code ISO 639-1). */
  langue: string;
  /** Famille de tirage. */
  famille: 'prioritaire' | 'complementaire';
}

export const SOURCES_PRIORITAIRES: SourceBreve[] = [
  { nom: 'Regards', flux: 'https://regards.fr/feed/', langue: 'fr', famille: 'prioritaire' },
  { nom: 'Politis', flux: 'https://www.politis.fr/feed/', langue: 'fr', famille: 'prioritaire' },
  {
    nom: 'Basta!',
    flux: 'https://basta.media/spip.php?page=backend',
    langue: 'fr',
    famille: 'prioritaire',
  },
  { nom: 'Vert', flux: 'https://vert.eco/feed', langue: 'fr', famille: 'prioritaire' },
  { nom: 'Blast', flux: 'https://api.blast-info.fr/rss.xml', langue: 'fr', famille: 'prioritaire' },
  {
    nom: 'Le Média',
    flux: 'https://api.lemediatv.fr/rss.xml',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'Mediapart',
    flux: 'https://www.mediapart.fr/articles/feed',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'Courrier international',
    flux: 'https://www.courrierinternational.com/feed/all/rss.xml',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'L’Humanité',
    flux: 'https://www.humanite.fr/rss/actu.rss',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'Libération',
    flux: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'StreetPress',
    flux: 'https://www.streetpress.com/rss.xml',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'Le Monde diplomatique',
    flux: 'https://www.monde-diplomatique.fr/recents.xml',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'Haaretz',
    flux: 'https://www.haaretz.com/srv/htz---all-articles',
    langue: 'en',
    famille: 'prioritaire',
  },
  {
    nom: 'El País',
    flux: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada',
    langue: 'es',
    famille: 'prioritaire',
  },
  {
    nom: 'The Guardian',
    flux: 'https://www.theguardian.com/europe/rss',
    langue: 'en',
    famille: 'prioritaire',
  },
  {
    nom: 'Le Monde',
    flux: 'https://www.lemonde.fr/rss/une.xml',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'Contretemps',
    flux: 'https://www.contretemps.eu/feed/',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'Frustration Magazine',
    flux: 'https://frustrationmagazine.fr/feed/',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'Arrêt sur images',
    flux: 'https://api.arretsurimages.net/api/public/rss/all-contents',
    langue: 'fr',
    famille: 'prioritaire',
  },
  { nom: 'QG Média', flux: 'https://qg.media/feed/', langue: 'fr', famille: 'prioritaire' },
  {
    nom: 'Jeune Afrique',
    flux: 'https://www.jeuneafrique.com/feed/',
    langue: 'fr',
    famille: 'prioritaire',
  },
  {
    nom: 'The New York Times',
    flux: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    langue: 'en',
    famille: 'prioritaire',
  },
  {
    nom: 'Le Grand Continent',
    flux: 'https://legrandcontinent.eu/fr/feed/',
    langue: 'fr',
    famille: 'prioritaire',
  },
];

/**
 * Sélection de sources du Portail des médias indépendants (Basta!) :
 * https://portail.basta.media/sources. Le portail référence 900+ médias ;
 * cette sélection tournante couvre l'investigation, l'écologie, le social
 * et les luttes. Élargissable au fil de l'eau (un ajout = une ligne).
 */
export const SOURCES_COMPLEMENTAIRES: SourceBreve[] = [
  {
    nom: 'Reporterre',
    flux: 'https://reporterre.net/spip.php?page=backend',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'Rapports de force',
    flux: 'https://rapportsdeforce.fr/feed',
    langue: 'fr',
    famille: 'complementaire',
  },
  { nom: 'Disclose', flux: 'https://disclose.ngo/feed', langue: 'fr', famille: 'complementaire' },
  { nom: 'Splann !', flux: 'https://splann.org/feed/', langue: 'fr', famille: 'complementaire' },
  {
    nom: 'Acrimed',
    flux: 'https://www.acrimed.org/spip.php?page=backend',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'Ballast',
    flux: 'https://www.revue-ballast.fr/feed/',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'CQFD',
    flux: 'https://cqfd-journal.org/spip.php?page=backend',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'Lundi matin',
    flux: 'https://lundi.am/spip.php?page=backend',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'Au Poste',
    flux: 'https://www.auposte.fr/feed/',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'Off Investigation',
    flux: 'https://www.off-investigation.fr/feed/',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'Mr Mondialisation',
    flux: 'https://mrmondialisation.org/feed/',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'La Déferlante',
    flux: 'https://revueladeferlante.fr/feed/',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'L’Empaillé',
    flux: 'https://lempaille.fr/feed/',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'Là-bas si j’y suis',
    flux: 'https://la-bas.org/spip.php?page=backend',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'Afrique XXI',
    flux: 'https://afriquexxi.info/spip.php?page=backend',
    langue: 'fr',
    famille: 'complementaire',
  },
  {
    nom: 'Le Chiffon',
    flux: 'https://www.lechiffon.fr/feed/',
    langue: 'fr',
    famille: 'complementaire',
  },
];

export const TOUTES_LES_SOURCES: SourceBreve[] = [
  ...SOURCES_PRIORITAIRES,
  ...SOURCES_COMPLEMENTAIRES,
];

/**
 * Tire une source pour l'import horaire : 80 % prioritaires, 20 %
 * complémentaires (décision Ben 2026-06-12). L'aléa est injecté pour
 * la testabilité.
 */
export function tirerSourceHoraire(aleatoire: () => number = Math.random): SourceBreve {
  const famille = aleatoire() < 0.8 ? SOURCES_PRIORITAIRES : SOURCES_COMPLEMENTAIRES;
  const index = Math.floor(aleatoire() * famille.length);
  return famille[Math.min(index, famille.length - 1)] as SourceBreve;
}
