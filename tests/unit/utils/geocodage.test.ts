import { candidatsGeocodage } from '@/lib/geocodage';
import { describe, expect, it } from 'vitest';

/**
 * Tests de la construction des requêtes candidates de géocodage
 * (lib/geocodage.ts). La fonction est pure : on vérifie l'ordre
 * du plus précis au plus large, et les garde-fous d'entrée.
 */
describe('candidatsGeocodage', () => {
  it('renvoie le lieu complet en premier candidat', () => {
    const candidats = candidatsGeocodage('12 rue de la Paix, 75002 Paris');
    expect(candidats[0]).toBe('12 rue de la Paix, 75002 Paris');
  });

  it('propose ensuite le lieu sans son premier segment (nom de salle)', () => {
    const candidats = candidatsGeocodage("Bourse du travail, 3 rue du Château d'Eau, 75010 Paris");
    expect(candidats[1]).toBe("3 rue du Château d'Eau, 75010 Paris");
  });

  it('retombe sur code postal + ville en dernier recours', () => {
    const candidats = candidatsGeocodage("Bourse du travail, 3 rue du Château d'Eau, 75010 Paris");
    expect(candidats.at(-1)).toBe('75010 Paris');
  });

  it("retombe sur le dernier segment quand il n'y a pas de code postal", () => {
    const candidats = candidatsGeocodage('Place des Fêtes, Paris');
    expect(candidats).toEqual(['Place des Fêtes, Paris', 'Paris']);
  });

  it('normalise les espaces multiples et les bords', () => {
    const candidats = candidatsGeocodage('  Place  de la République,   Paris ');
    expect(candidats[0]).toBe('Place de la République, Paris');
  });

  it('ne produit pas de doublons', () => {
    const candidats = candidatsGeocodage('Paris, Paris');
    expect(candidats).toEqual(['Paris, Paris', 'Paris']);
  });

  it('renvoie une liste vide pour un lieu vide ou trop court', () => {
    expect(candidatsGeocodage('')).toEqual([]);
    expect(candidatsGeocodage('  a ')).toEqual([]);
  });

  it("un lieu d'un seul segment ne produit qu'un candidat", () => {
    expect(candidatsGeocodage('Montreuil')).toEqual(['Montreuil']);
  });

  it("repère l'adresse au numéro de voie dans un lieu sans virgules", () => {
    const candidats = candidatsGeocodage('Sud Education 30 bis Rue des Boulets 75011 Paris');
    expect(candidats).toContain('30 bis Rue des Boulets 75011 Paris');
    expect(candidats.at(-1)).toBe('75011 Paris');
  });

  it("ignore un nombre qui n'introduit pas une voie (Mairie du 10eme)", () => {
    const candidats = candidatsGeocodage(
      'Mairie du 10eme 72 Rue du Faubourg Saint-Martin 75010 Paris',
    );
    expect(candidats).toContain('72 Rue du Faubourg Saint-Martin 75010 Paris');
  });

  it('extrait la ville après le code postal en ignorant le suffixe France', () => {
    const candidats = candidatsGeocodage('Librairie Publico 145 Rue Amelot, 75011, Paris, France');
    expect(candidats.at(-1)).toBe('75011 Paris');
  });
});
