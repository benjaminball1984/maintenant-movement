import { countBy, groupBy, groupByObjet } from '@/lib/group-by';
import { describe, expect, it } from 'vitest';

describe('groupBy', () => {
  it('groupe par pair/impair', () => {
    const r = groupBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? 'pair' : 'impair'));
    expect(r.get('pair')).toEqual([2, 4]);
    expect(r.get('impair')).toEqual([1, 3, 5]);
  });

  it('groupe par clé numérique', () => {
    const r = groupBy(['a', 'bb', 'cc', 'd'], (s) => s.length);
    expect(r.get(1)).toEqual(['a', 'd']);
    expect(r.get(2)).toEqual(['bb', 'cc']);
  });

  it('tableau vide → Map vide', () => {
    expect(groupBy([], () => 'k').size).toBe(0);
  });

  it('préserve l’ordre des éléments dans chaque groupe', () => {
    const items = [
      { id: 1, t: 'a' },
      { id: 2, t: 'a' },
      { id: 3, t: 'b' },
    ];
    const r = groupBy(items, (x) => x.t);
    expect(r.get('a')?.map((x) => x.id)).toEqual([1, 2]);
  });
});

describe('groupByObjet', () => {
  it('retourne un objet plain', () => {
    const r = groupByObjet(['a', 'b', 'cc'], (s) => s.length);
    expect(r[1]).toEqual(['a', 'b']);
    expect(r[2]).toEqual(['cc']);
  });

  it('sérialisable en JSON', () => {
    const r = groupByObjet([1, 2, 3], (n) => (n > 1 ? 'gros' : 'petit'));
    expect(JSON.parse(JSON.stringify(r))).toEqual({ petit: [1], gros: [2, 3] });
  });
});

describe('countBy', () => {
  it('compte par clé', () => {
    const r = countBy(['a', 'b', 'a', 'c', 'a'], (s) => s);
    expect(r.get('a')).toBe(3);
    expect(r.get('b')).toBe(1);
    expect(r.get('c')).toBe(1);
  });

  it('tableau vide → Map vide', () => {
    expect(countBy([], () => 'k').size).toBe(0);
  });

  it('total = arr.length', () => {
    const arr = [1, 2, 3, 4, 5];
    const r = countBy(arr, (n) => n % 2);
    const total = [...r.values()].reduce((s, n) => s + n, 0);
    expect(total).toBe(arr.length);
  });
});
