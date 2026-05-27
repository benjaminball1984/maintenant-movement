import { avatarHsl, initialesPourAvatar } from '@/lib/avatar-couleur';
import { describe, expect, it } from 'vitest';

describe('avatarHsl', () => {
  it('format HSL valide', () => {
    expect(avatarHsl('alice')).toMatch(/^hsl\(\d{1,3}, 70%, 50%\)$/);
  });

  it('déterministe : même entrée → même couleur', () => {
    expect(avatarHsl('alice@example.com')).toBe(avatarHsl('alice@example.com'));
  });

  it('différentes entrées → différentes couleurs (en général)', () => {
    expect(avatarHsl('alice')).not.toBe(avatarHsl('bob'));
  });

  it('teinte dans [0, 360[', () => {
    for (const id of ['', 'a', 'abc', 'long-identifiant-test']) {
      const match = avatarHsl(id).match(/hsl\((\d+),/);
      const teinte = Number(match?.[1] ?? -1);
      expect(teinte).toBeGreaterThanOrEqual(0);
      expect(teinte).toBeLessThan(360);
    }
  });
});

describe('initialesPourAvatar', () => {
  it('prénom + nom → 2 lettres', () => {
    expect(initialesPourAvatar('Marie Dupont')).toBe('MD');
  });

  it('un seul mot → 1 lettre', () => {
    expect(initialesPourAvatar('Léa')).toBe('L');
  });

  it('prénom composé : 1ʳᵉ + dernière', () => {
    expect(initialesPourAvatar('Jean-Pierre Martin')).toBe('JM'); // espace = séparateur
    expect(initialesPourAvatar('jean-pierre martin')).toBe('JM');
  });

  it('3 mots : 1ʳᵉ + dernière', () => {
    expect(initialesPourAvatar('Marie Claire Dubois')).toBe('MD');
  });

  it('chaîne vide → ?', () => {
    expect(initialesPourAvatar('')).toBe('?');
    expect(initialesPourAvatar('   ')).toBe('?');
  });

  it('majuscules toujours', () => {
    expect(initialesPourAvatar('alice dupont')).toBe('AD');
  });

  it('gère les accents', () => {
    expect(initialesPourAvatar('Émile Évrard')).toBe('ÉÉ');
  });
});
