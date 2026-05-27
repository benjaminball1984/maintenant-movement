import { estUuidValide, normaliserUuid } from '@/lib/uuid';
import { describe, expect, it } from 'vitest';

describe('estUuidValide', () => {
  it('accepte un UUID v4 minuscules', () => {
    expect(estUuidValide('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepte un UUID v4 majuscules', () => {
    expect(estUuidValide('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('accepte un UUID v1', () => {
    expect(estUuidValide('e3851d4c-f7c7-11ee-be56-0242ac120002')).toBe(true);
  });

  it('refuse un UUID v6/7/8 (version > 5)', () => {
    expect(estUuidValide('550e8400-e29b-61d4-a716-446655440000')).toBe(false);
  });

  it('refuse une chaîne vide', () => {
    expect(estUuidValide('')).toBe(false);
  });

  it('refuse null/undefined', () => {
    expect(estUuidValide(null)).toBe(false);
    expect(estUuidValide(undefined)).toBe(false);
  });

  it('refuse format incorrect (longueur)', () => {
    expect(estUuidValide('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
    expect(estUuidValide('550e8400-e29b-41d4-a716-4466554400000')).toBe(false);
  });

  it('refuse caractères non hex', () => {
    expect(estUuidValide('550e8400-e29b-41d4-a716-44665544000Z')).toBe(false);
  });

  it('refuse sans tirets', () => {
    expect(estUuidValide('550e8400e29b41d4a716446655440000')).toBe(false);
  });

  it('refuse pas un UUID du tout', () => {
    expect(estUuidValide('hello')).toBe(false);
    expect(estUuidValide('1234')).toBe(false);
  });
});

describe('normaliserUuid', () => {
  it('met en minuscules un UUID valide', () => {
    expect(normaliserUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('laisse passer un UUID déjà en minuscules', () => {
    expect(normaliserUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('retourne null si invalide', () => {
    expect(normaliserUuid('pas un UUID')).toBeNull();
    expect(normaliserUuid(null)).toBeNull();
  });
});
