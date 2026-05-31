import {
  formaterEuros,
  formaterEurosDecimales,
  formaterEurosDepuisCentimes,
  formaterEurosEntier,
} from '@/lib/format-euros';
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

describe('formaterEurosEntier', () => {
  // Reproduit exactement le formatteur inline { maximumFractionDigits: 0 }
  // qu'il remplace (compteurs/soldes admin, dashboard, jauge, adhésion).
  // On le prouve par comparaison directe sur des cas clés.
  const inline = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });

  it('est identique au formatteur Intl inline (entier, décimal, zéro, négatif)', () => {
    for (const v of [0, 1, 12, 12.5, 12.4, 1234, -5, 999999]) {
      expect(formaterEurosEntier(v)).toBe(inline.format(v));
    }
  });

  it('affiche un zéro explicite (et non une chaîne vide comme formaterEuros)', () => {
    expect(formaterEurosEntier(0)).toContain('0');
    expect(formaterEurosEntier(0)).not.toBe('');
  });

  it('arrondit à l’euro entier, sans décimale', () => {
    expect(formaterEurosEntier(12.5)).not.toMatch(/[.,]\d/);
  });
});

describe('formaterEurosDecimales', () => {
  // Reproduit exactement le défaut de la devise EUR (2 décimales fixes)
  // utilisé par les affichages comptables (trésorerie, dons, contributions).
  const inline = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });

  it('est identique au formatteur Intl inline (entier, décimal, zéro, négatif)', () => {
    for (const v of [0, 1, 12, 12.5, 12.567, 1234.5, -5, 999999.99]) {
      expect(formaterEurosDecimales(v)).toBe(inline.format(v));
    }
  });

  it('conserve toujours deux décimales, y compris pour un entier', () => {
    expect(formaterEurosDecimales(12)).toMatch(/12[.,]00/);
  });

  it('affiche « 0,00 € » pour zéro (et non une chaîne vide)', () => {
    expect(formaterEurosDecimales(0)).toMatch(/0[.,]00/);
    expect(formaterEurosDecimales(0)).not.toBe('');
  });
});
