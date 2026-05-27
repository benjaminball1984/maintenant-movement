import {
  contrastTexte,
  estHexValide,
  hexEnRgb,
  luminanceRelative,
  normaliserHex,
} from '@/lib/couleur-hex';
import { describe, expect, it } from 'vitest';

describe('estHexValide', () => {
  it('accepte format #aabbcc', () => {
    expect(estHexValide('#aabbcc')).toBe(true);
    expect(estHexValide('#AABBCC')).toBe(true);
  });

  it('accepte format court #abc', () => {
    expect(estHexValide('#abc')).toBe(true);
  });

  it('accepte sans #', () => {
    expect(estHexValide('aabbcc')).toBe(true);
    expect(estHexValide('abc')).toBe(true);
  });

  it('refuse longueur incorrecte', () => {
    expect(estHexValide('#abcd')).toBe(false);
    expect(estHexValide('#aabbccdd')).toBe(false);
  });

  it('refuse non-hex', () => {
    expect(estHexValide('#xxyyzz')).toBe(false);
    expect(estHexValide('hello')).toBe(false);
  });

  it('refuse null/vide', () => {
    expect(estHexValide(null)).toBe(false);
    expect(estHexValide(undefined)).toBe(false);
    expect(estHexValide('')).toBe(false);
  });
});

describe('normaliserHex', () => {
  it('étend le format court en long', () => {
    expect(normaliserHex('#abc')).toBe('#aabbcc');
    expect(normaliserHex('abc')).toBe('#aabbcc');
  });

  it('ajoute # et met en minuscules', () => {
    expect(normaliserHex('FF00FF')).toBe('#ff00ff');
    expect(normaliserHex('#FF00FF')).toBe('#ff00ff');
  });

  it('retourne null si invalide', () => {
    expect(normaliserHex('xyz')).toBeNull();
    expect(normaliserHex(null)).toBeNull();
  });
});

describe('hexEnRgb', () => {
  it('extrait RGB pour blanc', () => {
    expect(hexEnRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('extrait RGB pour noir', () => {
    expect(hexEnRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('extrait RGB pour rouge pur', () => {
    expect(hexEnRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('extrait depuis format court', () => {
    expect(hexEnRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('null si invalide', () => {
    expect(hexEnRgb('xyz')).toBeNull();
  });
});

describe('luminanceRelative', () => {
  it('blanc = 1.0', () => {
    expect(luminanceRelative('#ffffff')).toBeCloseTo(1, 3);
  });

  it('noir = 0.0', () => {
    expect(luminanceRelative('#000000')).toBeCloseTo(0, 3);
  });

  it('gris moyen ~0.21', () => {
    const l = luminanceRelative('#808080');
    expect(l).toBeGreaterThan(0.2);
    expect(l).toBeLessThan(0.25);
  });

  it('null si invalide', () => {
    expect(luminanceRelative('xyz')).toBeNull();
  });
});

describe('contrastTexte', () => {
  it('blanc sur noir', () => {
    expect(contrastTexte('#000000')).toBe('#ffffff');
  });

  it('noir sur blanc', () => {
    expect(contrastTexte('#ffffff')).toBe('#000000');
  });

  it('rouge vif : noir choisi (luminance R*0.2126 ≈ 0.21 > seuil 0.179)', () => {
    // WCAG donne raison au noir sur rouge pur, contre-intuitif mais correct.
    expect(contrastTexte('#ff0000')).toBe('#000000');
  });

  it('rouge sombre (luminance faible) : blanc', () => {
    expect(contrastTexte('#800000')).toBe('#ffffff');
  });

  it('bleu pur : blanc (luminance B*0.0722 très faible)', () => {
    expect(contrastTexte('#0000ff')).toBe('#ffffff');
  });

  it('noir sur jaune vif (luminance haute)', () => {
    expect(contrastTexte('#ffff00')).toBe('#000000');
  });

  it('noir par défaut si invalide', () => {
    expect(contrastTexte('xyz')).toBe('#000000');
  });
});
