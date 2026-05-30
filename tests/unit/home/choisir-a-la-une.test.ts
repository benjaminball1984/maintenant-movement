import { choisirALaUne } from '@/lib/home/une';
import { describe, expect, it } from 'vitest';

/**
 * Tests de la logique pure de choix « à la une » (chantier V2.6.19) :
 * l'épinglé prime s'il est présent, sinon le plus récent.
 */
interface Item {
  id: string;
}
const A: Item = { id: 'a' };
const B: Item = { id: 'b' };
const C: Item = { id: 'c' };

describe('choisirALaUne', () => {
  const getId = (i: Item) => i.id;

  it('renvoie le premier (plus récent) si rien n’est épinglé', () => {
    expect(choisirALaUne([A, B, C], null, getId)).toBe(A);
  });

  it('renvoie l’épinglé s’il est présent dans la liste', () => {
    expect(choisirALaUne([A, B, C], 'b', getId)).toBe(B);
  });

  it('retombe sur le premier si l’épinglé n’est pas dans la liste (ex. hors bassin)', () => {
    expect(choisirALaUne([A, B, C], 'zzz', getId)).toBe(A);
  });

  it('renvoie null pour une liste vide', () => {
    expect(choisirALaUne([], 'a', getId)).toBeNull();
    expect(choisirALaUne([], null, getId)).toBeNull();
  });
});
