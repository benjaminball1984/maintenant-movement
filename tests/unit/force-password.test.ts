import { evaluerForcePassword, libelleForcePassword } from '@/lib/force-password';
import { describe, expect, it } from 'vitest';

describe('evaluerForcePassword', () => {
  it('mot de passe vide → score 0, très faible', () => {
    const r = evaluerForcePassword('');
    expect(r.score).toBe(0);
    expect(r.niveau).toBe('tres_faible');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it('mot de passe court "abc" → faible', () => {
    const r = evaluerForcePassword('abc');
    expect(r.score).toBeLessThanOrEqual(2);
  });

  it('"password" → faible (long mais que minuscules)', () => {
    const r = evaluerForcePassword('password');
    expect(r.score).toBe(2); // +longueur 8, +minuscule
    expect(r.niveau).toBe('faible');
  });

  it('"Password1" → fort', () => {
    const r = evaluerForcePassword('Password1');
    expect(r.score).toBe(4); // longueur 8 + min + maj + chiffre
    expect(r.niveau).toBe('fort');
  });

  it('"Password1!" → fort', () => {
    const r = evaluerForcePassword('Password1!');
    expect(r.score).toBe(5);
    expect(r.niveau).toBe('fort');
  });

  it('"M@intenantPlus2026" → très fort', () => {
    const r = evaluerForcePassword('M@intenantPlus2026');
    expect(r.score).toBe(6);
    expect(r.niveau).toBe('tres_fort');
    expect(r.suggestions).toEqual([]);
  });

  it('suggestion "8 caractères" si trop court', () => {
    const r = evaluerForcePassword('Abc1!');
    expect(r.suggestions.some((s) => s.includes('8 caractères'))).toBe(true);
  });

  it('suggestion "minuscule" si absente', () => {
    const r = evaluerForcePassword('ABCDEFGH1!');
    expect(r.suggestions.some((s) => s.toLowerCase().includes('minuscule'))).toBe(true);
  });

  it('suggestion "majuscule" si absente', () => {
    const r = evaluerForcePassword('abcdefgh1!');
    expect(r.suggestions.some((s) => s.toLowerCase().includes('majuscule'))).toBe(true);
  });

  it('suggestion "chiffre" si absent', () => {
    const r = evaluerForcePassword('Abcdefgh!');
    expect(r.suggestions.some((s) => s.toLowerCase().includes('chiffre'))).toBe(true);
  });

  it('suggestion "spécial" si absent', () => {
    const r = evaluerForcePassword('Abcdefgh1');
    expect(r.suggestions.some((s) => s.toLowerCase().includes('spécial'))).toBe(true);
  });
});

describe('libelleForcePassword', () => {
  it('retourne libellé français pour chaque niveau', () => {
    expect(libelleForcePassword('tres_faible')).toBe('très faible');
    expect(libelleForcePassword('faible')).toBe('faible');
    expect(libelleForcePassword('moyen')).toBe('moyen');
    expect(libelleForcePassword('fort')).toBe('fort');
    expect(libelleForcePassword('tres_fort')).toBe('très fort');
  });
});
