import { slugifierTitre } from '@/lib/validations/petition';
import { describe, expect, it } from 'vitest';

/**
 * Tests du slugifieur de titres (chantier 3.1).
 *
 * Doit produire un slug URL-safe respectant la regex SQL :
 *   ^[a-z0-9]+(-[a-z0-9]+)*$
 * (cf. contrainte `petition_slug_format` dans la migration 012).
 */
describe('slugifierTitre', () => {
  it('retire les diacritiques', () => {
    expect(slugifierTitre('Pétition à élu·e')).toBe('petition-a-elu-e');
  });

  it('met en minuscules et joint les mots avec des tirets', () => {
    expect(slugifierTitre('Mon Super Titre')).toBe('mon-super-titre');
  });

  it('regroupe les espaces multiples en un seul tiret', () => {
    expect(slugifierTitre('Trop   d’espaces')).toBe('trop-d-espaces');
  });

  it('rabote les tirets en début et fin', () => {
    expect(slugifierTitre('--bizarre--')).toBe('bizarre');
  });

  it('limite à 80 caractères', () => {
    const long = 'a'.repeat(200);
    expect(slugifierTitre(long).length).toBeLessThanOrEqual(80);
  });

  it('retire les symboles non alphanumériques', () => {
    expect(slugifierTitre('Train de nuit ?!')).toBe('train-de-nuit');
  });

  it('produit un slug conforme à la regex SQL', () => {
    const slug = slugifierTitre('Pour le retour des trains de nuit en Auvergne !!!');
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('renvoie chaîne vide pour un titre composé uniquement de symboles', () => {
    expect(slugifierTitre('!!! ???')).toBe('');
  });
});
