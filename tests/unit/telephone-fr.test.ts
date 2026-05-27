import {
  estTelephoneFrValide,
  formaterTelephoneFr,
  normaliserTelephoneFr,
} from '@/lib/telephone-fr';
import { describe, expect, it } from 'vitest';

describe('estTelephoneFrValide', () => {
  it('accepte un mobile français sans séparateur', () => {
    expect(estTelephoneFrValide('0612345678')).toBe(true);
  });

  it('accepte un mobile avec espaces', () => {
    expect(estTelephoneFrValide('06 12 34 56 78')).toBe(true);
  });

  it('accepte un mobile avec points', () => {
    expect(estTelephoneFrValide('06.12.34.56.78')).toBe(true);
  });

  it('accepte un mobile avec tirets', () => {
    expect(estTelephoneFrValide('06-12-34-56-78')).toBe(true);
  });

  it('accepte format international +33', () => {
    expect(estTelephoneFrValide('+33612345678')).toBe(true);
    expect(estTelephoneFrValide('+33 6 12 34 56 78')).toBe(true);
  });

  it('accepte tous les indicatifs (01 à 09)', () => {
    expect(estTelephoneFrValide('0123456789')).toBe(true); // fixe
    expect(estTelephoneFrValide('0723456789')).toBe(true); // mobile
    expect(estTelephoneFrValide('0923456789')).toBe(true); // boîtier internet
  });

  it('refuse 00 en début (zone internationale)', () => {
    expect(estTelephoneFrValide('0012345678')).toBe(false);
  });

  it('refuse trop court', () => {
    expect(estTelephoneFrValide('12345')).toBe(false);
    expect(estTelephoneFrValide('061234')).toBe(false);
  });

  it('refuse trop long', () => {
    expect(estTelephoneFrValide('061234567890')).toBe(false);
  });

  it('refuse une string vide ou null', () => {
    expect(estTelephoneFrValide('')).toBe(false);
    expect(estTelephoneFrValide(null)).toBe(false);
    expect(estTelephoneFrValide(undefined)).toBe(false);
  });

  it('refuse un email', () => {
    expect(estTelephoneFrValide('foo@bar.com')).toBe(false);
  });
});

describe('normaliserTelephoneFr', () => {
  it('format national déjà normalisé', () => {
    expect(normaliserTelephoneFr('0612345678')).toBe('0612345678');
  });

  it('retire les séparateurs', () => {
    expect(normaliserTelephoneFr('06.12.34.56.78')).toBe('0612345678');
    expect(normaliserTelephoneFr('06 12 34 56 78')).toBe('0612345678');
    expect(normaliserTelephoneFr('06-12-34-56-78')).toBe('0612345678');
  });

  it('convertit +33 en 0…', () => {
    expect(normaliserTelephoneFr('+33612345678')).toBe('0612345678');
    expect(normaliserTelephoneFr('+33 6 12 34 56 78')).toBe('0612345678');
  });

  it('retourne chaîne vide si invalide', () => {
    expect(normaliserTelephoneFr('12345')).toBe('');
    expect(normaliserTelephoneFr('abcdef')).toBe('');
  });
});

describe('formaterTelephoneFr', () => {
  it('formate en paires séparées par espaces', () => {
    expect(formaterTelephoneFr('0612345678')).toBe('06 12 34 56 78');
  });

  it('accepte un numéro avec séparateurs en entrée', () => {
    expect(formaterTelephoneFr('06.12.34.56.78')).toBe('06 12 34 56 78');
  });

  it('accepte +33 en entrée', () => {
    expect(formaterTelephoneFr('+33612345678')).toBe('06 12 34 56 78');
  });

  it('retourne chaîne vide si invalide', () => {
    expect(formaterTelephoneFr('12345')).toBe('');
  });
});
