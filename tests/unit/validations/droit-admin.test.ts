import {
  accorderDroitSchema,
  libelleNiveau,
  retirerDroitSchema,
} from '@/lib/validations/droit-admin';
import { describe, expect, it } from 'vitest';

/**
 * Tests des schémas Zod de gestion des droits d'administration
 * (console nationale). On vérifie surtout les contraintes croisées qui
 * reproduisent les CHECK SQL de la migration 008.
 */

const PERSONNE = '550e8400-e29b-41d4-a716-446655440000';
const COMMUNE = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

describe('accorderDroitSchema', () => {
  it('accepte un droit national simple', () => {
    const r = accorderDroitSchema.safeParse({ personne_id: PERSONNE, niveau: 'national' });
    expect(r.success).toBe(true);
  });

  it('accepte une modération avec onglets précis', () => {
    const r = accorderDroitSchema.safeParse({
      personne_id: PERSONNE,
      niveau: 'moderation',
      perimetre_onglet: ['petitions', 'cagnottes'],
    });
    expect(r.success).toBe(true);
  });

  it('accepte une modération sans onglet (tous les onglets)', () => {
    const r = accorderDroitSchema.safeParse({ personne_id: PERSONNE, niveau: 'moderation' });
    expect(r.success).toBe(true);
  });

  it('refuse une animation sans commune', () => {
    const r = accorderDroitSchema.safeParse({ personne_id: PERSONNE, niveau: 'animation' });
    expect(r.success).toBe(false);
  });

  it('accepte une animation avec commune', () => {
    const r = accorderDroitSchema.safeParse({
      personne_id: PERSONNE,
      niveau: 'animation',
      scope_commune_id: COMMUNE,
    });
    expect(r.success).toBe(true);
  });

  it('refuse une commune sur un niveau non-animation', () => {
    const r = accorderDroitSchema.safeParse({
      personne_id: PERSONNE,
      niveau: 'admin',
      scope_commune_id: COMMUNE,
    });
    expect(r.success).toBe(false);
  });

  it('refuse un périmètre d’onglets sur un niveau non-modération', () => {
    const r = accorderDroitSchema.safeParse({
      personne_id: PERSONNE,
      niveau: 'national',
      perimetre_onglet: ['petitions'],
    });
    expect(r.success).toBe(false);
  });

  it('refuse un onglet inconnu', () => {
    const r = accorderDroitSchema.safeParse({
      personne_id: PERSONNE,
      niveau: 'moderation',
      perimetre_onglet: ['inexistant'],
    });
    expect(r.success).toBe(false);
  });

  it('refuse un niveau inconnu', () => {
    const r = accorderDroitSchema.safeParse({ personne_id: PERSONNE, niveau: 'roi' });
    expect(r.success).toBe(false);
  });

  it('refuse un personne_id non-uuid', () => {
    const r = accorderDroitSchema.safeParse({ personne_id: 'pas-un-uuid', niveau: 'admin' });
    expect(r.success).toBe(false);
  });
});

describe('retirerDroitSchema', () => {
  it('accepte un identifiant valide', () => {
    expect(retirerDroitSchema.safeParse({ droit_id: PERSONNE }).success).toBe(true);
  });

  it('refuse un identifiant manquant', () => {
    expect(retirerDroitSchema.safeParse({}).success).toBe(false);
  });
});

describe('libelleNiveau', () => {
  it('renvoie le libellé lisible d’un niveau connu', () => {
    expect(libelleNiveau('dpd')).toBe('DPD');
  });
});
