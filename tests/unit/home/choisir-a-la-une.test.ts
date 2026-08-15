import { choisirALaUne } from '@/lib/home/une';
import { describe, expect, it } from 'vitest';

/**
 * Tests de la logique pure de choix « à la une » (chantier V2.6.19,
 * resserré le 15/08/2026) : SEUL le contenu épinglé par l'administration
 * monte à la une. Plus aucun repli automatique sur le plus récent.
 */
interface Item {
  id: string;
}
const A: Item = { id: 'a' };
const B: Item = { id: 'b' };
const C: Item = { id: 'c' };

describe('choisirALaUne', () => {
  const getId = (i: Item) => i.id;

  it('ne renvoie rien si aucun contenu n’est épinglé', () => {
    expect(choisirALaUne([A, B, C], null, getId)).toBeNull();
  });

  it('renvoie l’épinglé s’il est présent dans la liste', () => {
    expect(choisirALaUne([A, B, C], 'b', getId)).toBe(B);
  });

  it('ne renvoie rien si l’épinglé n’est plus dans la liste (retiré, dépublié, date passée)', () => {
    expect(choisirALaUne([A, B, C], 'zzz', getId)).toBeNull();
  });

  it('renvoie null pour une liste vide', () => {
    expect(choisirALaUne([], 'a', getId)).toBeNull();
    expect(choisirALaUne([], null, getId)).toBeNull();
  });
});
