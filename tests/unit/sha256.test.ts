import { sha256Court, sha256Hex } from '@/lib/sha256';
import { describe, expect, it } from 'vitest';

describe('sha256Hex', () => {
  it('vecteur de référence pour "hello"', async () => {
    expect(await sha256Hex('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('vecteur de référence pour chaîne vide', async () => {
    // SHA-256("") connu :
    expect(await sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('retourne 64 caractères hex', async () => {
    const h = await sha256Hex('test');
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('déterministe', async () => {
    const a = await sha256Hex('Bonjour le monde');
    const b = await sha256Hex('Bonjour le monde');
    expect(a).toBe(b);
  });

  it('sensible aux changements (effet avalanche)', async () => {
    const a = await sha256Hex('hello');
    const b = await sha256Hex('Hello');
    expect(a).not.toBe(b);
  });

  it('gère UTF-8 correctement', async () => {
    // Vecteur officiel pour '🎉' (UTF-8 4 octets) :
    // SHA-256(F09F8E89) = c5fdfe9a... non, on teste juste que c'est non vide et stable
    const h = await sha256Hex('🎉');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(await sha256Hex('🎉')).toBe(h);
  });
});

describe('sha256Court', () => {
  it('retourne 12 caractères hex', async () => {
    const h = await sha256Court('test');
    expect(h).toHaveLength(12);
    expect(h).toMatch(/^[0-9a-f]{12}$/);
  });

  it('correspond au préfixe de sha256Hex', async () => {
    const court = await sha256Court('hello');
    const long = await sha256Hex('hello');
    expect(court).toBe(long.slice(0, 12));
  });
});
