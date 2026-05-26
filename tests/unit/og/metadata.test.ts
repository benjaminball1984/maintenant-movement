import { metadataPourPartage } from '@/lib/og-metadata';
import { describe, expect, it } from 'vitest';

/**
 * Tests pour le helper Open Graph (cycle V2 §10, V2.2.4).
 *
 * Couvre la production des balises critiques : title, description tronquée,
 * URL canonique absolue, image absolue (uploadée vs défaut), type OG.
 */

const OBJET_BASE = {
  titre: 'Pour la dignité de toutes et tous',
  description: 'Une pétition citoyenne adressée aux pouvoirs publics.',
  image_url: null,
  type_objet: 'petition' as const,
};

describe('metadataPourPartage', () => {
  it('expose title, description, openGraph et twitter', () => {
    const m = metadataPourPartage({
      objet: OBJET_BASE,
      cheminPage: '/mobiliser/petitions/dignite',
    });
    expect(m.title).toBe(OBJET_BASE.titre);
    expect(m.description).toBe(OBJET_BASE.description);
    expect(m.openGraph?.title).toBe(OBJET_BASE.titre);
    expect(m.twitter?.title).toBe(OBJET_BASE.titre);
  });

  it('produit une URL canonique absolue à partir de cheminPage', () => {
    const m = metadataPourPartage({
      objet: OBJET_BASE,
      cheminPage: '/mobiliser/petitions/dignite',
    });
    const url = String(m.openGraph?.url ?? m.alternates?.canonical);
    expect(url).toMatch(/^https?:\/\//);
    expect(url).toContain('/mobiliser/petitions/dignite');
  });

  it('utilise l’image par défaut quand image_url est null', () => {
    const m = metadataPourPartage({
      objet: { ...OBJET_BASE, image_url: null },
      cheminPage: '/x',
    });
    const images = m.openGraph?.images;
    const firstImage = Array.isArray(images) ? images[0] : images;
    const url =
      typeof firstImage === 'string'
        ? firstImage
        : firstImage instanceof URL
          ? firstImage.toString()
          : (firstImage?.url ?? '');
    expect(String(url)).toContain('/defaults/petition.svg');
  });

  it('utilise l’image uploadée quand image_url est présent', () => {
    const m = metadataPourPartage({
      objet: { ...OBJET_BASE, image_url: 'https://cdn.exemple.fr/img/p.jpg' },
      cheminPage: '/x',
    });
    const images = m.openGraph?.images;
    const firstImage = Array.isArray(images) ? images[0] : images;
    const url =
      typeof firstImage === 'string'
        ? firstImage
        : firstImage instanceof URL
          ? firstImage.toString()
          : (firstImage?.url ?? '');
    expect(String(url)).toBe('https://cdn.exemple.fr/img/p.jpg');
  });

  it('tronque les descriptions trop longues (200 chars OG)', () => {
    const longue = 'a'.repeat(500);
    const m = metadataPourPartage({
      objet: { ...OBJET_BASE, description: longue },
      cheminPage: '/x',
    });
    expect(String(m.description).length).toBeLessThanOrEqual(200);
    expect(String(m.openGraph?.description).length).toBeLessThanOrEqual(200);
  });

  it('respecte le ogType article quand demandé (Maintenant Médias)', () => {
    const m = metadataPourPartage({
      objet: { ...OBJET_BASE, type_objet: 'article' },
      cheminPage: '/s-informer/media/x',
      ogType: 'article',
    });
    expect((m.openGraph as Record<string, unknown>)?.type).toBe('article');
  });

  it('par défaut, ogType est website', () => {
    const m = metadataPourPartage({ objet: OBJET_BASE, cheminPage: '/x' });
    expect((m.openGraph as Record<string, unknown>)?.type).toBe('website');
  });

  it('produit une URL d’image absolue même quand le chemin est relatif', () => {
    const m = metadataPourPartage({
      objet: { ...OBJET_BASE, image_url: '/uploads/abc.jpg' },
      cheminPage: '/x',
    });
    const images = m.openGraph?.images;
    const firstImage = Array.isArray(images) ? images[0] : images;
    const url =
      typeof firstImage === 'string'
        ? firstImage
        : firstImage instanceof URL
          ? firstImage.toString()
          : (firstImage?.url ?? '');
    expect(String(url)).toMatch(/^https?:\/\//);
    expect(String(url)).toContain('/uploads/abc.jpg');
  });
});
