/**
 * Registre des sources de brèves (revue de presse, demande Ben 2026-06-12).
 *
 * Deux familles de TIRAGE (l'identité éditoriale du fil, demande Ben) :
 *   - PRIORITAIRES (80 % des tirages de jour) : la liste fournie par Ben.
 *   - COMPLÉMENTAIRES (20 %) : une sélection de médias indépendants
 *     répertoriés par le Portail des médias indépendants animé par Basta!
 *     (https://portail.basta.media/sources, plus de 900 sources).
 *
 * Une ZONE de fuseau horaire (champ `zone`, demande Ben 2026-06-15) :
 *   - absente = Europe (par défaut, presque toutes les sources d'origine) ;
 *   - 'ameriques' = Québec, Canada, États-Unis, Amérique latine ;
 *   - 'outre-mer' = DOM-TOM francophones (Réunion, Antilles, Polynésie,
 *     Nouvelle-Calédonie…).
 *
 * Pourquoi la zone : la règle de fraîcheur « moins de 2 h » (V2.6.121) ne
 * prend que les contenus publiés dans les 2 dernières heures. Or ~90 % des
 * sources d'origine sont en fuseau européen : la nuit parisienne, personne
 * ne publie, donc l'import ne trouve rien et le fil se fige. Les sources
 * 'ameriques' et 'outre-mer' publient PENDANT notre nuit (elles sont en
 * plein après-midi/soirée chez elles) : `tirerSourceHoraire` les privilégie
 * aux heures creuses pour que le fil reste vivant 24 h/24. Liste sourcée et
 * testée : `docs/sources-fuseaux-ameriques-proposition.md`.
 *
 * Chaque brève importée garde la langue du site source (fr, en, es, he...).
 * Les URL de flux RSS/Atom ont été vérifiées (import initial 2026-06-12 ;
 * lot « autres fuseaux » le 2026-06-15) ; une source dont le flux casse est
 * simplement sautée par l'importeur (dégradation propre, signalée au rapport).
 */

export interface SourceBreve {
  /** Nom affiché (colonne `provenance_externe`). */
  nom: string;
  /** URL du flux RSS ou Atom. */
  flux: string;
  /** Langue des contenus (code ISO 639-1). */
  langue: string;
  /** Famille de tirage (gouverne le tirage de JOUR). */
  famille: 'prioritaire' | 'complementaire';
  /**
   * Zone de fuseau horaire (gouverne le tirage de NUIT). Absente = Europe.
   * Les zones ci-dessous publient pendant la nuit parisienne et sont
   * privilégiées aux heures creuses (voir `tirerSourceHoraire`).
   */
  zone?: 'ameriques' | 'outre-mer';
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
    // Côte est des États-Unis (UTC-4/-5) : couvre déjà la soirée/nuit de Paris.
    nom: 'The New York Times',
    flux: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    langue: 'en',
    famille: 'prioritaire',
    zone: 'ameriques',
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
 * Les trois dernières (Espagne, ajout Ben 2026-06-15) sont en fuseau
 * européen : elles enrichissent le fil mais ne comblent pas la nuit.
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
  // --- Espagne (fuseau européen, ajout Ben 2026-06-15) ---
  {
    nom: 'El Salto',
    flux: 'https://www.elsaltodiario.com/general/feed',
    langue: 'es',
    famille: 'complementaire',
  },
  {
    nom: 'Pikara Magazine',
    flux: 'https://www.pikaramagazine.com/feed/',
    langue: 'es',
    famille: 'complementaire',
  },
  {
    nom: 'Sin Permiso',
    flux: 'https://www.sinpermiso.info/rss.xml',
    langue: 'es',
    famille: 'complementaire',
  },
];

/**
 * Sources d'AUTRES FUSEAUX (demande Ben 2026-06-15) : Amériques (Québec,
 * Canada, États-Unis, Amérique latine) et DOM-TOM francophones. Elles
 * publient pendant la nuit parisienne et sont privilégiées par
 * `tirerSourceHoraire` aux heures creuses. Toutes vérifiées vivantes le
 * 2026-06-15 (scripts `data-migration/verifier-sources-fuseaux.mjs`,
 * `verif-quebec.mjs`, `verif-domtom.mjs`). Famille 'complementaire' : elles
 * n'entrent pas dans le tirage prioritaire de jour (qui reste l'identité
 * française du fil), mais portent le fil la nuit.
 */
export const SOURCES_AUTRES_FUSEAUX: SourceBreve[] = [
  // --- Francophones : Québec, Canada, Haïti (UTC-3/-5) ---
  {
    nom: 'Le Devoir',
    flux: 'https://www.ledevoir.com/rss/section/politique.xml',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Ricochet',
    flux: 'https://ricochet.media/feed',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Radio-Canada Info',
    flux: 'https://ici.radio-canada.ca/rss/4159',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Pivot',
    flux: 'https://pivot.quebec/feed/',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Presse-toi à gauche !',
    flux: 'https://www.pressegauche.org/spip.php?page=backend',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'La Presse',
    flux: 'https://www.lapresse.ca/actualites/rss',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'AlterPresse',
    flux: 'https://www.alterpresse.org/spip.php?page=backend',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  // --- Anglophones : États-Unis, Canada ---
  {
    nom: 'Jacobin',
    flux: 'https://jacobin.com/feed/',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'The Intercept',
    flux: 'https://theintercept.com/feed/?rss',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Truthout',
    flux: 'https://truthout.org/latest/feed/',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Common Dreams',
    flux: 'https://www.commondreams.org/feeds/news.rss',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'The Nation',
    flux: 'https://www.thenation.com/feed/?post_type=article',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Democracy Now!',
    flux: 'https://www.democracynow.org/democracynow.rss',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'ProPublica',
    flux: 'https://www.propublica.org/feeds/propublica/main',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Mother Jones',
    flux: 'https://www.motherjones.com/feed/',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'In These Times',
    flux: 'https://inthesetimes.com/rss',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'The Real News Network',
    flux: 'https://therealnews.com/feed',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Grist',
    flux: 'https://grist.org/feed/',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Labor Notes',
    flux: 'https://labornotes.org/feed',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Inside Climate News',
    flux: 'https://insideclimatenews.org/feed/',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'The Breach',
    flux: 'https://breachmedia.ca/feed/',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'rabble.ca',
    flux: 'https://rabble.ca/feed/',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'The Tyee',
    flux: 'https://thetyee.ca/rss2.xml',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'The Maple',
    flux: 'https://www.readthemaple.com/rss/',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'National Observer',
    flux: 'https://www.nationalobserver.com/front/rss',
    langue: 'en',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  // --- Hispanophones : Amérique latine ---
  {
    nom: 'El Ciudadano',
    flux: 'https://www.elciudadano.com/feed/',
    langue: 'es',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'La Izquierda Diario',
    flux: 'https://www.laizquierdadiario.com/spip.php?page=backend_portada',
    langue: 'es',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'Resumen Latinoamericano',
    flux: 'https://www.resumenlatinoamericano.org/feed/',
    langue: 'es',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  {
    nom: 'La Jornada',
    flux: 'https://www.jornada.com.mx/rss/edicion.xml',
    langue: 'es',
    famille: 'complementaire',
    zone: 'ameriques',
  },
  // --- DOM-TOM francophones (couvrent tout le tour du globe) ---
  {
    // La Réunion (UTC+4) : comble l'aube parisienne (04h-07h).
    nom: 'Zinfos974',
    flux: 'https://www.zinfos974.com/feed',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'outre-mer',
  },
  {
    // Guadeloupe (UTC-4) : couvre la soirée et le début de nuit de Paris.
    nom: 'Karib’Info',
    flux: 'https://www.karibinfo.com/feed/',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'outre-mer',
  },
  {
    // Polynésie (UTC-10) : comble le cœur de nuit parisien (00h-03h).
    nom: 'Tahiti Infos',
    flux: 'https://www.tahiti-infos.com/xml/syndication.rss',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'outre-mer',
  },
  {
    // Nouvelle-Calédonie (UTC+11) : couvre la nuit profonde parisienne.
    nom: 'Les Nouvelles Calédoniennes',
    flux: 'https://www.lnc.nc/rss.xml',
    langue: 'fr',
    famille: 'complementaire',
    zone: 'outre-mer',
  },
];

export const TOUTES_LES_SOURCES: SourceBreve[] = [
  ...SOURCES_PRIORITAIRES,
  ...SOURCES_COMPLEMENTAIRES,
  ...SOURCES_AUTRES_FUSEAUX,
];

/**
 * Sources qui publient pendant la nuit parisienne (toute zone non européenne).
 * Calculé depuis `TOUTES_LES_SOURCES` pour rester l'unique source de vérité
 * (inclut donc aussi le New York Times, tagué 'ameriques' dans les prioritaires).
 */
export const SOURCES_NUIT: SourceBreve[] = TOUTES_LES_SOURCES.filter((s) => s.zone !== undefined);

/** Heure courante à Paris (0-23), pour aiguiller le tirage horaire. */
export function heureParisCourante(): number {
  return Number.parseInt(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()),
    10,
  );
}

/**
 * Heure creuse parisienne : 23h → 6h59. Pendant cette plage, les sources
 * françaises/européennes ne publient quasiment plus, donc la règle de
 * fraîcheur « moins de 2 h » ne trouve rien : on bascule sur les autres
 * fuseaux (idée Ben 2026-06-15).
 */
export function estHeureCreuseParis(heureParis: number): boolean {
  return heureParis < 7 || heureParis >= 23;
}

/**
 * Tire une source pour l'import horaire. L'aléa et l'heure sont injectables
 * pour la testabilité.
 *
 * - JOUR (7h-22h) : 80 % prioritaires, 20 % complémentaires (décision Ben
 *   2026-06-12) : le fil garde son identité française/européenne.
 * - NUIT (23h-6h) : 85 % sources d'autres fuseaux (Amériques, Outre-mer) qui
 *   publient à cette heure-là, 15 % repli sur l'ensemble pour laisser passer
 *   un contenu européen tardif ou matinal (idée Ben 2026-06-15).
 */
export function tirerSourceHoraire(
  aleatoire: () => number = Math.random,
  heureParis: number = heureParisCourante(),
): SourceBreve {
  if (estHeureCreuseParis(heureParis) && SOURCES_NUIT.length > 0) {
    const pool = aleatoire() < 0.85 ? SOURCES_NUIT : TOUTES_LES_SOURCES;
    const index = Math.floor(aleatoire() * pool.length);
    return pool[Math.min(index, pool.length - 1)] as SourceBreve;
  }
  const famille = aleatoire() < 0.8 ? SOURCES_PRIORITAIRES : SOURCES_COMPLEMENTAIRES;
  const index = Math.floor(aleatoire() * famille.length);
  return famille[Math.min(index, famille.length - 1)] as SourceBreve;
}
