import { NUMERO_UNIFIE_REGEX, estNumeroUnifieValide } from '@/lib/profil/unifie';
import { describe, expect, it } from 'vitest';

/**
 * Tests du format du numéro de profil unifié (chantier 13.3-E).
 *
 * Le format doit rester aligné sur la contrainte SQL `profil_unifie_numero_format`
 * de la migration 038 : « M » suivi de 7 lettres majuscules A-Z.
 *   regex : ^M[A-Z]{7}$
 */
describe('estNumeroUnifieValide', () => {
  it('accepte « M » + 7 lettres majuscules', () => {
    expect(estNumeroUnifieValide('MABCDEFG')).toBe(true);
    expect(estNumeroUnifieValide('MZZZZZZZ')).toBe(true);
    expect(estNumeroUnifieValide('MQWERTYU')).toBe(true);
  });

  it('refuse un mauvais préfixe', () => {
    expect(estNumeroUnifieValide('AABCDEFG')).toBe(false);
    expect(estNumeroUnifieValide('mABCDEFG')).toBe(false);
  });

  it('refuse une longueur incorrecte', () => {
    expect(estNumeroUnifieValide('MABCDEF')).toBe(false); // 6 lettres
    expect(estNumeroUnifieValide('MABCDEFGH')).toBe(false); // 8 lettres
    expect(estNumeroUnifieValide('M')).toBe(false);
  });

  it('refuse les minuscules, chiffres et symboles', () => {
    expect(estNumeroUnifieValide('Mabcdefg')).toBe(false);
    expect(estNumeroUnifieValide('MABC1EFG')).toBe(false);
    expect(estNumeroUnifieValide('MABC-EFG')).toBe(false);
    expect(estNumeroUnifieValide('MABCDÉFG')).toBe(false);
  });

  it('refuse les chaînes vides ou avec espaces', () => {
    expect(estNumeroUnifieValide('')).toBe(false);
    expect(estNumeroUnifieValide('M ABCDEF')).toBe(false);
    expect(estNumeroUnifieValide(' MABCDEFG')).toBe(false);
  });

  it('la regex exportée est ancrée (pas de match partiel)', () => {
    expect(NUMERO_UNIFIE_REGEX.test('xxMABCDEFGxx')).toBe(false);
  });
});
