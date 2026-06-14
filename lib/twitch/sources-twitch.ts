/**
 * Chaînes Twitch engagées suivies pour la rubrique « Lives » (demande Ben
 * 2026-06-14). Orientation : gauche radicale / révolutionnaire, féminisme
 * intersectionnel, antiracisme/décolonial, LGBTQIA+/queer/trans, élu·es à la
 * gauche de la gauche, médias indépendants engagés.
 *
 * Liste validée via l'API Twitch (helix/users) : seuls les handles existants
 * sont conservés ici. Élargissable au fil de l'eau (un ajout = une ligne).
 * Proposition complète et sourcée : `docs/sources-twitch-lives-proposition.md`.
 */

export interface SourceTwitch {
  /** Identifiant de la chaîne (login Twitch). */
  handle: string;
  /** Nom affiché (colonne `provenance_externe` du media). */
  nom: string;
  /** Famille thématique (documentation). */
  theme: string;
  /** Langue (code ISO). */
  langue: string;
}

export const SOURCES_TWITCH: SourceTwitch[] = [
  // Politiques à la gauche de la gauche (FR)
  { handle: 'jlmelenchon', nom: 'Jean-Luc Mélenchon', theme: 'Politique', langue: 'fr' },
  { handle: 'la_france_insoumise', nom: 'La France Insoumise', theme: 'Politique', langue: 'fr' },
  { handle: 'aleaument', nom: 'Antoine Léaument', theme: 'Politique', langue: 'fr' },
  { handle: 'deputwitch', nom: 'Députwitch', theme: 'Politique', langue: 'fr' },
  { handle: 'louisboyard', nom: 'Louis Boyard', theme: 'Politique', langue: 'fr' },
  {
    handle: 'revolutionpermanente',
    nom: 'Révolution Permanente',
    theme: 'Révolutionnaire',
    langue: 'fr',
  },
  // Gauche radicale / marxiste (FR)
  { handle: '7krone', nom: '7Krone', theme: 'Gauche radicale', langue: 'fr' },
  { handle: 'bolchegeek', nom: 'Bolchegeek', theme: 'Gauche radicale', langue: 'fr' },
  { handle: 'usul2000', nom: 'Usul', theme: 'Gauche radicale', langue: 'fr' },
  { handle: 'ostpolitik', nom: 'Ostpolitik', theme: 'Gauche radicale', langue: 'fr' },
  { handle: 'mdeetz', nom: 'mDeetz', theme: 'Gauche radicale', langue: 'fr' },
  { handle: 'kaleevision', nom: 'KaLee Vision', theme: 'Gauche radicale', langue: 'fr' },
  { handle: 'ribodanslasauce', nom: 'RiboDansLaSauce', theme: 'Gauche radicale', langue: 'fr' },
  // Antifascisme (FR)
  { handle: 'clemovitch', nom: 'Clément Viktorovitch', theme: 'Antifascisme', langue: 'fr' },
  { handle: 'emmodem', nom: 'Emmodem', theme: 'Antifascisme', langue: 'fr' },
  { handle: 'rivenzi', nom: 'Rivenzi', theme: 'Antifascisme', langue: 'fr' },
  { handle: 'dofla', nom: 'Dofla', theme: 'Antifascisme', langue: 'fr' },
  // Antiracisme / décolonial (FR)
  { handle: 'histoires_crepues', nom: 'Histoires Crépues', theme: 'Antiracisme', langue: 'fr' },
  { handle: 'lemwakast', nom: 'LeMwakast', theme: 'Antiracisme', langue: 'fr' },
  { handle: 'rebeudeter', nom: 'RebeuDeter', theme: 'Antiracisme', langue: 'fr' },
  // Afroféminisme & représentation (FR)
  { handle: 'afrogameuses', nom: 'Afrogameuses', theme: 'Afroféminisme', langue: 'fr' },
  { handle: 'invincible_jane', nom: 'Jennifer Lufau', theme: 'Afroféminisme', langue: 'fr' },
  { handle: 'mamapaprika', nom: 'Mamapaprika', theme: 'Afroféminisme', langue: 'fr' },
  { handle: 'sasskeh_', nom: 'Sasskeh', theme: 'Afroféminisme', langue: 'fr' },
  { handle: 'choublak', nom: 'Choublak', theme: 'Afroféminisme', langue: 'fr' },
  { handle: 'delfea', nom: 'Delfea', theme: 'Afroféminisme', langue: 'fr' },
  { handle: 'sherazland', nom: 'Sheraz', theme: 'Antiracisme', langue: 'fr' },
  // Féminisme intersectionnel (FR)
  { handle: 'modiiie', nom: 'Modiie', theme: 'Féminisme', langue: 'fr' },
  { handle: 'turbojoul', nom: 'Joul', theme: 'Féminisme', langue: 'fr' },
  { handle: 'nat_ali', nom: 'Nat’Ali', theme: 'Féminisme', langue: 'fr' },
  { handle: 'lixiviatio', nom: 'Lixiviatio', theme: 'Féminisme', langue: 'fr' },
  { handle: 'neivee', nom: 'Neivee', theme: 'Féminisme', langue: 'fr' },
  { handle: 'ettacause', nom: 'Et Ta Cause', theme: 'Féminisme', langue: 'fr' },
  { handle: 'aayley', nom: 'Aayley', theme: 'Féminisme', langue: 'fr' },
  { handle: 'lynamess', nom: 'Lynamess', theme: 'Féminisme', langue: 'fr' },
  { handle: 'lywen__', nom: 'Lywen', theme: 'Féminisme', langue: 'fr' },
  { handle: 'caitaezul', nom: 'Caitaezul', theme: 'Féminisme', langue: 'fr' },
  // LGBTQIA+ / queer & anti-validisme (FR)
  { handle: 'vazek_tomi', nom: 'Vazek', theme: 'LGBTQIA+', langue: 'fr' },
  { handle: 'avamind', nom: 'Ava Mind', theme: 'LGBTQIA+', langue: 'fr' },
  { handle: 'clavtv', nom: 'ClavTV', theme: 'Anti-validisme', langue: 'fr' },
  // Vulgarisation politique & médias engagés (FR)
  { handle: 'jeanmassiet', nom: 'Jean Massiet', theme: 'Vulgarisation politique', langue: 'fr' },
  {
    handle: 'hugoauperchoir',
    nom: 'Hugo Au Perchoir',
    theme: 'Vulgarisation politique',
    langue: 'fr',
  },
  {
    handle: 'zulzorander',
    nom: 'Zul’Zorander',
    theme: 'Gauche / littérature engagée',
    langue: 'fr',
  },
  { handle: 'julienpaniac', nom: 'Julien Paniac', theme: 'Anti-sexisme', langue: 'fr' },
  { handle: 'lhumanitefr', nom: 'L’Humanité', theme: 'Média engagé', langue: 'fr' },
  { handle: 'blastinfo', nom: 'Blast', theme: 'Média engagé', langue: 'fr' },
  // International — gauche radicale (EN)
  { handle: 'hasanabi', nom: 'Hasan Piker', theme: 'International', langue: 'en' },
  { handle: 'frogan', nom: 'Frogan', theme: 'International', langue: 'en' },
  { handle: 'dylanburnstv', nom: 'Dylan Burns', theme: 'International', langue: 'en' },
  { handle: 'gremloe', nom: 'Gremloe', theme: 'International', langue: 'en' },
  { handle: 'central_committee', nom: 'Central Committee', theme: 'International', langue: 'en' },
  { handle: 'themajorityreport', nom: 'The Majority Report', theme: 'International', langue: 'en' },
  { handle: 'theserfstv', nom: 'The Serfs', theme: 'International', langue: 'en' },
  { handle: 'aoc', nom: 'Alexandria Ocasio-Cortez', theme: 'Politiques', langue: 'en' },
  { handle: 'ilhanmn', nom: 'Ilhan Omar', theme: 'Politiques', langue: 'en' },
  // International — gauche radicale (ES)
  { handle: 'facudiazt', nom: 'Facu Díaz', theme: 'International', langue: 'es' },
  { handle: 'somosgelatina_', nom: 'Gelatina', theme: 'International', langue: 'es' },
  { handle: 'srevolution', nom: 'Marina Lobo', theme: 'International', langue: 'es' },
  { handle: 'omaranguita', nom: 'Omar Anguita', theme: 'International', langue: 'es' },
  // Ajouts thématiques 2026-06-14 (décolonial, antifascisme, autogestion /
  // caisses de grève, économistes/altermondialisme), validés via helix/users.
  {
    handle: 'parolesdhonneur_',
    nom: 'Paroles d’Honneur',
    theme: 'Décolonial / anti-impérialisme',
    langue: 'fr',
  },
  { handle: 'valeuranarchiste', nom: 'Valeur Anarchiste', theme: 'Antifascisme', langue: 'fr' },
  { handle: 'la_cgt', nom: 'La CGT', theme: 'Luttes sociales / syndical', langue: 'fr' },
  {
    handle: 'misterjday',
    nom: 'MisterJDay',
    theme: 'Luttes sociales / caisses de grève',
    langue: 'fr',
  },
  {
    handle: 'quineapple',
    nom: 'Quineapple',
    theme: 'Luttes sociales / anticapitalisme',
    langue: 'fr',
  },
  {
    handle: 'danycaligula',
    nom: 'Dany Caligula',
    theme: 'Philosophie politique de gauche',
    langue: 'fr',
  },
  { handle: 'simonpuech', nom: 'Simon Puech', theme: 'Vulgarisation engagée', langue: 'fr' },
  {
    handle: 'canardrefractaire',
    nom: 'Le Canard Réfractaire',
    theme: 'Média engagé',
    langue: 'fr',
  },
  { handle: 'mikefrompa', nom: 'Mike from PA', theme: 'International', langue: 'en' },
];
