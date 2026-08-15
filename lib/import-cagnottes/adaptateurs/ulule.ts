import {
  REQUETES_RECHERCHE,
  detecterThemes,
  detecterType,
  estExclu,
} from '@/lib/import-cagnottes/themes';
import type { CandidatCagnotte } from '@/lib/import-cagnottes/types';

/**
 * Adaptateur Ulule (demande Ben 2026-06-15). Ulule expose une API publique
 * JSON, SANS clé : `https://api.ulule.com/v1/search/projects?q=...`. On
 * interroge cette API pour chaque requête thématique, on ne garde que les
 * collectes EN COURS (`status='online'`, non terminées), et on les normalise.
 *
 * C'est une API stable (pas du scraping de mise en page) : c'est la source
 * la plus riche pour les livres et jeux militants et les projets écolos.
 */

const UA =
  'Mozilla/5.0 (compatible; MaintenantRevueDePresse/1.0; +https://maintenant-le-mouvement.org)';
const BASE = 'https://api.ulule.com/v1/search/projects';

/** Forme partielle d'un projet Ulule (champs qu'on consomme). */
interface ProjetUlule {
  absolute_url?: string;
  name_fr?: string;
  name_en?: string;
  subtitle_fr?: string;
  subtitle_en?: string;
  owner?: { name?: string; username?: string; absolute_url?: string };
  goal?: number;
  amount_raised?: number;
  currency?: string;
  percent?: number;
  date_end?: string;
  status?: string;
  finished?: boolean;
  image?: string;
  main_image?: { full?: string };
  main_tag?: { slug?: string };
  id?: number;
}

/** Organisateur lisible : champ explicite, sinon segment de l'URL profil. */
function organisateurDepuisOwner(owner: ProjetUlule['owner']): string | null {
  if (owner?.name !== undefined && owner.name !== '') return owner.name;
  if (owner?.username !== undefined && owner.username !== '') return owner.username;
  const m = owner?.absolute_url?.match(/\/users\/([^/]+)\/?$/);
  if (m?.[1] !== undefined) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  return null;
}

function enCentimes(montant: number | undefined): number | null {
  if (typeof montant !== 'number' || montant <= 0) return null;
  return Math.round(montant * 100);
}

function versCandidat(p: ProjetUlule, requete: string): CandidatCagnotte | null {
  const titre = (p.name_fr ?? p.name_en ?? '').trim();
  const url = p.absolute_url ?? '';
  if (titre === '' || !url.startsWith('http')) return null;
  if (p.status !== 'online' || p.finished === true) return null;

  const resume = (p.subtitle_fr ?? p.subtitle_en ?? '').trim() || null;
  const texte = `${titre} ${resume ?? ''}`;
  if (estExclu(texte)) return null; // marqueur d'extrême droite : écarté d'office.

  return {
    titre: titre.slice(0, 300),
    resume: resume !== null ? resume.slice(0, 2000) : null,
    organisateur: organisateurDepuisOwner(p.owner),
    plateforme: 'Ulule',
    source_url: url,
    objectif_centimes: enCentimes(p.goal),
    collecte_centimes: enCentimes(p.amount_raised),
    devise: p.currency ?? 'EUR',
    pourcentage: typeof p.percent === 'number' ? p.percent : null,
    echeance: p.date_end ?? null,
    vignette_url: p.image ?? p.main_image?.full ?? null,
    themes: detecterThemes(texte),
    type_collecte: detecterType(texte),
    metadata: { ulule_id: p.id ?? null, requete, main_tag: p.main_tag?.slug ?? null },
  };
}

async function chercher(requete: string, limite: number): Promise<CandidatCagnotte[]> {
  const url = `${BASE}?q=${encodeURIComponent(requete)}&lang=fr&limit=${limite}`;
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!r.ok) return [];
    const data = (await r.json()) as { projects?: ProjetUlule[] };
    return (data.projects ?? [])
      .map((p) => versCandidat(p, requete))
      .filter((c): c is CandidatCagnotte => c !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * Récolte les candidats Ulule pour toutes les requêtes thématiques.
 * `limiteParRequete` borne le nombre de projets examinés par requête.
 */
export async function recolterUlule(
  requetes: string[] = REQUETES_RECHERCHE,
  limiteParRequete = 20,
): Promise<CandidatCagnotte[]> {
  const lots = await Promise.all(requetes.map((q) => chercher(q, limiteParRequete)));
  return lots.flat();
}
