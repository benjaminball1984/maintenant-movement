import {
  QUOTAS_TRANCHE_AGE,
  SEUIL_PONDERATION,
  pondererResultats,
} from '@/lib/sondages/ponderation';
import { describe, expect, it } from 'vitest';

/**
 * Tests du redressement par quotas (lib/sondages/ponderation.ts).
 * Fonction pure : agrégat (option, tranche, votes) -> compteurs pondérés.
 */
describe('pondererResultats', () => {
  it('le seuil de pondération est 300 (doctrine §4D)', () => {
    expect(SEUIL_PONDERATION).toBe(300);
  });

  it('les quotas cibles somment à 1 (tolérance arrondi)', () => {
    const somme = Object.values(QUOTAS_TRANCHE_AGE).reduce((a, b) => a + b, 0);
    expect(somme).toBeCloseTo(1, 2);
  });

  it('sans aucune tranche déclarée, le pondéré égale le brut', () => {
    const resultat = pondererResultats(
      [
        { option_index: 0, tranche_age: null, nombre_votes: 10 },
        { option_index: 1, tranche_age: null, nombre_votes: 30 },
      ],
      2,
    );
    expect(resultat.compteurs).toEqual([10, 30]);
    expect(resultat.total).toBe(40);
  });

  it('redresse une tranche surreprésentée vers sa part cible', () => {
    // 100 % des votes redressables viennent des 18-24 (part cible 10,5 %) :
    // leur poids vaut 0,105, les votes sans tranche restent à 1.
    const resultat = pondererResultats(
      [
        { option_index: 0, tranche_age: '18_24', nombre_votes: 100 },
        { option_index: 1, tranche_age: null, nombre_votes: 10 },
      ],
      2,
    );
    expect(resultat.poidsParTranche['18_24']).toBeCloseTo(0.105, 5);
    expect(resultat.compteurs[0]).toBeCloseTo(10.5, 3);
    expect(resultat.compteurs[1]).toBe(10);
  });

  it('des tranches à leur part cible gardent un poids proche de 1', () => {
    // Répartition observée = répartition cible : poids ~1 pour chaque tranche.
    const lignes = Object.entries(QUOTAS_TRANCHE_AGE).map(([tranche, part]) => ({
      option_index: 0,
      tranche_age: tranche,
      nombre_votes: Math.round(part * 1000),
    }));
    const resultat = pondererResultats(lignes, 1);
    for (const poids of Object.values(resultat.poidsParTranche)) {
      expect(poids).toBeGreaterThan(0.97);
      expect(poids).toBeLessThan(1.03);
    }
  });

  it('les moins de 18 ans gardent un poids de 1 (hors cible des quotas)', () => {
    const resultat = pondererResultats(
      [
        { option_index: 0, tranche_age: 'moins_18', nombre_votes: 50 },
        { option_index: 1, tranche_age: '25_34', nombre_votes: 50 },
      ],
      2,
    );
    expect(resultat.compteurs[0]).toBe(50);
  });

  it('ignore les index hors plage sans casser le calcul', () => {
    const resultat = pondererResultats(
      [
        { option_index: 5, tranche_age: null, nombre_votes: 10 },
        { option_index: 0, tranche_age: null, nombre_votes: 3 },
      ],
      2,
    );
    expect(resultat.compteurs).toEqual([3, 0]);
    expect(resultat.total).toBe(3);
  });

  it('un sondage sans vote retourne des compteurs à zéro', () => {
    const resultat = pondererResultats([], 3);
    expect(resultat.compteurs).toEqual([0, 0, 0]);
    expect(resultat.total).toBe(0);
  });
});
