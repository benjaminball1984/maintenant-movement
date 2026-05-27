import {
  STATUTS_FILTRES_RESERVATION,
  TYPES_FILTRES_OFFRE,
  estFiltreStatutValide,
  estFiltreTypeValide,
} from '@/lib/reservation-filtres';
import { describe, expect, it } from 'vitest';

describe('estFiltreStatutValide', () => {
  it('accepte les 7 statuts D8', () => {
    for (const s of [
      'proposee',
      'acceptee',
      'refusee',
      'realisee',
      'confirmee',
      'annulee',
      'litige',
    ]) {
      expect(estFiltreStatutValide(s)).toBe(true);
    }
  });

  it('rejette « tous » (sentinelle absence de filtre)', () => {
    expect(estFiltreStatutValide('tous')).toBe(false);
  });

  it('rejette undefined, tableau et valeurs inconnues', () => {
    expect(estFiltreStatutValide(undefined)).toBe(false);
    expect(estFiltreStatutValide([])).toBe(false);
    expect(estFiltreStatutValide('inconnu')).toBe(false);
    expect(estFiltreStatutValide('')).toBe(false);
  });
});

describe('estFiltreTypeValide', () => {
  it('accepte les 6 types d’offre', () => {
    for (const t of [
      'transport_covoiturage',
      'hebergement',
      'pret',
      'service_sel',
      'location_mutualisee',
      'autre',
    ]) {
      expect(estFiltreTypeValide(t)).toBe(true);
    }
  });

  it('rejette « tous »', () => {
    expect(estFiltreTypeValide('tous')).toBe(false);
  });

  it('rejette undefined et valeurs inconnues', () => {
    expect(estFiltreTypeValide(undefined)).toBe(false);
    expect(estFiltreTypeValide('foo')).toBe(false);
  });
});

describe('Listes de filtres exposées', () => {
  it('STATUTS_FILTRES_RESERVATION démarre par « tous »', () => {
    expect(STATUTS_FILTRES_RESERVATION[0]?.slug).toBe('tous');
  });

  it('TYPES_FILTRES_OFFRE démarre par « tous »', () => {
    expect(TYPES_FILTRES_OFFRE[0]?.slug).toBe('tous');
  });

  it('STATUTS_FILTRES_RESERVATION couvre les 7 statuts D8 + tous', () => {
    expect(STATUTS_FILTRES_RESERVATION).toHaveLength(8);
  });

  it('TYPES_FILTRES_OFFRE couvre les 6 types + tous', () => {
    expect(TYPES_FILTRES_OFFRE).toHaveLength(7);
  });
});
