/**
 * Projection pure : `droit_admin` V1 → liste de `droit` V2 à insérer
 * lors du backfill V2.1.3 (cycle V2).
 *
 * Extrait du script `scripts/backfill-droits.ts` pour être testable sans
 * mock Supabase. La projection est déterministe : pour une ligne donnée
 * de `droit_admin` (avec son `niveau`, son `scope_commune_id`, son
 * `perimetre_onglet`), on génère 1..N lignes dans la table V2 `droit`.
 *
 * Règles (cf. `lib/droit-presets.ts` pour la table de mapping) :
 *
 * - `national` → 1 ligne avec `type_droit = admin_total_plateforme`,
 *   cible globale (NULL/NULL). Marqueur de l'admin total (MD5 V2).
 * - `admin` → preset V1 `admin` (16 droits atomiques), cible globale.
 * - `moderation` → preset V1 `moderation` (2 droits, + `moderer_a_priori`
 *   si `perimetre_onglet` inclut « petitions » ou est NULL), cible
 *   globale.
 * - `tresorerie` → preset V1 `tresorerie` (3 droits), cible globale.
 * - `animation` → preset V1 `animation` (3 droits), cible =
 *   `(espace_commune, scope_commune_id)`. Le scope est obligatoire en V1.
 * - `dpd` → preset V1 `dpd` (2 droits), cible globale.
 *
 * On ne projette QUE les lignes actives (`retire_le IS NULL`). Les droits
 * retirés en V1 ne sont pas réintroduits en V2 — le passé reste figé
 * dans `droit_admin`.
 */

import type { TypeCibleDroit, TypeDroit } from './droit';
import { type PresetV1, droitsPourPresetV1 } from './droit-presets';

export interface LigneDroitAdminSource {
  id: string;
  personne_id: string;
  niveau: PresetV1;
  scope_commune_id: string | null;
  perimetre_onglet: readonly string[] | null;
  accorde_par: string | null;
  accorde_le: string;
  retire_le: string | null;
}

export interface LigneDroitCible {
  personne_id: string;
  type_droit: TypeDroit;
  cible_type: TypeCibleDroit | null;
  cible_id: string | null;
  accorde_par: string | null;
  accorde_le: string;
  metadata: Record<string, unknown>;
}

export function projeterDroitAdminEnDroits(ligne: LigneDroitAdminSource): LigneDroitCible[] {
  // Les lignes V1 retirées ne sont pas réintroduites en V2.
  if (ligne.retire_le !== null) {
    return [];
  }

  const droits = droitsPourPresetV1(ligne.niveau, {
    perimetreOnglet: ligne.perimetre_onglet,
  });

  // Pour le niveau `animation`, la cible est la commune scopée. Pour les
  // autres niveaux, la cible est globale (NULL/NULL).
  let cibleType: TypeCibleDroit | null;
  let cibleId: string | null;
  if (ligne.niveau === 'animation') {
    if (ligne.scope_commune_id === null) {
      // Cas anormal (la contrainte CHECK V1 garantit pourtant le contraire).
      // On préfère ne rien projeter plutôt que de poser un droit sans cible.
      return [];
    }
    cibleType = 'espace_commune';
    cibleId = ligne.scope_commune_id;
  } else {
    cibleType = null;
    cibleId = null;
  }

  return droits.map((typeDroit) => ({
    personne_id: ligne.personne_id,
    type_droit: typeDroit,
    cible_type: cibleType,
    cible_id: cibleId,
    accorde_par: ligne.accorde_par,
    accorde_le: ligne.accorde_le,
    metadata: {
      source: 'backfill_droit_admin_v1',
      droit_admin_id: ligne.id,
      preset_v1: ligne.niveau,
      ...(ligne.perimetre_onglet !== null && ligne.niveau === 'moderation'
        ? { perimetre_onglet: ligne.perimetre_onglet }
        : {}),
    },
  }));
}
