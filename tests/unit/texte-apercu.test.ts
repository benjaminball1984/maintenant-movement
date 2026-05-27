import { apercu, tronquerCaracteres, tronquerMots } from '@/lib/texte-apercu';
import { describe, expect, it } from 'vitest';

describe('tronquerCaracteres', () => {
  it('retourne tel quel si court', () => {
    expect(tronquerCaracteres('Salut', 10)).toBe('Salut');
  });

  it('coupe à N caractères en respectant les mots', () => {
    expect(tronquerCaracteres('Lorem ipsum dolor sit amet', 10)).toBe('Lorem…');
  });

  it('coupe net si pas d’espace dans la fenêtre', () => {
    // Mot trop long sans espace : on coupe net.
    expect(tronquerCaracteres('aaaaaaaaaa', 5)).toBe('aaaaa…');
  });

  it('coupe net si le dernier espace est trop tôt (<50% maxCar)', () => {
    // 'a bcdefghijklmnop' : espace à idx 1, fenêtre 10. 1 < 5, donc coupe net.
    expect(tronquerCaracteres('a bcdefghijklmnop', 10)).toBe('a bcdefghi…');
  });

  it('trim avant de mesurer', () => {
    expect(tronquerCaracteres('  Salut  ', 100)).toBe('Salut');
  });
});

describe('tronquerMots', () => {
  it('retourne tel quel si court', () => {
    expect(tronquerMots('un deux trois', 5)).toBe('un deux trois');
  });

  it('coupe à N mots', () => {
    expect(tronquerMots('un deux trois quatre cinq', 3)).toBe('un deux trois…');
  });

  it('gère les espaces multiples', () => {
    expect(tronquerMots('un   deux\n\ntrois quatre', 2)).toBe('un deux…');
  });

  it('trim avant de mesurer', () => {
    expect(tronquerMots('  un deux  ', 5)).toBe('un deux');
  });
});

describe('apercu', () => {
  it('alias de tronquerCaracteres', () => {
    expect(apercu('Lorem ipsum dolor sit amet', 10)).toBe('Lorem…');
  });
});
