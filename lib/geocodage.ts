/**
 * Géocodage des lieux en texte libre via Nominatim, le géocodeur public
 * d'OpenStreetMap (https://nominatim.org/release-docs/latest/api/Search/).
 *
 * Contexte (revue 2026-06-12, demande Lilou/Ben) : les mobilisations
 * importées de L'Agenda Militant n'ont qu'un champ `lieu` en texte libre
 * (« Bourse du travail, 3 rue du Château d'Eau, 75010 Paris ») et donc
 * aucun point sur la carte unifiée. Ce module transforme ce texte en
 * coordonnées (latitude, longitude).
 *
 * Politique d'usage Nominatim respectée :
 *   - User-Agent identifiant (obligatoire, sinon 403) ;
 *   - volume très faible : l'import quotidien traite au plus quelques
 *     événements, avec 2 tentatives de requête maximum chacun.
 */

/** Identité envoyée à Nominatim (politique d'usage : UA obligatoire). */
const USER_AGENT = 'MaintenantMovement/1.0 (benjamin.ball@maintenant-le-mouvement.org)';

const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/search';

export interface PositionGeocodee {
  latitude: number;
  longitude: number;
}

/**
 * Voies reconnues pour repérer le début d'une adresse postale dans un lieu
 * écrit d'un seul tenant (« Sud Education 30 bis Rue des Boulets 75011
 * Paris ») : on cherche « numéro + type de voie ».
 */
const REGEX_DEBUT_ADRESSE =
  /\b\d+\s*(?:bis|ter)?\s*,?\s+(?:rue|avenue|boulevard|all[ée]e|place|quai|chemin|impasse|passage|cours|route|villa|square)\b/i;

/**
 * Construit les requêtes candidates pour un lieu en texte libre, de la plus
 * précise à la plus large :
 *   1. le lieu complet tel quel ;
 *   2. sans son premier segment quand il y a des virgules : les lieux
 *      militants commencent souvent par un NOM de salle (« Bourse du
 *      travail, ... ») que Nominatim ne connaît pas, alors que l'adresse
 *      postale qui suit se géocode bien ;
 *   3. l'adresse à partir du « numéro + type de voie » quand le lieu est
 *      écrit sans virgules (même problème de nom de salle en préfixe) ;
 *   4. code postal + ville, en dernier recours : un point au centre de la
 *      ville plutôt que pas de point du tout.
 *
 * Fonction pure (testée unitairement).
 */
export function candidatsGeocodage(lieu: string): string[] {
  const nettoye = lieu.replace(/\s+/g, ' ').trim();
  if (nettoye.length < 3) return [];

  const candidats: string[] = [nettoye];
  const segments = nettoye
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');

  if (segments.length > 1) {
    candidats.push(segments.slice(1).join(', '));
  }

  const debutAdresse = nettoye.search(REGEX_DEBUT_ADRESSE);
  if (debutAdresse > 0) {
    candidats.push(nettoye.slice(debutAdresse));
  }

  const codePostal = nettoye.match(/\b(\d{5})\b/)?.[1];
  if (codePostal !== undefined) {
    // La ville suit en général le code postal ; sinon on retombe sur le
    // dernier segment (forme « ..., 93100, Montreuil, France »).
    const apresCp = nettoye
      .slice(nettoye.indexOf(codePostal) + codePostal.length)
      .replace(/^[\s,]+/, '')
      .replace(/,?\s*France$/i, '')
      .trim();
    const dernierSegment = (segments.at(-1) ?? '').replace(/\b\d{5}\b/, '').trim();
    const ville = apresCp !== '' ? apresCp.split(',')[0] : dernierSegment;
    candidats.push(ville === undefined || ville === '' ? codePostal : `${codePostal} ${ville}`);
  } else if (segments.length > 1) {
    const dernierSegment = segments.at(-1) ?? '';
    if (dernierSegment !== '' && !/^France$/i.test(dernierSegment)) {
      candidats.push(dernierSegment);
    }
  }

  return [...new Set(candidats.filter((c) => c.length >= 3))];
}

/** Forme minimale d'une réponse Nominatim (champs réellement consommés). */
interface ReponseNominatim {
  lat?: string;
  lon?: string;
}

/**
 * Géocode un lieu français en essayant successivement les requêtes
 * candidates (au plus `maxEssais`, pour borner les sous-requêtes quand on
 * tourne dans le Worker Cloudflare). Retourne `null` si rien ne matche :
 * l'appelant décide quoi faire d'un lieu sans coordonnées (sur la carte,
 * il n'apparaît simplement pas).
 */
export async function geocoderLieuFr(
  lieu: string,
  maxEssais = 2,
): Promise<PositionGeocodee | null> {
  for (const candidat of candidatsGeocodage(lieu).slice(0, maxEssais)) {
    try {
      const url = `${URL_NOMINATIM}?format=jsonv2&limit=1&countrycodes=fr&q=${encodeURIComponent(candidat)}`;
      const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!r.ok) continue;
      const resultats = (await r.json()) as ReponseNominatim[];
      const premier = resultats[0];
      if (premier?.lat === undefined || premier.lon === undefined) continue;
      const latitude = Number.parseFloat(premier.lat);
      const longitude = Number.parseFloat(premier.lon);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) continue;
      return { latitude, longitude };
    } catch {
      // Réseau indisponible ou réponse illisible : on tente le candidat
      // suivant, puis l'appelant retombe sur « pas de coordonnées ».
    }
  }
  return null;
}
