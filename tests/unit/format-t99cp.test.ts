import { formaterT99CP } from '@/lib/format-t99cp';
import { describe, expect, it } from 'vitest';

describe('formaterT99CP', () => {
  it('retourne chaîne vide pour null/undefined', () => {
    expect(formaterT99CP(null)).toBe('');
    expect(formaterT99CP(undefined)).toBe('');
  });

  it('retourne chaîne vide pour string vide ou "0"', () => {
    expect(formaterT99CP('')).toBe('');
    expect(formaterT99CP('0')).toBe('');
  });

  it('formate 1 T99CP entier', () => {
    expect(formaterT99CP('1000000000000000000')).toBe('1 99-coin');
  });

  it('formate 1,5 T99CP', () => {
    expect(formaterT99CP('1500000000000000000')).toBe('1,5 99-coin');
  });

  it('tronque les décimales au-delà de 4 chiffres', () => {
    // 1.123456789012345678 → on garde 4 décimales : 1,1234
    expect(formaterT99CP('1123456789012345678')).toBe('1,1234 99-coin');
  });

  it('formate un gros entier', () => {
    expect(formaterT99CP('1000000000000000000000')).toBe('1000 99-coin');
  });

  it('retire les zéros de fin sur les décimales', () => {
    // 1.5000 → 1,5 (pas 1,5000)
    expect(formaterT99CP('1500000000000000000')).toBe('1,5 99-coin');
    // 1.0001 → 1,0001
    expect(formaterT99CP('1000100000000000000')).toBe('1,0001 99-coin');
  });

  it('utilise le suffixe personnalisé', () => {
    expect(formaterT99CP('1000000000000000000', '99c')).toBe('1 99c');
    expect(formaterT99CP('1500000000000000000', 'T99CP')).toBe('1,5 T99CP');
  });

  it('retourne chaîne vide pour string non numérique', () => {
    expect(formaterT99CP('abc')).toBe('');
    expect(formaterT99CP('1.5')).toBe(''); // BigInt rejette les décimales
  });

  it('gère les très grands nombres sans perte', () => {
    // 10^21 = 1000 T99CP
    expect(formaterT99CP('1000000000000000000000')).toBe('1000 99-coin');
    // 10^36 = 10^18 T99CP (énorme)
    expect(formaterT99CP(`1${'0'.repeat(36)}`)).toBe('1000000000000000000 99-coin');
  });
});
