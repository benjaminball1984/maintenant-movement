import { capitaliser, decapitaliser, titreCase } from '@/lib/capitalisation';
import { describe, expect, it } from 'vitest';

describe('capitaliser', () => {
  it('met la première lettre en majuscule', () => {
    expect(capitaliser('bonjour')).toBe('Bonjour');
  });

  it('laisse le reste tel quel', () => {
    expect(capitaliser('jEAN')).toBe('JEAN');
    expect(capitaliser('jean-pierre')).toBe('Jean-pierre');
  });

  it('gère les accents', () => {
    expect(capitaliser('été')).toBe('Été');
    expect(capitaliser('école')).toBe('École');
  });

  it('retourne chaîne vide pour vide', () => {
    expect(capitaliser('')).toBe('');
  });

  it('idempotent si déjà capitalisé', () => {
    expect(capitaliser('Bonjour')).toBe('Bonjour');
  });
});

describe('titreCase', () => {
  it('capitalise chaque mot séparé par espace', () => {
    expect(titreCase('jean dupont')).toBe('Jean Dupont');
  });

  it('capitalise après tiret', () => {
    expect(titreCase('jean-pierre dupont')).toBe('Jean-Pierre Dupont');
  });

  it('capitalise après apostrophe droite', () => {
    expect(titreCase("marie d'hauteville")).toBe("Marie D'Hauteville");
  });

  it('capitalise après apostrophe typographique', () => {
    expect(titreCase('marie d’hauteville')).toBe('Marie D’Hauteville');
  });

  it('gère les accents', () => {
    expect(titreCase('école élémentaire')).toBe('École Élémentaire');
  });

  it('retourne chaîne vide pour vide', () => {
    expect(titreCase('')).toBe('');
  });

  it('combine plusieurs séparateurs', () => {
    expect(titreCase("jean-marie d'arc")).toBe("Jean-Marie D'Arc");
  });
});

describe('decapitaliser', () => {
  it('met la première lettre en minuscule', () => {
    expect(decapitaliser('Bonjour')).toBe('bonjour');
  });

  it('gère les accents', () => {
    expect(decapitaliser('École')).toBe('école');
  });

  it('retourne chaîne vide pour vide', () => {
    expect(decapitaliser('')).toBe('');
  });
});
