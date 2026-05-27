import { formaterEuros, formaterEurosDepuisCentimes } from '@/lib/format-euros';
import { describe, expect, it } from 'vitest';

// Note : Intl.NumberFormat('fr-FR', currency: 'EUR') utilise une
// espace insécable étroite (U+202F) entre le nombre et le symbole €.
// On utilise donc des regex/toContain pour ne pas dépendre du caractère exact.

describe('formaterEurosDepuisCentimes', () => {
  it('retourne chaîne vide pour null', () => {
    expect(formaterEurosDepuisCentimes(null)).toBe('');
  });

  it('retourne chaîne vide pour undefined', () => {
    expect(formaterEurosDepuisCentimes(undefined)).toBe('');
  });

  it('retourne chaîne vide pour 0 et négatif', () => {
    expect(formaterEurosDepuisCentimes(0)).toBe('');
    expect(formaterEurosDepuisCentimes(-100)).toBe('');
  });

  it('formate un montant entier sans décimale', () => {
    const r = formaterEurosDepuisCentimes(1000); // 10 €
    expect(r).toContain('10');
    expect(r).toContain('€');
    expect(r).not.toMatch(/[.,]\d/);
  });

  it('formate un montant avec décimale', () => {
    const r = formaterEurosDepuisCentimes(1250); // 12,50 €
    expect(r).toContain('12');
    expect(r).toContain('50');
    expect(r).toContain('€');
  });

  it('formate un gros montant', () => {
    const r = formaterEurosDepuisCentimes(123456); // 1 234,56 €
    expect(r).toContain('234');
    expect(r).toContain('56');
    expect(r).toContain('€');
  });
});

describe('formaterEuros', () => {
  it('retourne chaîne vide pour null/undefined/0', () => {
    expect(formaterEuros(null)).toBe('');
    expect(formaterEuros(undefined)).toBe('');
    expect(formaterEuros(0)).toBe('');
  });

  it('formate un montant entier', () => {
    const r = formaterEuros(10);
    expect(r).toContain('10');
    expect(r).toContain('€');
  });

  it('formate un montant décimal', () => {
    const r = formaterEuros(12.5);
    expect(r).toContain('12');
    expect(r).toContain('50');
    expect(r).toContain('€');
  });

  it('arrondit au-delà de 2 décimales', () => {
    const r = formaterEuros(12.567);
    expect(r).toContain('57'); // arrondi à 12,57
  });
});
