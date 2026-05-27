import { lirePageDepuisParams, paginer } from '@/lib/pagination';
import { describe, expect, it } from 'vitest';

describe('paginer', () => {
  it('100 éléments, 20/page → 5 pages', () => {
    const r = paginer({ page: 1, parPage: 20, total: 100 });
    expect(r.nbPages).toBe(5);
    expect(r.debutIdx).toBe(0);
    expect(r.finIdx).toBe(19);
    expect(r.aPagePrecedente).toBe(false);
    expect(r.aPageSuivante).toBe(true);
  });

  it('page 3 sur 5', () => {
    const r = paginer({ page: 3, parPage: 20, total: 100 });
    expect(r.page).toBe(3);
    expect(r.debutIdx).toBe(40);
    expect(r.finIdx).toBe(59);
    expect(r.aPagePrecedente).toBe(true);
    expect(r.aPageSuivante).toBe(true);
  });

  it('dernière page partielle', () => {
    const r = paginer({ page: 5, parPage: 20, total: 95 });
    expect(r.nbPages).toBe(5);
    expect(r.debutIdx).toBe(80);
    expect(r.finIdx).toBe(94);
    expect(r.aPageSuivante).toBe(false);
  });

  it('page hors borne clampée au max', () => {
    const r = paginer({ page: 999, parPage: 20, total: 100 });
    expect(r.page).toBe(5);
  });

  it('page < 1 clampée à 1', () => {
    const r = paginer({ page: 0, parPage: 20, total: 100 });
    expect(r.page).toBe(1);
    const r2 = paginer({ page: -5, parPage: 20, total: 100 });
    expect(r2.page).toBe(1);
  });

  it('total 0 : 1 page vide, finIdx = debutIdx', () => {
    const r = paginer({ page: 1, parPage: 20, total: 0 });
    expect(r.nbPages).toBe(1);
    expect(r.debutIdx).toBe(0);
    expect(r.finIdx).toBe(0);
    expect(r.aPagePrecedente).toBe(false);
    expect(r.aPageSuivante).toBe(false);
  });

  it('parPage <= 0 clampé à 1', () => {
    const r = paginer({ page: 1, parPage: 0, total: 10 });
    expect(r.nbPages).toBe(10);
  });

  it('total non-entier arrondi en bas', () => {
    const r = paginer({ page: 1, parPage: 20, total: 99.7 });
    expect(r.nbPages).toBe(5);
  });
});

describe('lirePageDepuisParams', () => {
  it('lit depuis objet', () => {
    expect(lirePageDepuisParams({ page: '3' })).toBe(3);
  });

  it('lit depuis URLSearchParams', () => {
    const sp = new URLSearchParams('page=7');
    expect(lirePageDepuisParams(sp)).toBe(7);
  });

  it('retourne 1 si absent', () => {
    expect(lirePageDepuisParams({})).toBe(1);
    expect(lirePageDepuisParams(new URLSearchParams())).toBe(1);
  });

  it('retourne 1 si NaN', () => {
    expect(lirePageDepuisParams({ page: 'abc' })).toBe(1);
  });

  it('retourne 1 si négatif ou 0', () => {
    expect(lirePageDepuisParams({ page: '-3' })).toBe(1);
    expect(lirePageDepuisParams({ page: '0' })).toBe(1);
  });
});
