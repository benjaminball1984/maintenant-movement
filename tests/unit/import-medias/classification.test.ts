import { nettoyerTitreLive } from '@/lib/import-medias/importer-medias';
import { describe, expect, it } from 'vitest';

/**
 * Nettoyage des badges de direct (V2.6.116) : un flux RSS/YouTube ne sert que
 * des REDIFFUSIONS (pas de statut « en cours »), donc tout y est stocké en
 * `video` et le type `live` est réservé à Twitch (temps réel). On se contente
 * de retirer du titre le badge « direct » trompeur (constat Ben 2026-06-14 :
 * l'onglet Lives se remplissait de rediffusions YouTube titrées « 🔴 »).
 */
describe('nettoyerTitreLive', () => {
  it('retire les badges de direct en tête ou en queue', () => {
    expect(nettoyerTitreLive('🔴 EN DIRECT - débat sur les retraites')).toBe(
      'débat sur les retraites',
    );
    expect(nettoyerTitreLive('EN DIRECT : conférence de presse')).toBe('conférence de presse');
    expect(nettoyerTitreLive('Grand débat [DIRECT]')).toBe('Grand débat');
    expect(nettoyerTitreLive('I.A. va-t-elle survivre ? Gilles Babinet [EN DIRECT]')).toBe(
      'I.A. va-t-elle survivre ? Gilles Babinet',
    );
    expect(nettoyerTitreLive('🔴 "Le pouvoir culturel à droite" : l\'enquête')).toBe(
      '"Le pouvoir culturel à droite" : l\'enquête',
    );
  });

  it('laisse intact un titre sans badge', () => {
    expect(nettoyerTitreLive('Blocage de Bayer par des paysan·nes près de Rennes')).toBe(
      'Blocage de Bayer par des paysan·nes près de Rennes',
    );
    expect(nettoyerTitreLive('DE NAHEL À LYHANNA : QUI PROTÈGE DARMANIN ?')).toBe(
      'DE NAHEL À LYHANNA : QUI PROTÈGE DARMANIN ?',
    );
  });

  it('ne touche pas au mot « direct » ou « live » employé dans une phrase', () => {
    expect(nettoyerTitreLive('La nouvelle directive européenne')).toBe(
      'La nouvelle directive européenne',
    );
    expect(nettoyerTitreLive('Action directe : enquête')).toBe('Action directe : enquête');
    expect(nettoyerTitreLive('Rester en vie, rester alive')).toBe('Rester en vie, rester alive');
    expect(nettoyerTitreLive('Notre LIVE de ce soir')).toBe('Notre LIVE de ce soir');
  });
});
