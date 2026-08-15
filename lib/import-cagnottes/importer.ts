import { recolterMiimosa } from '@/lib/import-cagnottes/adaptateurs/miimosa';
import { recolterUlule } from '@/lib/import-cagnottes/adaptateurs/ulule';
import { curer } from '@/lib/import-cagnottes/curation';
import type { CandidatCagnotte } from '@/lib/import-cagnottes/types';

/**
 * Orchestration de l'import des collectes externes (demande Ben 2026-06-15).
 *
 * Flux : récolter (adaptateurs) → curer (dédup + pertinence) → écarter ce qui
 * est DÉJÀ en base (anti-doublon ET anti-re-proposition d'un candidat déjà
 * rejeté) → insérer le reste en `statut='propose'` (file de modération a
 * priori, INVISIBLE du public tant qu'un·e admin n'a pas validé).
 *
 * Idempotent par `source_url`. Best-effort : un adaptateur en échec renvoie
 * simplement [] (dégradation propre).
 */

export interface RapportImportCagnottes {
  examines: number;
  retenus: number;
  dejaConnus: number;
  crees: number;
  message?: string;
}

/** URLs déjà en base, TOUS statuts confondus (anti-re-proposition). */
async function urlsExistantes(urlSb: string, cle: string): Promise<Set<string>> {
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const r = await fetch(`${urlSb}/rest/v1/cagnotte_externe?select=source_url&limit=20000`, {
    headers: entetes,
  });
  if (!r.ok) return new Set();
  const lignes = (await r.json()) as Array<{ source_url: string | null }>;
  return new Set(lignes.map((l) => l.source_url).filter((u): u is string => u !== null));
}

function versLigne(c: CandidatCagnotte): Record<string, unknown> {
  return {
    titre: c.titre,
    resume: c.resume,
    organisateur: c.organisateur,
    plateforme: c.plateforme,
    source_url: c.source_url,
    objectif_centimes: c.objectif_centimes,
    collecte_centimes: c.collecte_centimes,
    devise: c.devise,
    pourcentage: c.pourcentage,
    echeance: c.echeance,
    vignette_url: c.vignette_url,
    themes: c.themes,
    type_collecte: c.type_collecte,
    metadata: c.metadata,
    statut: 'propose',
  };
}

/**
 * Importe de nouveaux candidats dans la file de propositions.
 * `maxNouvelles` borne le nombre d'insertions par exécution (ne pas noyer la
 * modération).
 */
export async function importerCagnottesExternes(
  urlSb: string,
  cle: string,
  maxNouvelles = 40,
): Promise<RapportImportCagnottes> {
  // Plusieurs sources en parallèle ; une source en échec renvoie [] (l'import
  // continue avec les autres). Ajouter une plateforme = ajouter un adaptateur ici.
  const lots = await Promise.all([recolterUlule(), recolterMiimosa()]);
  const bruts = lots.flat();
  const cures = curer(bruts);

  const connus = await urlsExistantes(urlSb, cle);
  const nouveaux = cures.filter((c) => !connus.has(c.source_url)).slice(0, maxNouvelles);

  if (nouveaux.length === 0) {
    return {
      examines: bruts.length,
      retenus: cures.length,
      dejaConnus: cures.length,
      crees: 0,
      message: 'aucune nouvelle collecte à proposer',
    };
  }

  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const r = await fetch(`${urlSb}/rest/v1/cagnotte_externe`, {
    method: 'POST',
    headers: { ...entetes, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(nouveaux.map(versLigne)),
  });
  if (!r.ok) {
    return {
      examines: bruts.length,
      retenus: cures.length,
      dejaConnus: cures.length - nouveaux.length,
      crees: 0,
      message: `insert ${r.status} ${(await r.text()).slice(0, 200)}`,
    };
  }
  return {
    examines: bruts.length,
    retenus: cures.length,
    dejaConnus: cures.length - nouveaux.length,
    crees: nouveaux.length,
  };
}
