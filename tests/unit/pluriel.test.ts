import { accorder, compter } from '@/lib/pluriel';
import { describe, expect, it } from 'vitest';

describe('accorder', () => {
  it('singulier pour 0', () => {
    expect(accorder(0, 'résultat')).toBe('résultat');
  });

  it('singulier pour 1', () => {
    expect(accorder(1, 'résultat')).toBe('résultat');
  });

  it('pluriel pour 2', () => {
    expect(accorder(2, 'résultat')).toBe('résultats');
  });

  it('pluriel pour grand nombre', () => {
    expect(accorder(1000, 'résultat')).toBe('résultats');
  });

  it('utilise le pluriel explicite si fourni', () => {
    expect(accorder(2, 'cheval', 'chevaux')).toBe('chevaux');
    expect(accorder(1, 'cheval', 'chevaux')).toBe('cheval');
  });

  it('singulier pour 1 négatif (français grammatical)', () => {
    expect(accorder(-1, 'résultat')).toBe('résultat');
  });

  it('pluriel pour -2 (sens grammatical)', () => {
    expect(accorder(-2, 'résultat')).toBe('résultats');
  });
});

describe('compter', () => {
  it('« 0 résultat »', () => {
    expect(compter(0, 'résultat')).toBe('0 résultat');
  });

  it('« 1 résultat »', () => {
    expect(compter(1, 'résultat')).toBe('1 résultat');
  });

  it('« 2 résultats »', () => {
    expect(compter(2, 'résultat')).toBe('2 résultats');
  });

  it('formate les grands nombres avec espace fine', () => {
    const r = compter(1234, 'résultat');
    expect(r).toMatch(/résultats$/);
    expect(r).toContain('1');
    expect(r).toContain('234');
  });

  it('utilise le pluriel explicite', () => {
    expect(compter(3, 'cheval', 'chevaux')).toBe('3 chevaux');
    expect(compter(1, 'cheval', 'chevaux')).toBe('1 cheval');
  });
});
