import { estEmailValide, normaliserEmail } from '@/lib/email-valide';
import { describe, expect, it } from 'vitest';

describe('estEmailValide', () => {
  it('accepte un email simple', () => {
    expect(estEmailValide('foo@bar.com')).toBe(true);
  });

  it('accepte un email avec sous-domaine', () => {
    expect(estEmailValide('contact@maintenant-le-mouvement.org')).toBe(true);
  });

  it('accepte un email avec accents (UTF-8 OK)', () => {
    // Régex ne contient pas \w mais [^\s@] : accents acceptés
    expect(estEmailValide('lifé@bénévole.fr')).toBe(true);
  });

  it('accepte les + dans la partie locale (alias Gmail)', () => {
    expect(estEmailValide('user+tag@gmail.com')).toBe(true);
  });

  it('refuse une string vide', () => {
    expect(estEmailValide('')).toBe(false);
    expect(estEmailValide('   ')).toBe(false);
  });

  it('refuse null/undefined', () => {
    expect(estEmailValide(null)).toBe(false);
    expect(estEmailValide(undefined)).toBe(false);
  });

  it('refuse si pas de point dans le domaine', () => {
    expect(estEmailValide('foo@bar')).toBe(false);
  });

  it('refuse si pas de @', () => {
    expect(estEmailValide('foo.bar.com')).toBe(false);
  });

  it('refuse si espace', () => {
    expect(estEmailValide('foo @bar.com')).toBe(false);
    expect(estEmailValide('foo@ bar.com')).toBe(false);
  });

  it('refuse si plusieurs @', () => {
    expect(estEmailValide('foo@bar@com')).toBe(false);
  });

  it('refuse si trop long (>254 car)', () => {
    const longue = `${'a'.repeat(250)}@b.co`;
    expect(estEmailValide(longue)).toBe(false);
  });

  it('trim avant validation', () => {
    expect(estEmailValide('  foo@bar.com  ')).toBe(true);
  });
});

describe('normaliserEmail', () => {
  it('trim + lowercase', () => {
    expect(normaliserEmail('  Foo@Bar.COM  ')).toBe('foo@bar.com');
  });

  it('laisse passer un email déjà normalisé', () => {
    expect(normaliserEmail('foo@bar.com')).toBe('foo@bar.com');
  });
});
