import {
  creerLocationMutualiseeSchema,
  engagementLocationSchema,
  montantAttenduEngagement,
  slugifierTitreLocation,
} from '@/lib/location-mutualisee-validation';
import { describe, expect, it } from 'vitest';

const BASE_VALIDE = {
  titre: 'Bus Paris–Lyon pour la manif du 1er mai',
  description:
    'On loue un bus de 50 places auprès de la société CarTour pour rejoindre la manif nationale du 1er mai à Lyon. Départ samedi 6h, retour dimanche 22h.',
  type_location: 'transport_bus' as const,
  prestataire: 'CarTour SARL, 12 rue de la République, Paris',
  lieu: 'Départ Place de la Bastille, Paris 11e',
  date_evenement: '2026-05-01T06:00:00Z',
  date_limite_engagement: '2026-04-25T23:59:00Z',
  montant_total_centimes: 200000, // 2000 €
  nb_parts_max: 50,
  prix_par_part_centimes: 4000, // 40 € / part
  avertissement_juridique_accepte: true as const,
};

describe('creerLocationMutualiseeSchema', () => {
  it('accepte une location minimale valide', () => {
    expect(creerLocationMutualiseeSchema.safeParse(BASE_VALIDE).success).toBe(true);
  });

  it('refuse si avertissement juridique non accepté', () => {
    const r = creerLocationMutualiseeSchema.safeParse({
      ...BASE_VALIDE,
      avertissement_juridique_accepte: false,
    });
    expect(r.success).toBe(false);
  });

  it('refuse si date limite après date événement', () => {
    const r = creerLocationMutualiseeSchema.safeParse({
      ...BASE_VALIDE,
      date_limite_engagement: '2026-05-15T00:00:00Z',
      date_evenement: '2026-05-01T06:00:00Z',
    });
    expect(r.success).toBe(false);
  });

  it('accepte date limite égale à date événement', () => {
    const r = creerLocationMutualiseeSchema.safeParse({
      ...BASE_VALIDE,
      date_limite_engagement: '2026-05-01T06:00:00Z',
      date_evenement: '2026-05-01T06:00:00Z',
    });
    expect(r.success).toBe(true);
  });

  it('refuse si capacité × prix < montant total', () => {
    const r = creerLocationMutualiseeSchema.safeParse({
      ...BASE_VALIDE,
      nb_parts_max: 10,
      prix_par_part_centimes: 1000, // 10 parts × 10 € = 100 € < 2000 €
    });
    expect(r.success).toBe(false);
  });

  it('refuse si nb_parts_max > 1000', () => {
    const r = creerLocationMutualiseeSchema.safeParse({
      ...BASE_VALIDE,
      nb_parts_max: 1001,
    });
    expect(r.success).toBe(false);
  });

  it('refuse un titre trop court', () => {
    const r = creerLocationMutualiseeSchema.safeParse({ ...BASE_VALIDE, titre: 'ab' });
    expect(r.success).toBe(false);
  });

  it('refuse un type_location hors liste fermée', () => {
    const r = creerLocationMutualiseeSchema.safeParse({
      ...BASE_VALIDE,
      type_location: 'voiture_particuliere',
    });
    expect(r.success).toBe(false);
  });
});

describe('engagementLocationSchema', () => {
  it('accepte un engagement minimal', () => {
    const r = engagementLocationSchema.safeParse({
      location_id: '8e3a6c0e-9f12-4b8f-9d4a-3b1c2d4e5f6a',
      nb_parts: 2,
    });
    expect(r.success).toBe(true);
  });

  it('refuse nb_parts < 1', () => {
    const r = engagementLocationSchema.safeParse({
      location_id: '8e3a6c0e-9f12-4b8f-9d4a-3b1c2d4e5f6a',
      nb_parts: 0,
    });
    expect(r.success).toBe(false);
  });

  it('refuse nb_parts > 100', () => {
    const r = engagementLocationSchema.safeParse({
      location_id: '8e3a6c0e-9f12-4b8f-9d4a-3b1c2d4e5f6a',
      nb_parts: 101,
    });
    expect(r.success).toBe(false);
  });
});

describe('slugifierTitreLocation', () => {
  it('produit un slug propre depuis un titre', () => {
    const slug = slugifierTitreLocation('Bus Paris–Lyon pour la manif du 1er mai');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug.length).toBeLessThanOrEqual(80);
  });
});

describe('montantAttenduEngagement', () => {
  it('calcule nb_parts × prix_par_part', () => {
    expect(montantAttenduEngagement(3, 4000)).toBe(12000);
    expect(montantAttenduEngagement(1, 4000)).toBe(4000);
    expect(montantAttenduEngagement(50, 4000)).toBe(200000);
  });
});
