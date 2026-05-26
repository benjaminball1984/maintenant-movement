import {
  coordonneesValides,
  creerGroupeEntraideSchema,
  slugValide,
  slugifierNomGroupe,
} from '@/lib/groupe-entraide-local-validation';
import { describe, expect, it } from 'vitest';

const BASE_VALIDE = {
  nom: 'Maraude solidaire Lyon 7',
  description_courte:
    'Distribution de repas chauds tous les mardis soirs auprès des personnes sans abri.',
  description:
    'Le groupe organise une maraude hebdomadaire dans le 7e arrondissement de Lyon. On collecte de la nourriture, on prépare les repas en commun, on distribue, on discute.',
  zone_geographique: 'Lyon 7e arrondissement',
};

describe('creerGroupeEntraideSchema', () => {
  it('accepte un groupe minimal valide', () => {
    const r = creerGroupeEntraideSchema.safeParse(BASE_VALIDE);
    expect(r.success).toBe(true);
  });

  it('refuse un nom trop court', () => {
    const r = creerGroupeEntraideSchema.safeParse({ ...BASE_VALIDE, nom: 'ab' });
    expect(r.success).toBe(false);
  });

  it('refuse une description courte trop courte', () => {
    const r = creerGroupeEntraideSchema.safeParse({
      ...BASE_VALIDE,
      description_courte: 'court',
    });
    expect(r.success).toBe(false);
  });

  it('refuse une zone géographique vide', () => {
    const r = creerGroupeEntraideSchema.safeParse({ ...BASE_VALIDE, zone_geographique: '' });
    expect(r.success).toBe(false);
  });

  it('accepte des coordonnées valides', () => {
    const r = creerGroupeEntraideSchema.safeParse({
      ...BASE_VALIDE,
      latitude: 45.7484,
      longitude: 4.8467,
    });
    expect(r.success).toBe(true);
  });

  it('refuse une latitude hors bornes', () => {
    const r = creerGroupeEntraideSchema.safeParse({
      ...BASE_VALIDE,
      latitude: 91,
      longitude: 0,
    });
    expect(r.success).toBe(false);
  });
});

describe('slugifierNomGroupe', () => {
  it('transforme un nom en slug propre', () => {
    expect(slugifierNomGroupe('Maraude solidaire Lyon 7')).toBe('maraude-solidaire-lyon-7');
  });
  it('supprime les accents', () => {
    expect(slugifierNomGroupe('Médée — Crète')).toBe('medee-crete');
  });
  it('borne à 80 caractères', () => {
    const long = 'a'.repeat(200);
    expect(slugifierNomGroupe(long).length).toBeLessThanOrEqual(80);
  });
  it('produit un slug conforme au CHECK SQL', () => {
    const slug = slugifierNomGroupe('Maraude solidaire Lyon 7');
    expect(slugValide(slug)).toBe(true);
  });
});

describe('slugValide', () => {
  it('accepte un slug bien formé', () => {
    expect(slugValide('maraude-lyon-7')).toBe(true);
  });
  it('refuse un slug avec majuscules', () => {
    expect(slugValide('Maraude-Lyon-7')).toBe(false);
  });
  it('refuse un slug avec espaces', () => {
    expect(slugValide('maraude lyon 7')).toBe(false);
  });
  it('refuse un slug trop court', () => {
    expect(slugValide('ab')).toBe(false);
  });
  it('refuse un slug qui commence par un tiret', () => {
    expect(slugValide('-maraude')).toBe(false);
  });
});

describe('coordonneesValides', () => {
  it('accepte les deux null', () => {
    expect(coordonneesValides(null, null)).toBe(true);
    expect(coordonneesValides(undefined, undefined)).toBe(true);
  });
  it('refuse latitude sans longitude', () => {
    expect(coordonneesValides(45, null)).toBe(false);
  });
  it('refuse longitude sans latitude', () => {
    expect(coordonneesValides(null, 4)).toBe(false);
  });
  it('accepte deux valeurs dans les bornes', () => {
    expect(coordonneesValides(45.7, 4.8)).toBe(true);
  });
  it('refuse hors bornes', () => {
    expect(coordonneesValides(91, 0)).toBe(false);
    expect(coordonneesValides(0, 181)).toBe(false);
  });
});
