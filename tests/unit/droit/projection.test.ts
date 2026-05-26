import { PRESETS_V1 } from '@/lib/droit-presets';
import { type LigneDroitAdminSource, projeterDroitAdminEnDroits } from '@/lib/droit-projection';
import { describe, expect, it } from 'vitest';

/**
 * Tests de la projection V1→V2 utilisée par `scripts/backfill-droits.ts`
 * (cycle V2 V2.1.3). Couvre les 6 niveaux V1 + le scope commune obligatoire
 * pour `animation` + le périmètre onglet pour `moderation` + l'ignorance
 * des droits déjà retirés.
 */

const PERSONNE_ID = '11111111-1111-1111-1111-111111111111';
const COMMUNE_ID = '22222222-2222-2222-2222-222222222222';
const ACCORDANT_ID = '33333333-3333-3333-3333-333333333333';
const DATE = '2026-05-01T10:00:00Z';

function ligneV1(overrides: Partial<LigneDroitAdminSource>): LigneDroitAdminSource {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    personne_id: PERSONNE_ID,
    niveau: 'admin',
    scope_commune_id: null,
    perimetre_onglet: null,
    accorde_par: ACCORDANT_ID,
    accorde_le: DATE,
    retire_le: null,
    ...overrides,
  };
}

describe('projeterDroitAdminEnDroits', () => {
  it('national → 1 ligne admin_total_plateforme, cible globale', () => {
    const resultat = projeterDroitAdminEnDroits(ligneV1({ niveau: 'national' }));
    expect(resultat).toHaveLength(1);
    expect(resultat[0]).toMatchObject({
      personne_id: PERSONNE_ID,
      type_droit: 'admin_total_plateforme',
      cible_type: null,
      cible_id: null,
      accorde_par: ACCORDANT_ID,
      accorde_le: DATE,
    });
    expect(resultat[0]?.metadata).toMatchObject({
      source: 'backfill_droit_admin_v1',
      preset_v1: 'national',
    });
  });

  it('admin → 17 droits (preset_v1.admin), cible globale', () => {
    const resultat = projeterDroitAdminEnDroits(ligneV1({ niveau: 'admin' }));
    expect(resultat).toHaveLength(PRESETS_V1.admin.length);
    expect(new Set(resultat.map((d) => d.type_droit))).toEqual(new Set(PRESETS_V1.admin));
    for (const droit of resultat) {
      expect(droit.cible_type).toBeNull();
      expect(droit.cible_id).toBeNull();
    }
  });

  it('moderation sans perimetre_onglet → ajoute moderer_a_priori (défaut petitions)', () => {
    const resultat = projeterDroitAdminEnDroits(ligneV1({ niveau: 'moderation' }));
    const types = new Set(resultat.map((d) => d.type_droit));
    expect(types).toContain('moderer_a_posteriori');
    expect(types).toContain('traiter_signalement');
    expect(types).toContain('moderer_a_priori');
  });

  it('moderation avec perimetre_onglet incluant petitions → ajoute moderer_a_priori', () => {
    const resultat = projeterDroitAdminEnDroits(
      ligneV1({ niveau: 'moderation', perimetre_onglet: ['petitions', 'mobilisations'] }),
    );
    const types = new Set(resultat.map((d) => d.type_droit));
    expect(types).toContain('moderer_a_priori');
  });

  it('moderation avec perimetre_onglet excluant petitions → pas de moderer_a_priori', () => {
    const resultat = projeterDroitAdminEnDroits(
      ligneV1({ niveau: 'moderation', perimetre_onglet: ['mobilisations', 'cagnottes'] }),
    );
    const types = new Set(resultat.map((d) => d.type_droit));
    expect(types).not.toContain('moderer_a_priori');
    expect(types).toContain('moderer_a_posteriori');
    expect(types).toContain('traiter_signalement');
  });

  it('tresorerie → 3 droits trésorier, cible globale', () => {
    const resultat = projeterDroitAdminEnDroits(ligneV1({ niveau: 'tresorerie' }));
    expect(new Set(resultat.map((d) => d.type_droit))).toEqual(new Set(PRESETS_V1.tresorerie));
    expect(resultat[0]?.cible_type).toBeNull();
  });

  it('animation → 3 droits, cible = (espace_commune, scope_commune_id)', () => {
    const resultat = projeterDroitAdminEnDroits(
      ligneV1({ niveau: 'animation', scope_commune_id: COMMUNE_ID }),
    );
    expect(new Set(resultat.map((d) => d.type_droit))).toEqual(new Set(PRESETS_V1.animation));
    for (const droit of resultat) {
      expect(droit.cible_type).toBe('espace_commune');
      expect(droit.cible_id).toBe(COMMUNE_ID);
    }
  });

  it('animation sans scope_commune_id → ne projette rien (anomalie)', () => {
    const resultat = projeterDroitAdminEnDroits(
      ligneV1({ niveau: 'animation', scope_commune_id: null }),
    );
    expect(resultat).toEqual([]);
  });

  it('dpd → 2 droits, cible globale', () => {
    const resultat = projeterDroitAdminEnDroits(ligneV1({ niveau: 'dpd' }));
    expect(new Set(resultat.map((d) => d.type_droit))).toEqual(new Set(PRESETS_V1.dpd));
  });

  it('ligne déjà retirée → ne projette rien (passé figé)', () => {
    const resultat = projeterDroitAdminEnDroits(
      ligneV1({ niveau: 'admin', retire_le: '2026-04-01T00:00:00Z' }),
    );
    expect(resultat).toEqual([]);
  });

  it('propage accorde_par et accorde_le sur toutes les lignes produites', () => {
    const resultat = projeterDroitAdminEnDroits(ligneV1({ niveau: 'admin' }));
    for (const droit of resultat) {
      expect(droit.accorde_par).toBe(ACCORDANT_ID);
      expect(droit.accorde_le).toBe(DATE);
    }
  });

  it('métadonnées contiennent source, droit_admin_id, preset_v1', () => {
    const resultat = projeterDroitAdminEnDroits(ligneV1({ niveau: 'tresorerie', id: 'AAA-AAA' }));
    expect(resultat[0]?.metadata).toMatchObject({
      source: 'backfill_droit_admin_v1',
      droit_admin_id: 'AAA-AAA',
      preset_v1: 'tresorerie',
    });
  });
});
