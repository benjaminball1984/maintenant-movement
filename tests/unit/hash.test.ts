import { hashFnv1a, hashFnv1aHex } from '@/lib/hash';
import { describe, expect, it } from 'vitest';

describe('hashFnv1a', () => {
  it('chaîne vide retourne FNV_OFFSET (2166136261)', () => {
    expect(hashFnv1a('')).toBe(2166136261);
  });

  it('valeurs de référence connues (vecteurs FNV-1a officiels)', () => {
    // Vecteurs de test du papier FNV original.
    expect(hashFnv1a('a')).toBe(0xe40c292c);
    expect(hashFnv1a('foobar')).toBe(0xbf9cf968);
  });

  it('déterministe : même entrée → même sortie', () => {
    const s = 'Bonjour le monde';
    expect(hashFnv1a(s)).toBe(hashFnv1a(s));
  });

  it('sensible à la casse', () => {
    expect(hashFnv1a('hello')).not.toBe(hashFnv1a('Hello'));
  });

  it('sensible à l’ordre', () => {
    expect(hashFnv1a('ab')).not.toBe(hashFnv1a('ba'));
  });

  it('retourne unsigned 32 bits (0 à 0xFFFFFFFF)', () => {
    const h = hashFnv1a('hello');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });

  it('faible collision sur 100 chaînes pseudo-aléatoires', () => {
    const hashs = new Set<number>();
    for (let i = 0; i < 100; i++) {
      hashs.add(hashFnv1a(`chaine-${i}-test`));
    }
    expect(hashs.size).toBe(100); // aucune collision attendue
  });
});

describe('hashFnv1aHex', () => {
  it('retourne 8 caractères hex', () => {
    expect(hashFnv1aHex('hello')).toHaveLength(8);
    expect(hashFnv1aHex('hello')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('chaîne vide → 811c9dc5 (FNV_OFFSET en hex)', () => {
    expect(hashFnv1aHex('')).toBe('811c9dc5');
  });

  it('padding gauche pour petites valeurs', () => {
    // Trouver une chaîne dont le hash est très petit demanderait du brute force ;
    // on teste juste la longueur sur des entrées variées.
    for (const s of ['a', 'ab', 'abc', 'abcd', '0', '!', '🎉']) {
      expect(hashFnv1aHex(s)).toHaveLength(8);
    }
  });
});
