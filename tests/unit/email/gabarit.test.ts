/**
 * Tests du gabarit email (V2.5.16 — Master Plan V2.6 Phase L).
 *
 * Ne teste que les helpers purs (`ctaEmail`) — `gabaritEmailHTML` lit
 * du CMS donc nécessiterait un mock Supabase, hors scope de cette première
 * version.
 */

import { describe, expect, it } from 'vitest';
import { ctaEmail } from '../../../lib/email/gabarit';

describe('ctaEmail', () => {
  it('produit une structure table-based compatible Outlook', () => {
    const html = ctaEmail('Confirmer', 'https://maintenant.org/agir/adherer');
    expect(html).toContain('<table');
    expect(html).toContain('role="presentation"');
    expect(html).toContain('href="https://maintenant.org/agir/adherer"');
    expect(html).toContain('Confirmer');
  });

  it('utilise la couleur signature en aplat (pas de gradient CSS, ignoré par les clients mail)', () => {
    const html = ctaEmail('Test', 'https://x');
    expect(html).toContain('#7C3AED');
  });

  it('échappe les caractères dangereux du libellé (anti-XSS)', () => {
    const html = ctaEmail('<script>alert(1)</script>', 'https://x');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it("échappe les caractères dangereux de l'URL", () => {
    const html = ctaEmail('Test', 'https://x?q=<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('q=<script>');
  });

  it('inclut padding inline (Outlook ignore les classes CSS)', () => {
    const html = ctaEmail('Test', 'https://x');
    expect(html).toMatch(/padding:\s*12px\s*24px/);
  });

  it("produit un HTML qui contient l'URL telle quelle dans le href", () => {
    const url = 'https://maintenant-le-mouvement.org/agir/adherer?source=email';
    const html = ctaEmail('OK', url);
    // Le & est encodé en &amp; après échappement
    expect(html).toContain('source=email');
  });
});
