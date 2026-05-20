import {
  ajouterOrganisationPartenaireSchema,
  retirerOrganisationSchema,
} from '@/lib/validations/autres-moyens';
import { describe, expect, it } from 'vitest';

describe('ajouterOrganisationPartenaireSchema', () => {
  const base = {
    nom: 'Réseau Salariat',
    url: 'https://reseau-salariat.info',
  };

  it('accepte une organisation minimale', () => {
    expect(ajouterOrganisationPartenaireSchema.safeParse(base).success).toBe(true);
  });

  it('refuse une URL invalide', () => {
    expect(
      ajouterOrganisationPartenaireSchema.safeParse({ ...base, url: 'pas une url' }).success,
    ).toBe(false);
  });

  it('refuse une catégorie avec espaces', () => {
    expect(
      ajouterOrganisationPartenaireSchema.safeParse({
        ...base,
        categorie_slug: 'pas valide',
      }).success,
    ).toBe(false);
  });

  it('accepte une catégorie slug', () => {
    expect(
      ajouterOrganisationPartenaireSchema.safeParse({
        ...base,
        categorie_slug: 'environnement',
      }).success,
    ).toBe(true);
  });
});

describe('retirerOrganisationSchema', () => {
  it('refuse une raison trop courte', () => {
    expect(
      retirerOrganisationSchema.safeParse({
        organisation_id: '11111111-1111-4111-8111-111111111111',
        raison_retrait: 'court',
      }).success,
    ).toBe(false);
  });

  it('accepte une raison valide', () => {
    expect(
      retirerOrganisationSchema.safeParse({
        organisation_id: '11111111-1111-4111-8111-111111111111',
        raison_retrait: 'Organisation devenue problématique (déclarations controversées).',
      }).success,
    ).toBe(true);
  });
});
