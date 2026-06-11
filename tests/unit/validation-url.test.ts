import { estUrlImageDurable, estUrlValide, parserUrl } from '@/lib/validation-url';
import { describe, expect, it } from 'vitest';

describe('estUrlValide', () => {
  it('accepte https://', () => {
    expect(estUrlValide('https://example.com')).toBe(true);
    expect(estUrlValide('https://example.com/foo/bar?a=1')).toBe(true);
  });

  it('accepte http://', () => {
    expect(estUrlValide('http://example.com')).toBe(true);
  });

  it('refuse javascript:', () => {
    expect(estUrlValide('javascript:alert(1)')).toBe(false);
  });

  it('refuse data:', () => {
    expect(estUrlValide('data:text/html,<script>')).toBe(false);
  });

  it('refuse file:', () => {
    expect(estUrlValide('file:///etc/passwd')).toBe(false);
  });

  it('refuse pas d’URL', () => {
    expect(estUrlValide('pas une URL')).toBe(false);
    expect(estUrlValide('example.com')).toBe(false); // pas de scheme
  });

  it('refuse vide / null', () => {
    expect(estUrlValide('')).toBe(false);
    expect(estUrlValide(null)).toBe(false);
    expect(estUrlValide(undefined)).toBe(false);
  });

  it('trim avant validation', () => {
    expect(estUrlValide('  https://example.com  ')).toBe(true);
  });

  it('respecte schemas custom', () => {
    expect(estUrlValide('mailto:foo@bar.com', { schemas: ['mailto:'] })).toBe(true);
    expect(estUrlValide('https://example.com', { schemas: ['mailto:'] })).toBe(false);
  });

  it('respecte allowlist de domaines', () => {
    expect(estUrlValide('https://example.com', { allowlistDomaines: ['example.com'] })).toBe(true);
    expect(estUrlValide('https://malveillant.com', { allowlistDomaines: ['example.com'] })).toBe(
      false,
    );
  });

  it('allowlist matche hostname exact (pas de sous-domaines)', () => {
    expect(estUrlValide('https://sub.example.com', { allowlistDomaines: ['example.com'] })).toBe(
      false,
    );
  });
});

describe('parserUrl', () => {
  it('parse une URL valide', () => {
    const r = parserUrl('https://example.com/foo');
    expect(r?.hostname).toBe('example.com');
    expect(r?.pathname).toBe('/foo');
  });

  it('retourne null si invalide', () => {
    expect(parserUrl('pas une URL')).toBeNull();
    expect(parserUrl(null)).toBeNull();
    expect(parserUrl('')).toBeNull();
  });

  it('trim avant parsing', () => {
    expect(parserUrl('  https://example.com  ')?.hostname).toBe('example.com');
  });
});

describe('estUrlImageDurable', () => {
  it('refuse les CDN éphémères Facebook/Instagram (domaine exact)', () => {
    expect(estUrlImageDurable('https://fbcdn.net/photo.jpg')).toBe(false);
    expect(estUrlImageDurable('https://cdninstagram.com/photo.jpg')).toBe(false);
    expect(estUrlImageDurable('https://fbsbx.com/photo.jpg')).toBe(false);
  });

  it('refuse aussi les sous-domaines de ces CDN', () => {
    expect(estUrlImageDurable('https://scontent-cdg4-1.xx.fbcdn.net/v/photo.jpg')).toBe(false);
    expect(estUrlImageDurable('https://scontent.cdninstagram.com/photo.jpg')).toBe(false);
  });

  it('accepte les autres domaines, y compris les noms ressemblants', () => {
    expect(estUrlImageDurable('https://exemple.org/photo.jpg')).toBe(true);
    // « monfbcdn.net » n'est PAS un sous-domaine de fbcdn.net : durable.
    expect(estUrlImageDurable('https://monfbcdn.net/photo.jpg')).toBe(true);
  });

  it('laisse passer les URLs invalides (gérées par les autres validations)', () => {
    expect(estUrlImageDurable('pas une URL')).toBe(true);
    expect(estUrlImageDurable('')).toBe(true);
  });
});
