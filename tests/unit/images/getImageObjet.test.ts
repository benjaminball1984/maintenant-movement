import { getImageObjet } from '@/lib/images';
import { IMAGES_DEFAUT, TYPES_OBJETS, imageDefautPour } from '@/lib/images-defaut';
import { describe, expect, it } from 'vitest';

/**
 * Tests du helper unifié de résolution d'image (exigence ET1 + ET2 du
 * cycle V2). La règle métier centrale est simple :
 *
 *   image téléversée gagne > sinon image par défaut du type > sinon générique
 */

describe('imageDefautPour', () => {
  it('renvoie le chemin défini pour chaque type connu', () => {
    for (const type of TYPES_OBJETS) {
      expect(imageDefautPour(type)).toBe(IMAGES_DEFAUT[type]);
    }
  });

  it('retombe sur le défaut "generique" pour un type inconnu', () => {
    expect(imageDefautPour('type_qui_nexiste_pas')).toBe(IMAGES_DEFAUT.generique);
  });

  it('couvre tous les types listés dans TYPES_OBJETS dans la matrice', () => {
    for (const type of TYPES_OBJETS) {
      expect(IMAGES_DEFAUT[type]).toBeDefined();
    }
  });
});

describe('getImageObjet', () => {
  it('renvoie l’image téléversée quand image_url est présent et non vide', () => {
    const url = 'https://example.org/uploads/abc.jpg';
    expect(getImageObjet({ image_url: url, type_objet: 'petition' })).toBe(url);
  });

  it('renvoie l’image par défaut quand image_url est null', () => {
    expect(getImageObjet({ image_url: null, type_objet: 'petition' })).toBe(IMAGES_DEFAUT.petition);
  });

  it('renvoie l’image par défaut quand image_url est undefined', () => {
    expect(getImageObjet({ type_objet: 'cagnotte' })).toBe(IMAGES_DEFAUT.cagnotte);
  });

  it('traite une chaîne vide comme absente (espace insécable inclus)', () => {
    expect(getImageObjet({ image_url: '', type_objet: 'commune' })).toBe(IMAGES_DEFAUT.commune);
    expect(getImageObjet({ image_url: '   ', type_objet: 'commune' })).toBe(IMAGES_DEFAUT.commune);
  });

  it('retombe sur generique pour un type inconnu sans image téléversée', () => {
    expect(getImageObjet({ image_url: null, type_objet: 'truc_inexistant' })).toBe(
      IMAGES_DEFAUT.generique,
    );
  });
});
