import type { TypeMobilisation } from '@/lib/mobilisations/type-mobilisation';

/**
 * Import serveur des mobilisations depuis L'Agenda Militant Indépendant
 * (agendamilitant.org), version quotidienne du script de peuplement du
 * 2026-06-11. Règles DURES (décision Lilou/Ben) :
 *   1. UNIQUEMENT les événements à venir.
 *   2. JAMAIS d'événement passé.
 *   3. JAMAIS d'événement sans véritable affiche (les pages sans document
 *      image, ou avec un simple logo, sont écartées).
 *
 * Conçu pour tourner dans le Worker (cron quotidien via /api/cron/...) :
 *   - idempotent : un événement déjà importé (URL source présente dans une
 *     description, ou slug existant) est ignoré sans nouvelle requête ;
 *   - borné : au plus `maxNouveaux` événements traités par exécution pour
 *     rester sous la limite de sous-requêtes du Worker (le reste passera
 *     aux exécutions suivantes).
 */

const BASE = 'https://www.agendamilitant.org/';

/** Compte créateur des imports (Ben). */
const CREATEURICE_ID = 'c5b169de-92ed-41d3-bdfd-47820663bade';

const PAGES_HORS_AGENDA = new Set([
  'La-Charte-AMI.html',
  'Mentions-legales.html',
  'Nous-contacter.html',
  'Proposer-un-evenement.html',
]);

export interface RapportImportAgenda {
  crees: string[];
  ignores: number;
  ecartes: string[];
  erreurs: string[];
}

function decoderEntites(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\t ]+/g, ' ')
    .trim();
}

function typeDepuisTexte(t: string): TypeMobilisation | null {
  if (/blocage|gr[èe]ve\b|piquet/.test(t)) return 'blocage_greve';
  if (/village|occupation|campement|zad/.test(t)) return 'occupation_village';
  if (/arpentage|atelier|formation|cours de|portes ouvertes|groupe de lecture/.test(t))
    return 'formation_atelier';
  if (/assembl[ée]e|\bag\b|r[ée]union|pl[ée]ni[èe]re/.test(t)) return 'assemblee_reunion';
  if (
    /projection|d[ée]bat|conf[ée]rence|rencontre|th[ée][âa]tre|exposition|forum|discussion|lancement du livre|spectacle|pr[ée]sentation du livre/.test(
      t,
    )
  )
    return 'projection_debat';
  if (/manif(?!este)|marche\b|cort[èe]ge|pride/.test(t)) return 'manifestation';
  if (/rassemblement|concentration/.test(t)) return 'rassemblement';
  if (/concert|f[êe]te|festival|cantine|\bbal\b|soir[ée]e/.test(t)) return 'concert_fete';
  if (/caravane|tourn[ée]e/.test(t)) return 'manifestation';
  if (/mobilisation/.test(t)) return 'rassemblement';
  return null;
}

function devinerType(titre: string, description: string): TypeMobilisation {
  return (
    typeDepuisTexte(titre.toLowerCase()) ??
    typeDepuisTexte(description.slice(0, 400).toLowerCase()) ??
    'autre'
  );
}

// Plage Unicode des diacritiques combinants (mêmes bornes que le helper de
// lib/validations/mobilisation.ts : Biome refuse la classe littérale).
const REGEX_DIACRITIQUES = new RegExp(
  `[${String.fromCodePoint(0x0300)}-${String.fromCodePoint(0x036f)}]`,
  'g',
);

function slugifier(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(REGEX_DIACRITIQUES, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** Dimensions PNG/JPEG depuis les octets (sans dépendance). */
function dimensionsImage(buf: Uint8Array): { largeur: number; hauteur: number } | null {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { largeur: dv.getUint32(16), hauteur: dv.getUint32(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off < buf.length - 9) {
      if (buf[off] !== 0xff) break;
      const marqueur = buf[off + 1];
      const taille = dv.getUint16(off + 2);
      if (
        marqueur !== undefined &&
        marqueur >= 0xc0 &&
        marqueur <= 0xcf &&
        marqueur !== 0xc4 &&
        marqueur !== 0xc8
      ) {
        return { largeur: dv.getUint16(off + 7), hauteur: dv.getUint16(off + 5) };
      }
      off += 2 + taille;
    }
  }
  return null;
}

/** ISO UTC depuis date+heure Paris (heure d'été UTC+2 : agenda à court terme). */
function isoParis(date: string, heure: string | null): string {
  return new Date(`${date}T${heure ?? '12:00'}:00+02:00`).toISOString();
}

interface EvenementSource {
  lien: string;
  titre: string;
  lieu: string;
  dateDebut: string;
  heureDebut: string | null;
  dateFin: string | null;
  heureFin: string | null;
  description: string;
  afficheUrl: string | null;
}

async function lirePageEvenement(lien: string): Promise<EvenementSource | null> {
  const r = await fetch(`${BASE}${lien}`);
  if (!r.ok) return null;
  const html = await r.text();
  const mAtcb = html.match(/<div class="atcb"[^>]*>\s*(\{[\s\S]*?\})\s*<\/div>/);
  if (mAtcb === null || mAtcb[1] === undefined) return null;
  let atcb: Record<string, unknown>;
  try {
    atcb = JSON.parse(mAtcb[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (typeof atcb.startDate !== 'string') return null;

  const mAffiche = html.match(/(IMG\/(?:jpg|png|webp|gif)\/[^"'\s)]+)/);
  let description = decoderEntites(String(atcb.description ?? ''));
  description = description.replace(/^https?:\S+\s*/, '').trim();

  return {
    lien: `${BASE}${lien}`,
    titre: decoderEntites(String(atcb.name ?? '')),
    lieu: decoderEntites(String(atcb.location ?? '')),
    dateDebut: atcb.startDate,
    heureDebut: typeof atcb.startTime === 'string' ? atcb.startTime : null,
    dateFin: typeof atcb.endDate === 'string' ? atcb.endDate : null,
    heureFin: typeof atcb.endTime === 'string' ? atcb.endTime : null,
    description,
    afficheUrl: mAffiche ? `${BASE}${mAffiche[1]}` : null,
  };
}

/**
 * Lance l'import. `maxNouveaux` borne le nombre d'événements TRAITÉS
 * (pages détail réellement visitées) par exécution.
 */
export async function importerAgendaMilitant(maxNouveaux = 8): Promise<RapportImportAgenda> {
  const urlSb = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (urlSb === undefined || urlSb === '' || cle === undefined || cle === '') {
    return { crees: [], ignores: 0, ecartes: [], erreurs: ['Variables Supabase manquantes.'] };
  }
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const rapport: RapportImportAgenda = { crees: [], ignores: 0, ecartes: [], erreurs: [] };

  // 1. Sources déjà importées (URL AMI dans les descriptions) + slugs.
  const rExistantes = await fetch(
    `${urlSb}/rest/v1/mobilisation?select=slug,description&description=ilike.*agendamilitant.org*&limit=1000`,
    { headers: entetes },
  );
  const existantes = (await rExistantes.json()) as Array<{ slug: string; description: string }>;
  const sourcesImportees = new Set<string>();
  const slugsExistants = new Set<string>();
  for (const m of existantes) {
    slugsExistants.add(m.slug);
    const mUrl = m.description.match(/https:\/\/www\.agendamilitant\.org\/\S+\.html/);
    if (mUrl !== null) sourcesImportees.add(mUrl[0]);
  }

  // 2. Liens candidats depuis l'accueil.
  const accueil = await (await fetch(BASE)).text();
  const liens = [
    ...new Set(
      [...accueil.matchAll(/href="([A-Za-z0-9][^"/]*\.html)"/g)]
        .map((m) => m[1] as string)
        .filter((l) => !PAGES_HORS_AGENDA.has(l) && !sourcesImportees.has(`${BASE}${l}`)),
    ),
  ];

  const maintenant = new Date();
  let traites = 0;
  for (const lien of liens) {
    if (traites >= maxNouveaux) {
      rapport.ecartes.push(`budget atteint (${maxNouveaux}) : le reste passera demain`);
      break;
    }
    traites += 1;

    const ev = await lirePageEvenement(lien);
    if (ev === null) {
      rapport.ecartes.push(`${lien} : pas un événement`);
      continue;
    }
    if (/^annul/i.test(ev.titre)) {
      rapport.ecartes.push(`${lien} : annulé`);
      continue;
    }
    const debutIso = isoParis(ev.dateDebut, ev.heureDebut);
    if (Number.isNaN(new Date(debutIso).getTime()) || new Date(debutIso) <= maintenant) {
      rapport.ecartes.push(`${lien} : passé`);
      continue;
    }
    if (ev.afficheUrl === null) {
      rapport.ecartes.push(`${lien} : pas d'affiche`);
      continue;
    }
    const slug = slugifier(ev.titre);
    if (slugsExistants.has(slug)) {
      rapport.ignores += 1;
      continue;
    }

    const rImg = await fetch(ev.afficheUrl);
    if (!rImg.ok) {
      rapport.ecartes.push(`${lien} : affiche inaccessible`);
      continue;
    }
    const buf = new Uint8Array(await rImg.arrayBuffer());
    const dims = dimensionsImage(buf);
    if (dims === null || Math.min(dims.largeur, dims.hauteur) < 350 || buf.length < 20000) {
      rapport.ecartes.push(`${lien} : visuel trop petit (logo probable)`);
      continue;
    }
    if (buf.length > 4_500_000) {
      rapport.ecartes.push(`${lien} : affiche trop lourde pour le bucket, à traiter à la main`);
      continue;
    }

    const ext = ev.afficheUrl.includes('/png/') ? 'png' : 'jpg';
    const cheminBucket = `peuplement/mobilisations/${slug}.${ext}`;
    const rUp = await fetch(`${urlSb}/storage/v1/object/media/${cheminBucket}`, {
      method: 'POST',
      headers: {
        ...entetes,
        'Content-Type': ext === 'png' ? 'image/png' : 'image/jpeg',
        'x-upsert': 'true',
      },
      body: buf,
    });
    if (!rUp.ok) {
      rapport.erreurs.push(`${slug} : upload ${rUp.status}`);
      continue;
    }

    let description = ev.description;
    if (description.length > 2800) description = `${description.slice(0, 2800).trimEnd()}…`;
    description += `\n\nSource : L'Agenda Militant Indépendant : ${ev.lien}`;

    let finIso: string | null = null;
    if (ev.dateFin !== null && ev.heureFin !== null) {
      const candidate = isoParis(ev.dateFin, ev.heureFin);
      if (new Date(candidate).getTime() >= new Date(debutIso).getTime()) finIso = candidate;
    }

    const rIns = await fetch(`${urlSb}/rest/v1/mobilisation`, {
      method: 'POST',
      headers: { ...entetes, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify([
        {
          slug,
          titre: ev.titre,
          description,
          lieu: ev.lieu === '' ? 'Île-de-France' : ev.lieu,
          date_debut: debutIso,
          date_fin: finIso,
          type_mobilisation: devinerType(ev.titre, ev.description),
          image_url: `${urlSb}/storage/v1/object/public/media/${cheminBucket}`,
          createurice_id: CREATEURICE_ID,
        },
      ]),
    });
    if (!rIns.ok) {
      rapport.erreurs.push(`${slug} : insert ${rIns.status} ${await rIns.text()}`);
      continue;
    }
    slugsExistants.add(slug);
    rapport.crees.push(slug);
  }

  return rapport;
}
