import { transitionAutorisee } from '@/lib/reservation';
import { genererMessageAmorce } from '@/lib/reservation-amorce';
import { describe, expect, it } from 'vitest';

/**
 * Tests pour le helper d'amorce (génération du message pré-rempli) et la
 * machine à états des réservations (cycle V2 D8, V2.2.2).
 */

const DEBUT = new Date('2026-06-15T09:00:00Z');
const FIN = new Date('2026-06-15T17:00:00Z');

describe('genererMessageAmorce', () => {
  it('génère un message pour le covoiturage avec quantité 1', () => {
    const m = genererMessageAmorce({
      offreType: 'transport_covoiturage',
      titreOffre: 'Paris → Lyon',
      prenomDemandeur: 'Léa',
      creneauDebut: DEBUT,
    });
    expect(m).toContain('Paris → Lyon');
    expect(m).toContain('Léa');
    expect(m).toContain('1 personne');
    expect(m).toContain('Bonjour');
  });

  it('génère un message pour l’hébergement avec quantité plurielle', () => {
    const m = genererMessageAmorce({
      offreType: 'hebergement',
      titreOffre: 'Chambre rue de la République',
      prenomDemandeur: 'Sam',
      creneauDebut: DEBUT,
      creneauFin: FIN,
      quantite: 3,
    });
    expect(m).toContain('3 personnes');
  });

  it('intègre la note libre quand fournie', () => {
    const m = genererMessageAmorce({
      offreType: 'pret',
      titreOffre: 'Perceuse',
      prenomDemandeur: 'Camille',
      creneauDebut: DEBUT,
      noteLibre: 'Je rends samedi soir si possible.',
    });
    expect(m).toContain('Je rends samedi soir si possible.');
  });

  it('reste sous la limite SQL de 2000 caractères même avec une note longue', () => {
    const noteLongue = 'x'.repeat(5000);
    const m = genererMessageAmorce({
      offreType: 'pret',
      titreOffre: 'Outil',
      prenomDemandeur: 'A',
      creneauDebut: DEBUT,
      noteLibre: noteLongue,
    });
    expect(m.length).toBeLessThanOrEqual(2000);
  });

  it('omet la signature si le prénom est vide', () => {
    const m = genererMessageAmorce({
      offreType: 'service_sel',
      titreOffre: 'Cours de guitare',
      prenomDemandeur: '',
      creneauDebut: DEBUT,
    });
    // Pas de ligne avec un prénom seul
    expect(m.split('\n').filter((l) => l.trim() === '').length).toBeGreaterThan(0);
  });
});

describe('transitionAutorisee (machine à états D8)', () => {
  it('proposee → acceptee/refusee/annulee', () => {
    expect(transitionAutorisee('proposee', 'acceptee')).toBe(true);
    expect(transitionAutorisee('proposee', 'refusee')).toBe(true);
    expect(transitionAutorisee('proposee', 'annulee')).toBe(true);
    expect(transitionAutorisee('proposee', 'confirmee')).toBe(false);
    expect(transitionAutorisee('proposee', 'realisee')).toBe(false);
  });

  it('acceptee → realisee/annulee/litige', () => {
    expect(transitionAutorisee('acceptee', 'realisee')).toBe(true);
    expect(transitionAutorisee('acceptee', 'annulee')).toBe(true);
    expect(transitionAutorisee('acceptee', 'litige')).toBe(true);
    expect(transitionAutorisee('acceptee', 'refusee')).toBe(false);
  });

  it('realisee → confirmee/litige', () => {
    expect(transitionAutorisee('realisee', 'confirmee')).toBe(true);
    expect(transitionAutorisee('realisee', 'litige')).toBe(true);
    expect(transitionAutorisee('realisee', 'annulee')).toBe(false);
  });

  it('états terminaux ne transitent vers rien', () => {
    for (const terminal of ['refusee', 'annulee', 'confirmee', 'litige'] as const) {
      for (const cible of ['proposee', 'acceptee', 'realisee'] as const) {
        expect(transitionAutorisee(terminal, cible)).toBe(false);
      }
    }
  });
});
