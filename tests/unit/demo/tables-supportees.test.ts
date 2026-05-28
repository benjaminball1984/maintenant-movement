/**
 * Tests du helper pur de validation des tables démo (V2.5.1).
 *
 * `estTableDemoSupportee` est utilisée par `poserMarqueurDemo` comme garde
 * contre les coquilles de nom de table dans le script de seeding. Tester
 * cette garde isolément (sans BDD) suffit à garantir qu'elle accepte la
 * bonne liste et refuse tout le reste.
 */

import { describe, expect, it } from 'vitest';
import {
  TABLES_DEMO_ORDRE_SUPPRESSION,
  estTableDemoSupportee,
} from '../../../lib/demo/tables-supportees';

describe('estTableDemoSupportee', () => {
  it('accepte chaque table de la liste fermée', () => {
    for (const table of TABLES_DEMO_ORDRE_SUPPRESSION) {
      expect(estTableDemoSupportee(table)).toBe(true);
    }
  });

  it('refuse une table inconnue', () => {
    expect(estTableDemoSupportee('table_inexistante')).toBe(false);
    expect(estTableDemoSupportee('PERSONNE')).toBe(false); // sensible à la casse
    expect(estTableDemoSupportee('')).toBe(false);
  });

  it('refuse un nom proche mais mal orthographié (anti-coquille)', () => {
    expect(estTableDemoSupportee('don_cagnotte')).toBe(false); // c'est `don`
    expect(estTableDemoSupportee('appartenance_gt_thematique')).toBe(false); // c'est `appartenance_gt`
    expect(estTableDemoSupportee('edition_journal_affiche')).toBe(false); // c'est `journal_affiche`
  });
});

describe('TABLES_DEMO_ORDRE_SUPPRESSION', () => {
  it('contient au moins les 6 tables fondamentales attendues en Phase A', () => {
    const tablesFondamentales = [
      'personne',
      'petition',
      'mobilisation',
      'cagnotte',
      'sondage',
      'post_reseau',
    ];
    for (const table of tablesFondamentales) {
      expect(TABLES_DEMO_ORDRE_SUPPRESSION).toContain(table);
    }
  });

  it("place 'personne' en dernier (racine humaine, suppression en cascade)", () => {
    const dernier = TABLES_DEMO_ORDRE_SUPPRESSION[TABLES_DEMO_ORDRE_SUPPRESSION.length - 1];
    expect(dernier).toBe('personne');
  });

  it('ne contient aucun doublon', () => {
    const ensemble = new Set(TABLES_DEMO_ORDRE_SUPPRESSION);
    expect(ensemble.size).toBe(TABLES_DEMO_ORDRE_SUPPRESSION.length);
  });
});
