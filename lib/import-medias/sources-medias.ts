/**
 * Registre des sources multi-format de la revue de presse (demande Ben
 * 2026-06-13) : podcasts, vidéos, lives, dessins de presse. 27 sources par
 * format, validées et flux vérifiés le 2026-06-13 (voir
 * `docs/sources-podcasts-videos-dessins-proposition.md`).
 *
 * Orientation éditoriale : médias engagés (féministes, antiracistes,
 * antivalidistes, LGBTQIA+, décoloniaux, écolos, sociaux, enfantistes,
 * luttes, philo, éco, socio, sciences, effondrisme, politique, marxisme,
 * communalisme), ~80 % francophones / 20 % international.
 *
 * Comme pour les brèves : une source dont le flux casse est simplement
 * sautée (dégradation propre). Élargissable au fil de l'eau (un ajout =
 * une ligne).
 */

export type FormatMedia = 'podcast' | 'video' | 'live' | 'dessin';

export interface SourceMedia {
  /** Nom affiché (colonne `provenance_externe`). */
  nom: string;
  /** URL du flux RSS/Atom (YouTube : feeds/videos.xml?channel_id=...). */
  flux: string;
  /** Langue des contenus (code ISO 639-1). */
  langue: string;
  /** Format éditorial : sélectionne le `type` du media et l'onglet. */
  format: FormatMedia;
}

/** 27 podcasts engagés (22 FR, 5 internationaux). */
export const SOURCES_PODCASTS: SourceMedia[] = [
  {
    nom: 'Un podcast à soi',
    flux: 'https://www.arteradio.com/xml_sound_emission?emissionname=%22Un%20podcast%20%C3%A0%20soi%22&partner=applepodcast',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'La Poudre',
    flux: 'https://feeds.audiomeans.fr/feed/f421f90d-cee9-47c4-9105-bca8e46fe952.xml',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Les Couilles sur la table',
    flux: 'https://feeds.audiomeans.fr/feed/d9cd7538-7491-4873-b0c4-90ccba60ccf6.xml',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Le Cœur sur la table',
    flux: 'https://feeds.audiomeans.fr/feed/c15bf308-42a5-4cdc-9e89-38dce9113c6b.xml',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Kiffe ta race',
    flux: 'https://feeds.acast.com/public/shows/65252e3aa416f100116f4232',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Thune',
    flux: 'https://feeds.acast.com/public/shows/6569d320c27dae001249cf18',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Afrotopiques',
    flux: 'https://feeds.acast.com/public/shows/621dd33a14afa4001277dedb',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Présages',
    flux: 'https://anchor.fm/s/db4c93e4/podcast/rss',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Floraisons',
    flux: 'https://anchor.fm/s/937ab00/podcast/rss',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Sismique',
    flux: 'https://feeds.acast.com/public/shows/9851446c-d9b9-47a2-99a9-26d0a4968cc3',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Baleine sous Gravillon',
    flux: 'https://feed.ausha.co/BNxwOTwv2gLX',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'L’actu des luttes',
    flux: 'https://feed.ausha.co/owWdiKq7jxGo',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Sortir du capitalisme',
    flux: 'https://feeds.castos.com/4d30d',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Minuit dans le siècle',
    flux: 'https://feeds.castos.com/72vnv',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Avis de Tempête',
    flux: 'https://audioblog.arteradio.com/blog/177155/rss',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Les Pieds sur terre',
    flux: 'https://radiofrance-podcast.net/podcast09/rss_10078.xml',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Avec philosophie',
    flux: 'https://radiofrance-podcast.net/podcast09/rss_10467.xml',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'La Science CQFD',
    flux: 'https://radiofrance-podcast.net/podcast09/rss_14312.xml',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Méta de Choc',
    flux: 'https://feeds.acast.com/public/shows/5c74448857223e944f75f7b6',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'Papatriarcat',
    flux: 'https://feeds.acast.com/public/shows/8ba59308-1b26-5bd9-9fb2-9d0e873d4579',
    langue: 'fr',
    format: 'podcast',
  },
  { nom: 'lanomalie', flux: 'https://feed.ausha.co/lDPvNfaxQe5v', langue: 'fr', format: 'podcast' },
  {
    nom: 'NONBI Radio',
    flux: 'https://feed.ausha.co/Oga5qizPe4P0',
    langue: 'fr',
    format: 'podcast',
  },
  {
    nom: 'The Dig',
    flux: 'https://thedig.blubrry.net/feed/podcast/',
    langue: 'en',
    format: 'podcast',
  },
  {
    nom: 'Novara Media',
    flux: 'https://feeds.podcastmirror.com/novara-media',
    langue: 'en',
    format: 'podcast',
  },
  {
    nom: 'Upstream',
    flux: 'https://rss.libsyn.com/shows/435210/destinations/3632352.xml',
    langue: 'en',
    format: 'podcast',
  },
  {
    nom: 'Death Panel',
    flux: 'https://feeds.soundcloud.com/users/soundcloud:users:545327328/sounds.rss',
    langue: 'en',
    format: 'podcast',
  },
  {
    nom: 'La Base',
    flux: 'https://anchor.fm/s/f182c2c8/podcast/rss',
    langue: 'es',
    format: 'podcast',
  },
];

/** Construit l'URL du flux RSS d'une chaîne YouTube depuis son channel_id. */
function fluxYoutube(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

/**
 * Chaînes vidéo + lives (27 au total). Distinction `format` :
 *   - `live` : médias à diffusion régulière / émissions en direct
 *     (onglet « Lives »).
 *   - `video` : vidéastes et formats produits (onglet « Vidéos »).
 * 18 FR vidéo + 9 live (dont 2 internationaux), 5 internationaux au total.
 */
export const SOURCES_VIDEOS: SourceMedia[] = [
  // Lives (9) : médias à diffusion régulière / émissions en direct.
  { nom: 'Blast', flux: fluxYoutube('UC__xRB5L4toU9yYawt_lIKg'), langue: 'fr', format: 'live' },
  { nom: 'Le Média', flux: fluxYoutube('UCT67YOMntJxfRnO_9bXDpvw'), langue: 'fr', format: 'live' },
  { nom: 'Au Poste', flux: fluxYoutube('UC8-FN_ftL-crIaXMouuykyQ'), langue: 'fr', format: 'live' },
  { nom: 'Mediapart', flux: fluxYoutube('UCdnaDhU-LDQrIEEmSIfq0-Q'), langue: 'fr', format: 'live' },
  { nom: 'QG TV', flux: fluxYoutube('UCCDPdHuBGfjMxlM3xZANgGQ'), langue: 'fr', format: 'live' },
  { nom: 'Backseat', flux: fluxYoutube('UC2ijB3_Fg2pIW1g6FeIiYKA'), langue: 'fr', format: 'live' },
  {
    nom: 'Le Canard Réfractaire',
    flux: fluxYoutube('UCWGsN59FON3vOtXCozQPsZQ'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'Novara Media',
    flux: fluxYoutube('UCOzMAa6IhV6uwYQATYG_2kg'),
    langue: 'en',
    format: 'live',
  },
  {
    nom: 'Democracy Now!',
    flux: fluxYoutube('UCzuqE7-t13O4NIDYJfakrhw'),
    langue: 'en',
    format: 'live',
  },
  // Vidéos (18) : vidéastes et formats produits.
  {
    nom: 'Là-bas si j’y suis',
    flux: fluxYoutube('UCMAT1VA7o6bD6qnpBBZ_New'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Datagueule',
    flux: fluxYoutube('UCm5wThREh298TkK8hCT9HuA'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Partager c’est sympa',
    flux: fluxYoutube('UCr_3nQ4eRCwm_XUDpf62MAg'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Bolchegeek',
    flux: fluxYoutube('UCEfpbmshpf-G90fGLla73kA'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Le Réveilleur',
    flux: fluxYoutube('UC1EacOJoqsKaYxaDomTCTEQ'),
    langue: 'fr',
    format: 'video',
  },
  { nom: 'Heu?reka', flux: fluxYoutube('UC7sXGI8p8PvKosLWagkK9wQ'), langue: 'fr', format: 'video' },
  {
    nom: 'Philoxime',
    flux: fluxYoutube('UCdKTlsmvczkdvGjiLinQwmw'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Osons Causer',
    flux: fluxYoutube('UCVeMw72tepFl1Zt5fvf9QKQ'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Frustration Magazine',
    flux: fluxYoutube('UCHCwlzgXqqjrNxfVOmLsU5w'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Histoires Crépues',
    flux: fluxYoutube('UCVuMMUfqEI448VKbkpuNPHQ'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'La Carologie',
    flux: fluxYoutube('UCxQcOTjUpeI8Goo6UXJ2NgA'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Politikon',
    flux: fluxYoutube('UC0HxyEc_ojRJ1oJXS5K6oaA'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Télé Millevaches',
    flux: fluxYoutube('UC9Qd2Qu066ZuwUVJLbupnpw'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Odile Maurin',
    flux: fluxYoutube('UCL7JWzgJTNzu3t1l8eAG9xQ'),
    langue: 'fr',
    format: 'video',
  },
  {
    nom: 'Alistair Houdayer',
    flux: fluxYoutube('UCREQUCvi8eBCuamHuwiH9eA'),
    langue: 'fr',
    format: 'video',
  },
  { nom: 'Means TV', flux: fluxYoutube('UCV6zxTJ8MR6kN6kZ0ZBJiqQ'), langue: 'en', format: 'video' },
  {
    nom: 'Philosophy Tube',
    flux: fluxYoutube('UC2PA-AKmVpU6NKCGtZq_rKQ'),
    langue: 'en',
    format: 'video',
  },
  {
    nom: 'Double Down News',
    flux: fluxYoutube('UCeRYN0tYBQVrC2cKsxJjdow'),
    langue: 'en',
    format: 'video',
  },
  // === Lives étoffés (validés par Ben 2026-06-13 : personnalités
  // politiques, syndicats de gauche hors CFDT, ONG/assos/collectifs,
  // international). Channel_id vérifiés actifs. ===
  // Syndicats de gauche.
  { nom: 'La CGT', flux: fluxYoutube('UCXbA6-9E-w1m5SwUVuC9VQw'), langue: 'fr', format: 'live' },
  {
    nom: 'Union syndicale Solidaires',
    flux: fluxYoutube('UCrhskh-RXjJPUXlfCMui6Cw'),
    langue: 'fr',
    format: 'live',
  },
  { nom: 'FSU', flux: fluxYoutube('UCS5yhSOqIFUQY8H-UAWHODQ'), langue: 'fr', format: 'live' },
  {
    nom: 'Confédération paysanne',
    flux: fluxYoutube('UCbWqDhRCUHRuZkZYvYga4Og'),
    langue: 'fr',
    format: 'live',
  },
  { nom: 'SUD-Rail', flux: fluxYoutube('UCnJQN4DOteKb4B6l9RHxaWg'), langue: 'fr', format: 'live' },
  {
    nom: 'SUD éducation',
    flux: fluxYoutube('UCojHfRNjWh6S30smdLLWYkw'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'Réseau Salariat',
    flux: fluxYoutube('UCwdrNdnPSkE7HEAiuRG8Tcw'),
    langue: 'fr',
    format: 'live',
  },
  // Partis et mouvements.
  {
    nom: 'Révolution Permanente',
    flux: fluxYoutube('UCwLLr_Fo9dpdJ9UHq4A7PjA'),
    langue: 'fr',
    format: 'live',
  },
  { nom: 'NPA', flux: fluxYoutube('UCAKzgWr5laB3Yf44hvqqZZQ'), langue: 'fr', format: 'live' },
  {
    nom: 'Sandrine Rousseau',
    flux: fluxYoutube('UCA8JG3JY883RjCmAU9lABzw'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'Clémentine Autain / L’Après',
    flux: fluxYoutube('UCZgJ_r_Ewlu1Ck-RzNCHuUQ'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'François Ruffin',
    flux: fluxYoutube('UCIQGSp79vVch0vO3Efqif_w'),
    langue: 'fr',
    format: 'live',
  },
  { nom: 'Debout !', flux: fluxYoutube('UCQcOjAB27zVvTq7WPost9hA'), langue: 'fr', format: 'live' },
  {
    nom: 'Lutte Ouvrière',
    flux: fluxYoutube('UCZsh-MrJftAOP_-ZgRgLScw'),
    langue: 'fr',
    format: 'live',
  },
  // ONG, associations, collectifs.
  {
    nom: 'Les Soulèvements de la Terre',
    flux: fluxYoutube('UC4FwrM-0Zr3okIUs8DW9SMA'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'Attac France',
    flux: fluxYoutube('UCe0hOiy0uE2ck3zSYkBV1UA'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'Extinction Rebellion France',
    flux: fluxYoutube('UCSJFmDCxyjkxVsZNJUymZWQ'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'Oxfam France',
    flux: fluxYoutube('UCf1p5jaYrOEUG5j0wzGPckw'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'ATD Quart Monde',
    flux: fluxYoutube('UCIGpedPUvBjyLJ4rba2QvzA'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'Banlieues Climat',
    flux: fluxYoutube('UCJl9enlQdVCHfFoCCfrhUzw'),
    langue: 'fr',
    format: 'live',
  },
  // Personnalités et médias engagés.
  {
    nom: 'Camille Étienne',
    flux: fluxYoutube('UCyjXo7RjhDQ1oX7Q7CPUUIQ'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'Reporterre',
    flux: fluxYoutube('UCDn6zvBZNEWUv44xjgELicA'),
    langue: 'fr',
    format: 'live',
  },
  { nom: 'Politis', flux: fluxYoutube('UCtjc5x0RIiTsdYS4IFMjCGQ'), langue: 'fr', format: 'live' },
  {
    nom: 'Off Investigation',
    flux: fluxYoutube('UCEFGCs68E9Vr5te5qZuJsbg'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'Thinkerview',
    flux: fluxYoutube('UCQgWpmt02UtJkyO32HGUASQ'),
    langue: 'fr',
    format: 'live',
  },
  {
    nom: 'Radio Nova',
    flux: fluxYoutube('UCGvjUWz3mGV9cssraATuEsw'),
    langue: 'fr',
    format: 'live',
  },
  // International.
  {
    nom: 'Alexandria Ocasio-Cortez',
    flux: fluxYoutube('UCElqfal0wzzpLsHlRuqZjaA'),
    langue: 'en',
    format: 'live',
  },
  {
    nom: 'Bernie Sanders',
    flux: fluxYoutube('UCH1dpzjCEiGAt8CXkryhkZg'),
    langue: 'en',
    format: 'live',
  },
];

/** 27 sources de dessins de presse et BD (20 FR, 7 internationaux). */
export const SOURCES_DESSINS: SourceMedia[] = [
  { nom: 'La Brèche', flux: 'https://journal-labreche.fr/feed/', langue: 'fr', format: 'dessin' },
  {
    nom: 'CQFD',
    flux: 'https://cqfd-journal.org/spip.php?page=backend',
    langue: 'fr',
    format: 'dessin',
  },
  { nom: 'Zélium', flux: 'https://zelium.info/feed/', langue: 'fr', format: 'dessin' },
  {
    nom: 'Basta! (dessins)',
    flux: 'https://basta.media/spip.php?page=backend',
    langue: 'fr',
    format: 'dessin',
  },
  { nom: 'Emma', flux: 'https://emmaclit.com/feed/', langue: 'fr', format: 'dessin' },
  {
    nom: 'Allan Barte',
    flux: 'https://mastodon.social/@AllanBARTE.rss',
    langue: 'fr',
    format: 'dessin',
  },
  {
    nom: 'Gee (Grise Bouille)',
    flux: 'https://framapiaf.org/@gee.rss',
    langue: 'fr',
    format: 'dessin',
  },
  {
    nom: 'Sophie Labelle',
    flux: 'https://assigneegarcon.tumblr.com/rss',
    langue: 'fr',
    format: 'dessin',
  },
  {
    nom: 'La Déferlante',
    flux: 'https://revueladeferlante.fr/feed/',
    langue: 'fr',
    format: 'dessin',
  },
  {
    nom: 'Les Ourses à plumes',
    flux: 'https://lesoursesaplumes.info/feed/',
    langue: 'fr',
    format: 'dessin',
  },
  { nom: 'L’Empaillé', flux: 'https://lempaille.fr/feed/', langue: 'fr', format: 'dessin' },
  { nom: 'Médor', flux: 'https://medor.coop/rss.xml', langue: 'fr', format: 'dessin' },
  {
    nom: 'La Revue Dessinée',
    flux: 'https://www.larevuedessinee.fr/feed/',
    langue: 'fr',
    format: 'dessin',
  },
  { nom: 'Babouse', flux: 'https://www.babouse.fr/feed/', langue: 'fr', format: 'dessin' },
  {
    nom: 'Cartooning for Peace',
    flux: 'https://www.cartooningforpeace.org/feed/',
    langue: 'fr',
    format: 'dessin',
  },
  { nom: 'Siné Mensuel', flux: 'https://sinemensuel.com/feed/', langue: 'fr', format: 'dessin' },
  { nom: 'Urtikan.net', flux: 'https://www.urtikan.net/feed/', langue: 'fr', format: 'dessin' },
  { nom: 'Sanaga', flux: 'https://sanaga-dessins.fr/feed/', langue: 'fr', format: 'dessin' },
  { nom: 'Soulcié', flux: 'https://mastodon.social/@soulcie.rss', langue: 'fr', format: 'dessin' },
  {
    nom: 'Projet Crocodiles',
    flux: 'https://projetcrocodiles.tumblr.com/rss',
    langue: 'fr',
    format: 'dessin',
  },
  {
    nom: 'Cartoon Movement',
    flux: 'https://www.cartoonmovement.com/rss.xml',
    langue: 'en',
    format: 'dessin',
  },
  {
    nom: 'Ann Telnaes',
    flux: 'https://anntelnaes.substack.com/feed',
    langue: 'en',
    format: 'dessin',
  },
  {
    nom: 'Tom Tomorrow',
    flux: 'https://tomtomorrow.substack.com/feed',
    langue: 'en',
    format: 'dessin',
  },
  {
    nom: 'Ruben Bolling',
    flux: 'https://tomthedancingbug.substack.com/feed',
    langue: 'en',
    format: 'dessin',
  },
  { nom: 'Matt Bors', flux: 'https://mattbors.substack.com/feed', langue: 'en', format: 'dessin' },
  {
    nom: 'First Dog on the Moon',
    flux: 'https://www.theguardian.com/profile/first-dog-on-the-moon/rss',
    langue: 'en',
    format: 'dessin',
  },
  {
    nom: 'Martin Rowson',
    flux: 'https://www.theguardian.com/profile/martinrowson/rss',
    langue: 'en',
    format: 'dessin',
  },
];

/** Toutes les sources multi-format, par format. */
export const SOURCES_PAR_FORMAT: Record<FormatMedia, SourceMedia[]> = {
  podcast: SOURCES_PODCASTS,
  // Vidéos et lives partagent la liste SOURCES_VIDEOS, distinguées par `format`.
  video: SOURCES_VIDEOS.filter((s) => s.format === 'video'),
  live: SOURCES_VIDEOS.filter((s) => s.format === 'live'),
  dessin: SOURCES_DESSINS,
};
