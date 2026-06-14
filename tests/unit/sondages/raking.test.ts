import { croiserParVariable } from '@/lib/sondages/croisements';
import { effetDePlan, intervalle95, margeErreur95, nEffectif } from '@/lib/sondages/fiabilite';
import {
  type RepondantQuota,
  agregerPondere,
  calculerPoidsRaking,
  margesRedressement,
} from '@/lib/sondages/raking';
import { describe, expect, it } from 'vitest';

function partPonderee(
  repondants: RepondantQuota[],
  poids: number[],
  cle: string,
  modalite: string,
): number {
  let num = 0;
  let den = 0;
  for (let i = 0; i < repondants.length; i += 1) {
    const w = poids[i] ?? 0;
    den += w;
    if (repondants[i]?.reponses[cle] === modalite) num += w;
  }
  return den > 0 ? num / den : 0;
}

describe('raking (calage sur marges)', () => {
  it('redresse une variable : 80/20 observé → 50/50 cible', () => {
    const repondants: RepondantQuota[] = [
      ...Array.from({ length: 8 }, () => ({ optionIndex: 0, reponses: { genre: 'H' } })),
      ...Array.from({ length: 2 }, () => ({ optionIndex: 1, reponses: { genre: 'F' } })),
    ];
    const marges = new Map([
      [
        'genre',
        new Map([
          ['H', 0.5],
          ['F', 0.5],
        ]),
      ],
    ]);
    const { poids, convergence } = calculerPoidsRaking(repondants, marges);
    expect(convergence).toBe(true);
    expect(partPonderee(repondants, poids, 'genre', 'H')).toBeCloseTo(0.5, 4);
    // La somme des poids est normalisée au nombre de répondant·es.
    expect(poids.reduce((s, w) => s + w, 0)).toBeCloseTo(10, 6);
  });

  it('converge sur DEUX variables corrélées (genre + âge) vers les deux marges', () => {
    const mk = (g: string, a: string, n: number): RepondantQuota[] =>
      Array.from({ length: n }, () => ({ optionIndex: 0, reponses: { genre: g, age: a } }));
    const repondants = [
      ...mk('H', 'jeune', 4),
      ...mk('H', 'vieux', 1),
      ...mk('F', 'jeune', 1),
      ...mk('F', 'vieux', 4),
    ];
    const marges = new Map([
      [
        'genre',
        new Map([
          ['H', 0.5],
          ['F', 0.5],
        ]),
      ],
      [
        'age',
        new Map([
          ['jeune', 0.5],
          ['vieux', 0.5],
        ]),
      ],
    ]);
    const { poids } = calculerPoidsRaking(repondants, marges);
    expect(partPonderee(repondants, poids, 'genre', 'H')).toBeCloseTo(0.5, 2);
    expect(partPonderee(repondants, poids, 'age', 'jeune')).toBeCloseTo(0.5, 2);
  });

  it('un échantillon déjà représentatif garde des poids ≈ 1', () => {
    const repondants: RepondantQuota[] = [
      { optionIndex: 0, reponses: { genre: 'H' } },
      { optionIndex: 1, reponses: { genre: 'F' } },
    ];
    const marges = new Map([
      [
        'genre',
        new Map([
          ['H', 0.5],
          ['F', 0.5],
        ]),
      ],
    ]);
    const { poids } = calculerPoidsRaking(repondants, marges);
    expect(poids[0]).toBeCloseTo(1, 6);
    expect(poids[1]).toBeCloseTo(1, 6);
  });
});

describe('agrégation pondérée + effet de plan', () => {
  it('poids uniformes : n effectif = n, effet de plan = 1', () => {
    const repondants: RepondantQuota[] = Array.from({ length: 4 }, (_, i) => ({
      optionIndex: i % 2,
      reponses: {},
    }));
    const poids = [1, 1, 1, 1];
    const agg = agregerPondere(repondants, poids, 2);
    expect(agg.totaux).toEqual([2, 2]);
    expect(agg.nEffectif).toBeCloseTo(4, 6);
    expect(agg.effetDePlan).toBeCloseTo(1, 6);
  });

  it('poids inégaux : effet de plan > 1 et n effectif < n', () => {
    const poids = [3, 1, 1, 1];
    expect(nEffectif(poids)).toBeLessThan(4);
    expect(effetDePlan(poids)).toBeGreaterThan(1);
  });
});

describe('marge d’erreur', () => {
  it('±3,1 points à p=50 % et n=1000', () => {
    expect(margeErreur95(0.5, 1000)).toBeCloseTo(0.031, 3);
  });
  it('l’intervalle est borné à [0, 1] et plus large quand n est petit', () => {
    expect(margeErreur95(0.5, 100)).toBeGreaterThan(margeErreur95(0.5, 1000));
    const iv = intervalle95(0.02, 50);
    expect(iv.bas).toBeGreaterThanOrEqual(0);
    expect(iv.haut).toBeLessThanOrEqual(1);
  });
});

describe('croisements (vote × profil)', () => {
  it('calcule la répartition par modalité et marque les petits groupes non fiables', () => {
    const repondants: RepondantQuota[] = [
      ...Array.from({ length: 40 }, () => ({ optionIndex: 0, reponses: { csp: 'Ouvrier·ère' } })),
      ...Array.from({ length: 10 }, () => ({ optionIndex: 1, reponses: { csp: 'Ouvrier·ère' } })),
      ...Array.from({ length: 5 }, () => ({ optionIndex: 0, reponses: { csp: 'Cadre' } })),
    ];
    const poids = repondants.map(() => 1);
    const c = croiserParVariable(repondants, poids, 2, 'csp', ['Ouvrier·ère', 'Cadre']);
    const ouvriers = c.colonnes[0];
    const cadres = c.colonnes[1];
    expect(ouvriers?.nBrut).toBe(50);
    expect(ouvriers?.pourcentages[0]).toBeCloseTo(0.8, 6);
    expect(ouvriers?.fiable).toBe(true);
    expect(cadres?.nBrut).toBe(5);
    expect(cadres?.fiable).toBe(false);
  });
});

describe('intégration avec les marges réelles', () => {
  it('margesRedressement() fournit des cibles normalisées par variable', () => {
    const table = margesRedressement();
    expect(table.has('genre')).toBe(true);
    expect(table.get('genre')?.get('Homme')).toBeCloseTo(0.478, 3);
    expect(table.has('presidentielle_2022')).toBe(true);
  });
});
