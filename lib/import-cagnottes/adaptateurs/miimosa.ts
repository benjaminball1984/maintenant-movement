import { detecterThemes, detecterType, estExclu } from '@/lib/import-cagnottes/themes';
import type { CandidatCagnotte } from '@/lib/import-cagnottes/types';

/**
 * Adaptateur MiiMOSA (demande Ben 2026-06-15 : « fais le scraping »).
 * MiiMOSA (agriculture paysanne, alimentation, transition) est une appli
 * Next.js : les projets sont embarqués en JSON structuré dans la balise
 * `__NEXT_DATA__` de la page de liste. On lit ce JSON (et NON le HTML de
 * mise en page) : c'est le scraping le moins fragile possible, mais cela
 * reste un scraping (si MiiMOSA change la forme de ses données de page,
 * l'extraction renverra [] sans casser le reste — la modération a priori
 * et le filtre par thème restent les garde-fous).
 */

const UA =
  'Mozilla/5.0 (compatible; MaintenantRevueDePresse/1.0; +https://maintenant-le-mouvement.org)';
const BASE = 'https://www.miimosa.com/fr/projects';

interface CollectMiimosa {
  type?: string;
  goalAmount?: number;
  collectedAmount?: number;
  progress?: number;
  endsAt?: string;
}
interface ProjetMiimosa {
  title?: string;
  slug?: string;
  shortDescription?: string;
  userFullName?: string;
  state?: string;
  labels?: Array<{ value?: string }>;
  collect?: CollectMiimosa;
  imageFileName?: string;
  highImageFileName?: string;
  projectId?: number;
}

function enCentimes(montant: number | undefined): number | null {
  if (typeof montant !== 'number' || montant <= 0) return null;
  return Math.round(montant * 100);
}

function versCandidat(p: ProjetMiimosa): CandidatCagnotte | null {
  const titre = (p.title ?? '').trim();
  const slug = p.slug ?? '';
  if (titre === '' || slug === '') return null;
  // On ne garde que les collectes de DON publiées (MiiMOSA fait aussi du prêt).
  if (p.state !== 'published' || (p.collect?.type !== undefined && p.collect.type !== 'donation')) {
    return null;
  }

  const resume = (p.shortDescription ?? '').trim() || null;
  const libelles = (p.labels ?? []).map((l) => l.value ?? '').join(' ');
  const texte = `${titre} ${resume ?? ''} ${libelles}`;
  if (estExclu(texte)) return null;

  return {
    titre: titre.slice(0, 300),
    resume: resume !== null ? resume.slice(0, 2000) : null,
    organisateur: (p.userFullName ?? '').trim() || null,
    plateforme: 'MiiMOSA',
    source_url: `https://www.miimosa.com/fr/projects/${slug}`,
    objectif_centimes: enCentimes(p.collect?.goalAmount),
    collecte_centimes: enCentimes(p.collect?.collectedAmount),
    devise: 'EUR',
    pourcentage: typeof p.collect?.progress === 'number' ? p.collect.progress : null,
    echeance: p.collect?.endsAt ?? null,
    vignette_url: p.highImageFileName ?? p.imageFileName ?? null,
    themes: detecterThemes(texte),
    type_collecte: detecterType(texte),
    metadata: { miimosa_id: p.projectId ?? null },
  };
}

/** Lit une page de liste MiiMOSA et en extrait les projets (via __NEXT_DATA__). */
async function lirePage(page: number): Promise<ProjetMiimosa[]> {
  const url = page <= 1 ? BASE : `${BASE}?page=${page}`;
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    if (!r.ok) return [];
    const html = await r.text();
    const m = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
    );
    if (m?.[1] === undefined) return [];
    const data = JSON.parse(m[1]) as { props?: { pageProps?: { projects?: ProjetMiimosa[] } } };
    return data.props?.pageProps?.projects ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * Récolte les candidats MiiMOSA sur les `nbPages` premières pages de la liste
 * (8 projets par page). Le filtre par thème (côté curation) écarte ensuite les
 * projets non militants (ex. un bistrot sans dimension agroécologique).
 */
export async function recolterMiimosa(nbPages = 6): Promise<CandidatCagnotte[]> {
  const pages = Array.from({ length: nbPages }, (_, i) => i + 1);
  const lots = await Promise.all(pages.map((p) => lirePage(p)));
  return lots
    .flat()
    .map((p) => versCandidat(p))
    .filter((c): c is CandidatCagnotte => c !== null);
}
