import { chunk, nbChunks } from '@/lib/chunk';
import { describe, expect, it } from 'vitest';

describe('chunk', () => {
  it('découpe un tableau pair', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('dernier chunk peut être plus petit', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('chunk plus grand que la liste → 1 seul chunk', () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it('tableau vide → tableau vide', () => {
    expect(chunk([], 5)).toEqual([]);
  });

  it('taille 0 ou négative → 1 chunk avec tout (sécurité)', () => {
    expect(chunk([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(chunk([1, 2, 3], -5)).toEqual([[1, 2, 3]]);
  });

  it('respecte le type generique', () => {
    const chunks = chunk(['a', 'b', 'c'], 2);
    expect(chunks[0]?.[0]).toBe('a');
  });

  it('ne mute pas le tableau source', () => {
    const src = [1, 2, 3, 4];
    chunk(src, 2);
    expect(src).toEqual([1, 2, 3, 4]);
  });
});

describe('nbChunks', () => {
  it('division exacte', () => {
    expect(nbChunks(100, 25)).toBe(4);
  });

  it('arrondit au supérieur', () => {
    expect(nbChunks(100, 30)).toBe(4); // 3×30=90, + 1 pour les 10 restants
    expect(nbChunks(7, 3)).toBe(3);
  });

  it('0 si total <= 0', () => {
    expect(nbChunks(0, 10)).toBe(0);
    expect(nbChunks(-5, 10)).toBe(0);
  });

  it('1 si taille <= 0 (sécurité, cohérent avec chunk)', () => {
    expect(nbChunks(100, 0)).toBe(1);
    expect(nbChunks(100, -5)).toBe(1);
  });
});
