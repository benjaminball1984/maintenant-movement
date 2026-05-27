import { formaterTailleOctets } from '@/lib/format-taille';
import { describe, expect, it } from 'vitest';

describe('formaterTailleOctets', () => {
  it('formate les octets', () => {
    expect(formaterTailleOctets(0)).toBe('0 o');
    expect(formaterTailleOctets(1)).toBe('1 o');
    expect(formaterTailleOctets(1023)).toBe('1023 o');
  });

  it('formate les Ko', () => {
    expect(formaterTailleOctets(1024)).toBe('1.0 Ko');
    expect(formaterTailleOctets(1536)).toBe('1.5 Ko');
    expect(formaterTailleOctets(1024 * 100)).toBe('100.0 Ko');
  });

  it('formate les Mo', () => {
    expect(formaterTailleOctets(1024 * 1024)).toBe('1.0 Mo');
    expect(formaterTailleOctets(5 * 1024 * 1024)).toBe('5.0 Mo');
    expect(formaterTailleOctets(1.5 * 1024 * 1024)).toBe('1.5 Mo');
  });

  it('gère les nombres négatifs (renvoie 0 o)', () => {
    expect(formaterTailleOctets(-100)).toBe('0 o');
  });

  it('seuils transitions', () => {
    // 1023 o -> octets ; 1024 o -> Ko
    expect(formaterTailleOctets(1023)).toBe('1023 o');
    expect(formaterTailleOctets(1024)).toBe('1.0 Ko');
    // 1 Mo - 1 o -> Ko ; 1 Mo -> Mo
    expect(formaterTailleOctets(1024 * 1024 - 1)).toMatch(/Ko$/);
    expect(formaterTailleOctets(1024 * 1024)).toBe('1.0 Mo');
  });
});
