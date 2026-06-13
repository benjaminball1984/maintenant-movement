import {
  type Cellule,
  MOSAIQUE_HAUTEUR,
  MOSAIQUE_LARGEUR,
  cellulesMosaique,
  decouperLignes,
  grilleMosaique,
  hauteurBandeau,
  interligneTitre,
  tailleTitre,
} from '@/lib/sondages/mosaique-layout';
import { describe, expect, it } from 'vitest';

/**
 * Tests de la mise en page PURE de la mosaïque de couverture des sondages
 * (V2.6.111). Aucun canvas ici : on vérifie la géométrie (grille, cellules,
 * bandeau) et le découpage de texte, indépendamment du rendu navigateur.
 */

describe('grilleMosaique', () => {
  it('privilégie peu de lignes selon le nombre d’options', () => {
    expect(grilleMosaique(2)).toEqual({ colonnes: 2, lignes: 1 });
    expect(grilleMosaique(3)).toEqual({ colonnes: 3, lignes: 1 });
    expect(grilleMosaique(4)).toEqual({ colonnes: 2, lignes: 2 });
    expect(grilleMosaique(6)).toEqual({ colonnes: 3, lignes: 2 });
    expect(grilleMosaique(12)).toEqual({ colonnes: 6, lignes: 2 });
    expect(grilleMosaique(18)).toEqual({ colonnes: 9, lignes: 2 });
    expect(grilleMosaique(20)).toEqual({ colonnes: 7, lignes: 3 });
  });

  it('borne le nombre d’options à l’intervalle réel (1..20)', () => {
    expect(grilleMosaique(0)).toEqual({ colonnes: 1, lignes: 1 });
    expect(grilleMosaique(-5)).toEqual({ colonnes: 1, lignes: 1 });
    expect(grilleMosaique(1)).toEqual({ colonnes: 1, lignes: 1 });
    expect(grilleMosaique(25)).toEqual({ colonnes: 7, lignes: 3 });
  });
});

describe('cellulesMosaique', () => {
  it('produit exactement une cellule par option, indexée dans l’ordre', () => {
    const cellules = cellulesMosaique(6, 200);
    expect(cellules).toHaveLength(6);
    expect(cellules.map((c) => c.index)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('place les cellules sous le bandeau, dans le cadre 1200x630', () => {
    const bandeau = 200;
    const cellules = cellulesMosaique(18, bandeau);
    for (const c of cellules) {
      expect(c.x).toBeGreaterThanOrEqual(-0.001);
      expect(c.y).toBeGreaterThanOrEqual(bandeau - 0.001);
      expect(c.x + c.largeur).toBeLessThanOrEqual(MOSAIQUE_LARGEUR + 0.001);
      expect(c.y + c.hauteur).toBeLessThanOrEqual(MOSAIQUE_HAUTEUR + 0.001);
    }
  });

  it('centre horizontalement une dernière ligne incomplète', () => {
    // 5 options → grille 3 colonnes x 2 lignes, dernière ligne = 2 éléments.
    const cellules = cellulesMosaique(5, 200);
    const largeurCol = MOSAIQUE_LARGEUR / 3;
    const derniereLigne = cellules.filter((c) => c.index >= 3);
    expect(derniereLigne).toHaveLength(2);
    const [premiere, seconde] = derniereLigne;
    if (premiere === undefined || seconde === undefined) throw new Error('cellules manquantes');
    // Décalage de centrage attendu : (3 - 2) * largeurCol / 2.
    expect(premiere.x).toBeCloseTo(largeurCol / 2, 3);
    expect(seconde.x).toBeCloseTo(largeurCol / 2 + largeurCol, 3);
  });

  it('applique la gouttière en réduisant la taille et en décalant', () => {
    const sansGouttiere = cellulesMosaique(4, 200)[0] as Cellule;
    const avecGouttiere = cellulesMosaique(4, 200, { gouttiere: 8 })[0] as Cellule;
    expect(avecGouttiere.largeur).toBeCloseTo(sansGouttiere.largeur - 8, 3);
    expect(avecGouttiere.x).toBeCloseTo(sansGouttiere.x + 4, 3);
  });
});

describe('hauteurBandeau', () => {
  it('croît avec le nombre de lignes et reste plafonnée', () => {
    expect(hauteurBandeau(1)).toBe(146);
    expect(hauteurBandeau(2)).toBe(200);
    expect(hauteurBandeau(3)).toBe(230);
    expect(hauteurBandeau(4)).toBe(252);
    // Au-delà de 4 lignes, on plafonne le nombre de lignes pris en compte.
    expect(hauteurBandeau(7)).toBe(252);
    expect(hauteurBandeau(1)).toBeLessThan(hauteurBandeau(2));
    expect(hauteurBandeau(2)).toBeLessThan(hauteurBandeau(3));
  });
});

describe('interligneTitre / tailleTitre', () => {
  it('réduit l’interligne et la police quand il y a plus de lignes', () => {
    expect(interligneTitre(2)).toBeGreaterThan(interligneTitre(3));
    expect(interligneTitre(3)).toBeGreaterThan(interligneTitre(4));
    expect(tailleTitre(2)).toBeGreaterThan(tailleTitre(3));
    expect(tailleTitre(3)).toBeGreaterThan(tailleTitre(4));
  });
});

describe('decouperLignes', () => {
  // Mesure simulée : 1 unité par caractère (largeur « en caractères »).
  const mesurer = (s: string) => s.length;

  it('renvoie une seule ligne quand tout tient', () => {
    expect(decouperLignes('court', 20, mesurer)).toEqual(['court']);
  });

  it('coupe sur les espaces quand la largeur est dépassée', () => {
    expect(decouperLignes('aaa bbb ccc', 7, mesurer)).toEqual(['aaa bbb', 'ccc']);
  });

  it('tronque la dernière ligne avec « … » au-delà de maxLignes', () => {
    const lignes = decouperLignes('aa bb cc dd ee', 5, mesurer, 2);
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toBe('aa bb');
    expect(lignes[1] ?? '').toMatch(/…$/);
  });

  it('gère une chaîne vide', () => {
    expect(decouperLignes('   ', 10, mesurer)).toEqual(['']);
  });
});
