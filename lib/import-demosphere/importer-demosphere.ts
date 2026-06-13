import { geocoderLieuFr } from '@/lib/geocodage';
import { type SiteDemosphere, baseDemosphere } from '@/lib/import-demosphere/sources-demosphere';
import type { TypeMobilisation } from '@/lib/mobilisations/type-mobilisation';

/**
 * Import des mobilisations depuis le réseau Demosphère (agendas militants
 * locaux, demande Ben 2026-06-13). MÊMES RÈGLES que l'Agenda Militant
 * Indépendant (`lib/import-agenda`) :
 *   1. UNIQUEMENT les événements à venir (jamais de passé).
 *   2. JAMAIS d'événement sans véritable affiche (image obligatoire).
 *   3. Idempotent (un événement déjà importé est ignoré) et borné par
 *      exécution pour rester sous la limite de sous-requêtes du Worker.
 *
 * Technique (cf. cartographie 2026-06-13) :
 *   - `/event-list-json?selectStartTime=...&place__latitude=true&...` :
 *     liste exhaustive des événements à venir, avec GPS et lieu (mais sans
 *     image ni description) ;
 *   - `/rv/<id>` : page de l'événement, contient un bloc JSON-LD
 *     schema.org Event avec `description` ET `image` (l'affiche).
 * Le GPS vient de la liste (pas besoin de géocoder ; repli géocodage si
 * absent). Une affiche absente = pas de champ `image` = événement écarté.
 */

const USER_AGENT =
  'Mozilla/5.0 (compatible; MaintenantRevueDePresse/1.0; +https://maintenant-le-mouvement.org)';
const TAILLE_MAX_IMAGE_OCTETS = 6_000_000;

/** Compte créateur des imports (Ben), identique à l'Agenda Militant. */
const CREATEURICE_ID = 'c5b169de-92ed-41d3-bdfd-47820663bade';

export interface RapportImportDemosphere {
  crees: string[];
  ignores: number;
  ecartes: string[];
  erreurs: string[];
}

function decoderEntites(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è');
}

const REGEX_DIACRITIQUES = new RegExp(
  `[${String.fromCodePoint(0x0300)}-${String.fromCodePoint(0x036f)}]`,
  'g',
);

/** Devine le type de mobilisation depuis le texte (repris de l'Agenda Militant). */
export function devinerTypeMobilisation(titre: string, description: string): TypeMobilisation {
  const t = `${titre} ${description.slice(0, 400)}`
    .toLowerCase()
    .normalize('NFD')
    .replace(REGEX_DIACRITIQUES, '');
  if (/blocage|greve|piquet/.test(t)) return 'blocage_greve';
  if (/village|occupation|campement|zad/.test(t)) return 'occupation_village';
  if (/arpentage|atelier|formation|cours de|portes ouvertes|groupe de lecture/.test(t))
    return 'formation_atelier';
  if (/assemblee|\bag\b|reunion|pleniere/.test(t)) return 'assemblee_reunion';
  if (
    /projection|debat|conference|rencontre|theatre|exposition|forum|discussion|spectacle|presentation du livre/.test(
      t,
    )
  )
    return 'projection_debat';
  if (/manif(?!este)|marche\b|cortege|pride/.test(t)) return 'manifestation';
  if (/rassemblement|concentration/.test(t)) return 'rassemblement';
  if (/concert|fete|festival|cantine|\bbal\b|soiree/.test(t)) return 'concert_fete';
  if (/mobilisation/.test(t)) return 'rassemblement';
  return 'autre';
}

/** Slug à partir du titre (translittéré, borné, suffixé pour l'unicité). */
function slugifier(titre: string, suffixe: string): string {
  const base = titre
    .toLowerCase()
    .normalize('NFD')
    .replace(REGEX_DIACRITIQUES, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/, '');
  return `${base}-${suffixe}`;
}

export interface EvenementDemosphere {
  id: number;
  titre: string;
  debutMs: number;
  lieu: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  lien: string;
}

/**
 * Liste des événements À VENIR d'un site, via `/event-list-json`. GPS et
 * lieu inclus ; ni image ni description (récupérées ensuite sur `/rv/id`).
 */
export async function listerEvenementsSite(
  site: SiteDemosphere,
  maintenantSec: number,
  finSec: number,
): Promise<EvenementDemosphere[]> {
  const base = baseDemosphere(site.cle);
  const url = `${base}/event-list-json?selectStartTime=${maintenantSec}&endTime=${finSec}&url=true&place__latitude=true&place__longitude=true&place__address=true`;
  const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = (await r.json()) as {
    events?: Array<{
      id: number;
      title?: string;
      startTime?: number;
      place__latitude?: number;
      place__longitude?: number;
      place__address?: string;
      place__city__name?: string;
      url?: string;
    }>;
  };
  const evenements: EvenementDemosphere[] = [];
  for (const e of data.events ?? []) {
    if (typeof e.id !== 'number' || typeof e.startTime !== 'number') continue;
    const ville = (e.place__city__name ?? '').replace(/\s*\d{5}.*$/, '').trim();
    const adresse = (e.place__address ?? '').split('\n')[0]?.trim() ?? '';
    const lat =
      typeof e.place__latitude === 'number' && e.place__latitude !== 0 ? e.place__latitude : null;
    const lng =
      typeof e.place__longitude === 'number' && e.place__longitude !== 0
        ? e.place__longitude
        : null;
    evenements.push({
      id: e.id,
      titre: decoderEntites((e.title ?? '').replace(/<[^>]+>/g, '').trim()),
      debutMs: e.startTime * 1000,
      lieu: [adresse, ville].filter((s) => s !== '').join(', '),
      ville,
      latitude: lat,
      longitude: lng,
      lien: e.url !== undefined ? `${base}${e.url}` : `${base}/rv/${e.id}`,
    });
  }
  return evenements;
}

export interface DetailEvenement {
  description: string;
  imageUrl: string | null;
}

/**
 * Détail d'un événement via le JSON-LD schema.org de sa page `/rv/<id>` :
 * description et URL de l'affiche (champ `image`). Repli `og:image`.
 */
export async function detailEvenement(lien: string): Promise<DetailEvenement | null> {
  try {
    const r = await fetch(lien, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' } });
    if (!r.ok) return null;
    const html = await r.text();
    const blocLd = html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
    );
    let description = '';
    let imageUrl: string | null = null;
    if (blocLd?.[1] !== undefined) {
      try {
        const ld = JSON.parse(blocLd[1].trim()) as { description?: unknown; image?: unknown };
        if (typeof ld.description === 'string') description = ld.description.trim();
        if (typeof ld.image === 'string' && ld.image.startsWith('http')) imageUrl = ld.image;
      } catch {
        // JSON-LD illisible : on tombe sur les replis ci-dessous.
      }
    }
    if (imageUrl === null) {
      const og =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (og?.[1]?.startsWith('http')) imageUrl = og[1];
    }
    return { description, imageUrl };
  } catch {
    return null;
  }
}

export type ResultatInsertion = { ok: true; slug: string } | { ok: false; raison: string };

/** Liens Demosphère déjà importés (idempotence), tous sites confondus. */
export async function liensDemosphereExistants(urlSb: string, cle: string): Promise<Set<string>> {
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const r = await fetch(
    `${urlSb}/rest/v1/mobilisation?select=description&description=ilike.*demosphere.net*&limit=3000`,
    { headers: entetes },
  );
  if (!r.ok) return new Set();
  const lignes = (await r.json()) as Array<{ description: string | null }>;
  const liens = new Set<string>();
  for (const l of lignes) {
    const m = (l.description ?? '').match(/https?:\/\/[a-z0-9]+\.demosphere\.net\/rv\/\d+/gi);
    for (const u of m ?? []) liens.add(u);
  }
  return liens;
}

/** Télécharge l'affiche, l'insère dans le bucket public `media`. */
async function copierImage(
  urlImage: string,
  cheminBucket: string,
  urlSb: string,
  cle: string,
): Promise<string | null> {
  try {
    const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
    const rImg = await fetch(urlImage, { headers: { 'User-Agent': USER_AGENT } });
    const typeMime = rImg.headers.get('content-type') ?? '';
    if (!rImg.ok || !typeMime.startsWith('image/')) return null;
    const octets = new Uint8Array(await rImg.arrayBuffer());
    if (octets.length === 0 || octets.length > TAILLE_MAX_IMAGE_OCTETS) return null;
    const rUp = await fetch(`${urlSb}/storage/v1/object/media/${cheminBucket}`, {
      method: 'POST',
      headers: { ...entetes, 'Content-Type': typeMime, 'x-upsert': 'true' },
      body: octets,
    });
    return rUp.ok ? `${urlSb}/storage/v1/object/public/media/${cheminBucket}` : null;
  } catch {
    return null;
  }
}

/**
 * Import borné d'un site : récolte la liste, et pour chaque événement non
 * encore importé, récupère l'affiche (obligatoire) et insère la
 * mobilisation. S'arrête à `maxNouveaux` insertions.
 */
export async function importerSiteDemosphere(
  site: SiteDemosphere,
  urlSb: string,
  cle: string,
  liensExistants: Set<string>,
  maxNouveaux: number,
): Promise<RapportImportDemosphere> {
  const rapport: RapportImportDemosphere = { crees: [], ignores: 0, ecartes: [], erreurs: [] };
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const maintenantSec = Math.floor(Date.now() / 1000);
  const finSec = maintenantSec + 365 * 24 * 3600;

  let evenements: EvenementDemosphere[];
  try {
    evenements = await listerEvenementsSite(site, maintenantSec, finSec);
  } catch (e) {
    rapport.erreurs.push(`${site.cle} : liste en échec (${e instanceof Error ? e.message : e})`);
    return rapport;
  }

  for (const ev of evenements) {
    if (rapport.crees.length >= maxNouveaux) break;
    if (liensExistants.has(ev.lien)) {
      rapport.ignores += 1;
      continue;
    }
    if (ev.titre === '') {
      rapport.ecartes.push(`${ev.lien} : sans titre`);
      continue;
    }

    const detail = await detailEvenement(ev.lien);
    if (detail === null || detail.imageUrl === null) {
      // Règle DURE : pas d'affiche → écarté.
      rapport.ecartes.push(`${ev.lien} : pas d'affiche`);
      continue;
    }

    const slug = slugifier(ev.titre, `ds${ev.id}`);
    const cheminBucket = `mobilisations/demosphere/${slug}.jpg`;
    const imageBucket = await copierImage(detail.imageUrl, cheminBucket, urlSb, cle);
    if (imageBucket === null) {
      rapport.ecartes.push(`${ev.lien} : affiche non copiable`);
      continue;
    }

    // GPS de la liste, sinon repli géocodage sur le lieu.
    let lat = ev.latitude;
    let lng = ev.longitude;
    if ((lat === null || lng === null) && ev.lieu !== '') {
      const pos = await geocoderLieuFr(ev.lieu, 2);
      lat = pos?.latitude ?? null;
      lng = pos?.longitude ?? null;
    }

    // La description porte le lien source (idempotence + « voir la source »).
    const descriptionBase = detail.description !== '' ? detail.description : ev.titre;
    const description = `${descriptionBase}\n\nSource : ${ev.lien} (${site.nom}, Démosphère)`;
    const debutIso = new Date(ev.debutMs).toISOString();

    const rIns = await fetch(`${urlSb}/rest/v1/mobilisation`, {
      method: 'POST',
      headers: { ...entetes, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify([
        {
          slug,
          titre: ev.titre.slice(0, 200),
          description,
          lieu: ev.lieu === '' ? ev.ville || 'France' : ev.lieu,
          date_debut: debutIso,
          date_fin: debutIso,
          type_mobilisation: devinerTypeMobilisation(ev.titre, descriptionBase),
          image_url: imageBucket,
          createurice_id: CREATEURICE_ID,
          latitude: lat,
          longitude: lng,
        },
      ]),
    });
    if (!rIns.ok) {
      rapport.erreurs.push(`${slug} : insert ${rIns.status} ${await rIns.text()}`);
      continue;
    }
    liensExistants.add(ev.lien);
    rapport.crees.push(slug);
  }

  return rapport;
}

/**
 * Import sur l'ensemble des sites Demosphère France. `maxParSite` borne
 * le nombre de nouvelles mobilisations par site et par exécution.
 */
export async function importerTousLesSites(
  sites: SiteDemosphere[],
  urlSb: string,
  cle: string,
  maxParSite: number,
): Promise<Record<string, RapportImportDemosphere>> {
  const liens = await liensDemosphereExistants(urlSb, cle);
  const rapports: Record<string, RapportImportDemosphere> = {};
  for (const site of sites) {
    rapports[site.cle] = await importerSiteDemosphere(site, urlSb, cle, liens, maxParSite);
  }
  return rapports;
}
