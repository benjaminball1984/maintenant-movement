import { formaterMembres } from '@/lib/compter-membres';
import { describe, expect, it } from 'vitest';

describe('formaterMembres', () => {
  it('renvoie « Aucun membre » pour 0', () => {
    expect(formaterMembres(0)).toBe('Aucun membre');
  });

  it('renvoie « 1 membre » pour 1', () => {
    expect(formaterMembres(1)).toBe('1 membre');
  });

  it('renvoie « N membres » pour N ≥ 2', () => {
    expect(formaterMembres(2)).toBe('2 membres');
    expect(formaterMembres(42)).toBe('42 membres');
  });

  it('formate les milliers en français', () => {
    // Intl.NumberFormat fr-FR utilise espace insécable comme séparateur.
    const r = formaterMembres(1234);
    expect(r).toMatch(/^1\s?234 membres$/);
  });
});
