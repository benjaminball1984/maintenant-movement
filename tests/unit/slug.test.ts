import { slugifier, slugifierAvecSuffixeTemps } from '@/lib/slug';
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
