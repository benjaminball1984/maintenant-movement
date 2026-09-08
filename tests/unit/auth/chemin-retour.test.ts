import { CHEMIN_APRES_CONNEXION_DEFAUT, cheminInterneOuDefaut } from '@/lib/auth/chemin-retour';
import { describe, expect, it } from 'vitest';

describe('cheminInterneOuDefaut', () => {
  it('garde un chemin interne', () => {
    expect(cheminInterneOuDefaut('/s-informer/sondages/presidentielle')).toBe(
      '/s-informer/sondages/presidentielle',
    );
    expect(cheminInterneOuDefaut('/agir/adherer/gratuit')).toBe('/agir/adherer/gratuit');
  });

  it('retombe sur le tableau de bord quand rien n’est demandé', () => {
    expect(cheminInterneOuDefaut(undefined)).toBe(CHEMIN_APRES_CONNEXION_DEFAUT);
    expect(cheminInterneOuDefaut(null)).toBe(CHEMIN_APRES_CONNEXION_DEFAUT);
    expect(cheminInterneOuDefaut('')).toBe(CHEMIN_APRES_CONNEXION_DEFAUT);
  });

  // Le cœur du garde-fou : sans lui, la page de connexion du mouvement
  // devient un tremplin d'hameçonnage (on se connecte chez nous, on
  // atterrit chez eux).
  it('refuse tout ce qui pourrait sortir du site', () => {
    for (const hostile of [
      '//evil.com',
      '/\\evil.com',
      'https://evil.com',
      'http://evil.com',
      'evil.com',
      'javascript:alert(1)',
    ]) {
      expect(cheminInterneOuDefaut(hostile)).toBe(CHEMIN_APRES_CONNEXION_DEFAUT);
    }
  });
});
