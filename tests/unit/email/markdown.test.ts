/**
 * Tests du parseur Markdown email (V2.5.20 sous-chantier V2.5.16.c).
 */

import { describe, expect, it } from 'vitest';
import { markdownEmail } from '../../../lib/email/markdown';

describe('markdownEmail', () => {
  it('convertit un paragraphe simple', () => {
    expect(markdownEmail('Bonjour.')).toContain('<p');
    expect(markdownEmail('Bonjour.')).toContain('Bonjour.');
  });

  it('convertit **gras**', () => {
    expect(markdownEmail('Ceci est **important**.')).toContain('<strong>important</strong>');
  });

  it('convertit *italique*', () => {
    expect(markdownEmail('Ceci est *léger*.')).toContain('<em>léger</em>');
  });

  it('convertit un lien [texte](url)', () => {
    const html = markdownEmail('Visite [le site](https://maintenant.org).');
    expect(html).toContain('href="https://maintenant.org"');
    expect(html).toContain('>le site<');
  });

  it('convertit une liste à puces', () => {
    const md = '- Premier\n- Deuxième\n- Troisième';
    const html = markdownEmail(md);
    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('Premier');
    expect(html).toContain('Deuxième');
  });

  it('sépare les paragraphes par double saut de ligne', () => {
    const md = 'Paragraphe un.\n\nParagraphe deux.';
    const html = markdownEmail(md);
    const occurrences = (html.match(/<p/g) ?? []).length;
    expect(occurrences).toBe(2);
  });

  it('convertit un saut de ligne simple en <br>', () => {
    const md = 'Ligne un.\nLigne deux.';
    expect(markdownEmail(md)).toContain('<br>');
  });

  it('échappe le HTML brut anti-XSS', () => {
    const html = markdownEmail('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('gère un contenu vide', () => {
    expect(markdownEmail('')).toBe('');
    expect(markdownEmail('   ')).toBe('');
  });

  it('combine gras + lien dans le même paragraphe', () => {
    const html = markdownEmail('**Important** : [renouvelle](https://x.org) ton adhésion.');
    expect(html).toContain('<strong>Important</strong>');
    expect(html).toContain('href="https://x.org"');
  });
});
