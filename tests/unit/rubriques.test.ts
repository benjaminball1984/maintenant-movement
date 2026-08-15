import { CHEMINS_SOMMEIL, RUBRIQUES_MENU, estEnSommeil } from '@/config/rubriques';
import { describe, expect, it } from 'vitest';

/**
 * Ces tests protègent la règle « le préfixe le plus long gagne ».
 * Sans elle, éteindre `/mobiliser` éteindrait aussi les pétitions —
 * c'est-à-dire la rubrique la plus importante du site.
 */
describe('estEnSommeil', () => {
  it('éteint les anciennes pages d’espace', () => {
    expect(estEnSommeil('/mobiliser')).toBe(true);
    expect(estEnSommeil('/s-informer')).toBe(true);
    expect(estEnSommeil('/agir')).toBe(true);
    expect(estEnSommeil('/comprendre')).toBe(true);
  });

  it('garde allumées les rubriques du menu, sous un préfixe éteint', () => {
    for (const rubrique of RUBRIQUES_MENU) {
      expect(estEnSommeil(rubrique.href)).toBe(false);
    }
  });

  it('garde allumées les pages filles des rubriques du menu', () => {
    expect(estEnSommeil('/mobiliser/petitions/stop-aux-pesticides')).toBe(false);
    expect(estEnSommeil('/mobiliser/mobilisations/nouvelle')).toBe(false);
    expect(estEnSommeil('/s-informer/media/edito-de-juillet')).toBe(false);
  });

  it('éteint les cagnottes tant qu’aucune n’est publiée', () => {
    // Endormies le 01/08/2026 : rubrique vide + encaissement non branché.
    expect(estEnSommeil('/mobiliser/cagnottes')).toBe(true);
    expect(estEnSommeil('/mobiliser/cagnottes/nouvelle')).toBe(true);
  });

  it('éteint les rubriques voisines non gardées', () => {
    expect(estEnSommeil('/mobiliser/campagnes')).toBe(true);
    expect(estEnSommeil('/s-informer/radio')).toBe(true);
    expect(estEnSommeil('/s-informer/reseau/messages')).toBe(true);
    expect(estEnSommeil('/s-entraider/sel')).toBe(true);
  });

  it('garde l’adhésion gratuite et éteint les chemins payants', () => {
    // 15/08/2026 : une seule adhésion, gratuite. Les parcours payants
    // existent toujours dans le code mais ne sont plus atteignables.
    expect(estEnSommeil('/agir/adherer')).toBe(false);
    expect(estEnSommeil('/agir/adherer/gratuit')).toBe(false);
    expect(estEnSommeil('/agir/adherer/euros')).toBe(true);
    expect(estEnSommeil('/agir/adherer/t99cp')).toBe(true);
  });

  it('met la carte des mobilisations en sourdine sans toucher à l’agenda', () => {
    expect(estEnSommeil('/cartes')).toBe(true);
    expect(estEnSommeil('/cartes/hebergements')).toBe(true);
    expect(estEnSommeil('/agenda')).toBe(false);
    expect(estEnSommeil('/mobiliser/mobilisations')).toBe(false);
  });

  it('éteint le simulateur de paiement', () => {
    expect(estEnSommeil('/dons/mock/cs_mock_confirme_abc')).toBe(true);
    expect(estEnSommeil('/dons/retour')).toBe(false);
  });

  it('laisse passer l’accueil, les pages légales et les routes techniques', () => {
    expect(estEnSommeil('/')).toBe(false);
    expect(estEnSommeil('/mentions-legales')).toBe(false);
    expect(estEnSommeil('/confidentialite')).toBe(false);
    expect(estEnSommeil('/contact')).toBe(false);
    expect(estEnSommeil('/connexion')).toBe(false);
    expect(estEnSommeil('/profil')).toBe(false);
    expect(estEnSommeil('/admin/petitions')).toBe(false);
    expect(estEnSommeil('/api/health')).toBe(false);
  });

  it('ne se laisse pas piéger par un préfixe partiel', () => {
    // `/agirons` commence par `/agir` sans en être une sous-page.
    expect(estEnSommeil('/agirons')).toBe(false);
    // `/agendas` commence par `/agenda` (actif) sans en être une sous-page.
    expect(estEnSommeil('/agendas')).toBe(false);
  });

  it('ne déclare aucun chemin à la fois actif et endormi par erreur', () => {
    // Garde-fou : toute rubrique du menu doit rester joignable même si
    // quelqu'un ajoute son préfixe parent à la liste des sommeils.
    for (const chemin of CHEMINS_SOMMEIL) {
      const rubriqueCassee = RUBRIQUES_MENU.find((r) => r.href === chemin);
      expect(rubriqueCassee).toBeUndefined();
    }
  });
});
