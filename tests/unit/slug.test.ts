import { estSlugValide, slugifier, slugifierAvecSuffixeTemps } from '@/lib/slug';
import { describe, expect, it } from 'vitest';

describe('slugifier', () => {
  it('met en minuscules', () => {
    expect(slugifier('Assemblée Confédérale')).toBe('assemblee-confederale');
  });

  it('retire les diacritiques', () => {
    expect(slugifier('Édition n°1 — automne')).toBe('edition-n-1-automne');
  });

  it('remplace les espaces et signes de ponctuation par des tirets', () => {
    expect(slugifier('Une décision : à prendre !')).toBe('une-decision-a-prendre');
  });

  it('retire les tirets en début et fin', () => {
    expect(slugifier('--- début et fin ---')).toBe('debut-et-fin');
  });

  it('limite la longueur', () => {
    const long = 'a'.repeat(200);
    expect(slugifier(long).length).toBeLessThanOrEqual(80);
    expect(slugifier(long, 20).length).toBeLessThanOrEqual(20);
  });

  it('retourne une chaîne vide si rien d’alphanumérique', () => {
    expect(slugifier('— !!! ###')).toBe('');
  });

  it('gère les chiffres', () => {
    expect(slugifier('Numéro 42 — réunion')).toBe('numero-42-reunion');
  });
});

describe('estSlugValide', () => {
  it('accepte un slug simple', () => {
    expect(estSlugValide('mon-titre')).toBe(true);
    expect(estSlugValide('a')).toBe(true);
    expect(estSlugValide('un-deux-trois-quatre')).toBe(true);
  });

  it('refuse une chaîne vide ou trop longue', () => {
    expect(estSlugValide('')).toBe(false);
    expect(estSlugValide('a'.repeat(81))).toBe(false);
  });

  it('refuse les majuscules et accents', () => {
    expect(estSlugValide('MonTitre')).toBe(false);
    expect(estSlugValide('été')).toBe(false);
  });

  it('refuse les espaces, ponctuations, _', () => {
    expect(estSlugValide('mon titre')).toBe(false);
    expect(estSlugValide('mon_titre')).toBe(false);
    expect(estSlugValide('mon.titre')).toBe(false);
  });

  it('refuse tirets multiples consécutifs', () => {
    expect(estSlugValide('mon--titre')).toBe(false);
  });

  it('refuse tiret en début ou fin', () => {
    expect(estSlugValide('-mon-titre')).toBe(false);
    expect(estSlugValide('mon-titre-')).toBe(false);
  });

  it('accepte chiffres', () => {
    expect(estSlugValide('edition-2026-05')).toBe(true);
    expect(estSlugValide('42')).toBe(true);
  });

  it('le résultat de slugifier est toujours valide', () => {
    const test = (s: string) => {
      const slug = slugifier(s);
      if (slug !== '') expect(estSlugValide(slug)).toBe(true);
    };
    test('Bonjour le monde !');
    test('Édition spéciale n°1');
    test('Une décision : à prendre');
  });
});

describe('slugifierAvecSuffixeTemps', () => {
  it('produit un slug avec un suffixe de 4 caractères', () => {
    const r = slugifierAvecSuffixeTemps('Salle générale');
    expect(r).toMatch(/^salle-generale-[a-z0-9]{4}$/);
  });

  it('garantit que le résultat ne dépasse pas maxLongueur', () => {
    const r = slugifierAvecSuffixeTemps('a'.repeat(200), 80);
    expect(r.length).toBeLessThanOrEqual(80);
  });
});
