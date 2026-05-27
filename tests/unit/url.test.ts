import { extraireDomaine, lienPartageMailto, lienPartageMastodon, urlAbsolue } from '@/lib/url';
import { describe, expect, it } from 'vitest';

describe('urlAbsolue', () => {
  it('concatène base + chemin', () => {
    expect(urlAbsolue('https://example.com', '/foo')).toBe('https://example.com/foo');
  });

  it('gère slash final dans base', () => {
    expect(urlAbsolue('https://example.com/', '/foo')).toBe('https://example.com/foo');
  });

  it('gère chemin sans slash initial', () => {
    expect(urlAbsolue('https://example.com', 'foo')).toBe('https://example.com/foo');
  });

  it('garde les chemins déjà absolus', () => {
    expect(urlAbsolue('https://example.com', 'https://autre.com/bar')).toBe(
      'https://autre.com/bar',
    );
  });

  it('conserve query string et fragment', () => {
    expect(urlAbsolue('https://example.com', '/foo?a=1#bar')).toBe(
      'https://example.com/foo?a=1#bar',
    );
  });

  it('normalise les doubles slashs au milieu (pas après scheme)', () => {
    expect(urlAbsolue('https://example.com/', '//foo')).toBe('https://example.com/foo');
  });

  it('préserve le scheme https://', () => {
    expect(urlAbsolue('https://example.com', '/foo')).toMatch(/^https:\/\//);
  });
});

describe('lienPartageMailto', () => {
  it('compose un mailto avec sujet et corps URL-encodés', () => {
    const lien = lienPartageMailto('https://example.com/p/1', 'Cette pétition');
    expect(lien).toContain('mailto:?');
    expect(lien).toContain('subject=Cette+p%C3%A9tition');
    expect(lien).toContain('body=https%3A%2F%2Fexample.com%2Fp%2F1');
  });
});

describe('lienPartageMastodon', () => {
  it('compose une URL share Mastodon', () => {
    const lien = lienPartageMastodon('https://example.com/p/1', 'Test');
    expect(lien).toContain('https://mastodon.social/share?');
    expect(lien).toContain('text=Test');
    expect(lien).toContain('example.com');
  });
});

describe('extraireDomaine', () => {
  it('extrait le domaine d’une URL https', () => {
    expect(extraireDomaine('https://www.example.com/foo/bar')).toBe('www.example.com');
  });

  it('ignore le port', () => {
    expect(extraireDomaine('https://www.example.com:8080/foo')).toBe('www.example.com');
  });

  it('retourne chaîne vide pour URL invalide', () => {
    expect(extraireDomaine('pas une URL')).toBe('');
    expect(extraireDomaine('')).toBe('');
  });
});
