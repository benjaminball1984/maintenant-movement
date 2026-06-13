import { estLiveDApresTitre } from '@/lib/import-medias/importer-medias';
import { describe, expect, it } from 'vitest';

/**
 * Classification live/vidéo (V2.6.114) : le flux YouTube n'indique pas le
 * direct, donc on ne marque « live » que si le TITRE le signale (constat Ben
 * 2026-06-13 : trop de vidéos classées « live » à tort).
 */
describe('estLiveDApresTitre', () => {
  it('reconnaît un direct au titre', () => {
    expect(estLiveDApresTitre('🔴 EN DIRECT - débat sur les retraites')).toBe(true);
    expect(estLiveDApresTitre('EN DIRECT : conférence de presse')).toBe(true);
    expect(estLiveDApresTitre('Notre LIVE de ce soir')).toBe(true);
    expect(estLiveDApresTitre('Grand débat [DIRECT]')).toBe(true);
  });

  it('classe une vidéo normale en NON-live', () => {
    expect(estLiveDApresTitre('Blocage de Bayer par des paysan·nes près de Rennes')).toBe(false);
    expect(estLiveDApresTitre('DE NAHEL À LYHANNA : QUI PROTÈGE DARMANIN ?')).toBe(false);
  });

  it('ne se laisse pas piéger par les mots contenant « direct » ou « live »', () => {
    expect(estLiveDApresTitre('La nouvelle directive européenne')).toBe(false);
    expect(estLiveDApresTitre('Action directe : enquête')).toBe(false);
    expect(estLiveDApresTitre('Rester en vie, rester alive')).toBe(false);
  });
});
