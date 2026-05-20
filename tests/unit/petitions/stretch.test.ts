import { FACTEUR_STRETCH, SEUIL_STRETCH, calculerEtatStretch } from '@/lib/petitions/stretch';
import { describe, expect, it } from 'vitest';

/**
 * Tests de la règle métier « compteur stretch ×1,5 à 90 % » (chantier 3.1).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §5A` : tant que `signatures < 90 %`
 * de l'objectif, on affiche l'objectif initial. Dès 90 % atteint, on bascule
 * sur `objectif × 1,5` (arrondi sup) et la jauge redémarre proportionnellement.
 */
describe('calculerEtatStretch', () => {
  it('expose les constantes pour permettre l’ajustement futur', () => {
    expect(SEUIL_STRETCH).toBe(0.9);
    expect(FACTEUR_STRETCH).toBe(1.5);
  });

  it('garde l’objectif initial tant que sous 90 %', () => {
    const etat = calculerEtatStretch(500, 1000);
    expect(etat.estEtire).toBe(false);
    expect(etat.objectifEffectif).toBe(1000);
    expect(etat.pourcentage).toBe(50);
    expect(etat.estAtteint).toBe(false);
  });

  it('reste en mode initial juste sous le seuil (899 / 1000)', () => {
    const etat = calculerEtatStretch(899, 1000);
    expect(etat.estEtire).toBe(false);
    expect(etat.objectifEffectif).toBe(1000);
  });

  it('bascule en stretch pile à 90 %', () => {
    const etat = calculerEtatStretch(900, 1000);
    expect(etat.estEtire).toBe(true);
    expect(etat.objectifEffectif).toBe(1500);
    // 900 / 1500 = 60 %
    expect(etat.pourcentage).toBe(60);
    expect(etat.estAtteint).toBe(false);
  });

  it('arrondit l’objectif stretch à l’entier supérieur', () => {
    // 7 * 1,5 = 10,5 → 11
    const etat = calculerEtatStretch(7, 7);
    expect(etat.objectifEffectif).toBe(11);
  });

  it('signale l’atteinte du nouvel objectif après stretch', () => {
    const etat = calculerEtatStretch(1500, 1000);
    expect(etat.estEtire).toBe(true);
    expect(etat.estAtteint).toBe(true);
    expect(etat.pourcentage).toBe(100);
  });

  it('plafonne le pourcentage à 100 même quand on dépasse', () => {
    const etat = calculerEtatStretch(50_000, 1000);
    expect(etat.pourcentage).toBe(100);
  });

  it('tolère un objectif initial nul (garde-fou)', () => {
    const etat = calculerEtatStretch(0, 0);
    expect(etat.objectifEffectif).toBeGreaterThanOrEqual(1);
    expect(etat.pourcentage).toBeGreaterThanOrEqual(0);
  });

  it('tolère un nombre de signatures négatif (garde-fou)', () => {
    const etat = calculerEtatStretch(-10, 1000);
    expect(etat.pourcentage).toBe(0);
    expect(etat.estEtire).toBe(false);
  });
});
