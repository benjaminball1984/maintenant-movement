import { type LigneAmitie, deriverStatutAmitie } from '@/lib/reseau/amitie';
import { describe, expect, it } from 'vitest';

/**
 * Tests de la dérivation pure du statut d'amitié (épopée réseau V2, chantier
 * D.1). Couvre la machine à états du point de vue du lecteur.
 */
describe('deriverStatutAmitie', () => {
  const MOI = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const AUTRE = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  it('renvoie « amis » pour une amitié acceptée, quel que soit le sens', () => {
    const a: LigneAmitie = { demandeur_id: MOI, destinataire_id: AUTRE, statut: 'acceptee' };
    const b: LigneAmitie = { demandeur_id: AUTRE, destinataire_id: MOI, statut: 'acceptee' };
    expect(deriverStatutAmitie(a, MOI)).toBe('amis');
    expect(deriverStatutAmitie(b, MOI)).toBe('amis');
  });

  it('renvoie « demande_envoyee » quand je suis le demandeur d’une demande en attente', () => {
    const ligne: LigneAmitie = { demandeur_id: MOI, destinataire_id: AUTRE, statut: 'en_attente' };
    expect(deriverStatutAmitie(ligne, MOI)).toBe('demande_envoyee');
  });

  it('renvoie « demande_recue » quand je suis le destinataire d’une demande en attente', () => {
    const ligne: LigneAmitie = { demandeur_id: AUTRE, destinataire_id: MOI, statut: 'en_attente' };
    expect(deriverStatutAmitie(ligne, MOI)).toBe('demande_recue');
  });

  it('retombe sur « aucune » pour un statut inattendu (défensif)', () => {
    const ligne: LigneAmitie = { demandeur_id: MOI, destinataire_id: AUTRE, statut: 'refusee' };
    expect(deriverStatutAmitie(ligne, MOI)).toBe('aucune');
  });
});
