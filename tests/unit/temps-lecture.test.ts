import {
  calculerTempsLectureMinutes,
  compterMots,
  formaterTempsLecture,
} from '@/lib/temps-lecture';
import { describe, expect, it } from 'vitest';

describe('compterMots', () => {
  it('compte les mots simples', () => {
    expect(compterMots('Bonjour le monde')).toBe(3);
  });

  it('gère les espaces multiples et sauts de ligne', () => {
    expect(compterMots('  un\n\n  deux  ')).toBe(2);
  });

  it('retourne 0 pour chaîne vide', () => {
    expect(compterMots('')).toBe(0);
    expect(compterMots('   ')).toBe(0);
  });

  it('1 mot', () => {
    expect(compterMots('isolé')).toBe(1);
  });
});

describe('calculerTempsLectureMinutes', () => {
  it('retourne min 1 pour court texte', () => {
    expect(calculerTempsLectureMinutes('court')).toBe(1);
    expect(calculerTempsLectureMinutes('')).toBe(1);
    expect(calculerTempsLectureMinutes('un peu plus mais pas tant')).toBe(1);
  });

  it('arrondit au supérieur', () => {
    // 201 mots → 2 min (pas 1)
    const texte = `mot ${'autre '.repeat(200)}`;
    expect(calculerTempsLectureMinutes(texte)).toBe(2);
  });

  it('200 mots = 1 min pile', () => {
    const texte = 'mot '.repeat(200).trim();
    expect(calculerTempsLectureMinutes(texte)).toBe(1);
  });

  it('1000 mots = 5 min', () => {
    const texte = 'mot '.repeat(1000).trim();
    expect(calculerTempsLectureMinutes(texte)).toBe(5);
  });

  it('100 mots = 1 min (min)', () => {
    const texte = 'mot '.repeat(100).trim();
    expect(calculerTempsLectureMinutes(texte)).toBe(1);
  });
});

describe('formaterTempsLecture', () => {
  it('1 min', () => {
    expect(formaterTempsLecture('court')).toBe('1 min de lecture');
  });

  it('N min', () => {
    const texte = 'mot '.repeat(800).trim();
    expect(formaterTempsLecture(texte)).toBe('4 min de lecture');
  });
});
