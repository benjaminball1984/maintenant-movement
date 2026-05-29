import { ressembleAduHtml, sanitizeRichHtml } from '@/lib/rich-text/sanitize';
import { describe, expect, it } from 'vitest';

/**
 * Tests de la sanitization HTML rich text (V2.5.23).
 *
 * Sécurité critique : la sortie est insérée via dangerouslySetInnerHTML
 * sur les pages publiques et dans les emails. Toute brèche d'allowlist =
 * XSS exploitable. On teste l'allowlist positivement (les balises légitimes
 * passent) ET négativement (les vecteurs d'attaque sont coupés).
 */

describe('sanitizeRichHtml — balises légitimes', () => {
  it('conserve les paragraphes et titres', () => {
    const html = '<h1>Titre</h1><p>Para</p><h2>Sous</h2>';
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it('conserve gras italique souligné barré', () => {
    const html = '<p><strong>g</strong> <em>i</em> <u>u</u> <s>b</s></p>';
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it('conserve les listes ordonnées et non ordonnées', () => {
    const html = '<ul><li>a</li><li>b</li></ul><ol><li>1</li></ol>';
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it('conserve les liens http(s) et mailto', () => {
    const html = '<p><a href="https://x.org">x</a> <a href="mailto:a@b.c">a</a></p>';
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it('conserve les images avec http(s) et data:', () => {
    expect(sanitizeRichHtml('<img src="https://x.org/a.png" alt="x">')).toContain(
      '<img src="https://x.org/a.png"',
    );
    expect(sanitizeRichHtml('<img src="data:image/png;base64,abc" alt="">')).toContain(
      'data:image',
    );
  });

  it('conserve une iframe YouTube allowlistée', () => {
    const html = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>';
    expect(sanitizeRichHtml(html)).toContain('youtube.com/embed');
  });

  it('conserve les styles CSS allowlistés (color, font-size)', () => {
    const html = '<p style="color: #ff0000; font-size: 16px;">rouge</p>';
    const out = sanitizeRichHtml(html);
    expect(out).toContain('color:');
    expect(out).toContain('font-size:');
  });
});

describe('sanitizeRichHtml — vecteurs XSS', () => {
  it('supprime les balises script', () => {
    const out = sanitizeRichHtml('<p>ok</p><script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('supprime les handlers on*', () => {
    const out = sanitizeRichHtml('<p onclick="alert(1)">x</p>');
    expect(out).not.toContain('onclick');
  });

  it('supprime les URLs javascript:', () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
  });

  it('supprime les balises object et embed', () => {
    const out = sanitizeRichHtml('<object data="x"></object><embed src="x">');
    expect(out).not.toContain('<object');
    expect(out).not.toContain('<embed');
  });

  it('supprime les iframes hors allowlist (hostname non autorisé)', () => {
    const out = sanitizeRichHtml('<iframe src="https://evil.com/p"></iframe>');
    expect(out).not.toContain('evil.com');
  });

  it('supprime les iframes sans src', () => {
    const out = sanitizeRichHtml('<iframe></iframe>');
    expect(out).not.toContain('<iframe');
  });

  it('supprime les styles position fixed / z-index', () => {
    const out = sanitizeRichHtml('<p style="position: fixed; z-index: 9999;">x</p>');
    expect(out).not.toContain('position');
    expect(out).not.toContain('z-index');
  });

  it('force noopener noreferrer sur les liens target=_blank', () => {
    const out = sanitizeRichHtml('<a href="https://x.org" target="_blank">x</a>');
    expect(out).toContain('noopener');
    expect(out).toContain('noreferrer');
  });

  it('supprime data: pour href (autorisé pour img seulement)', () => {
    const out = sanitizeRichHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>');
    expect(out).not.toContain('data:text');
    expect(out).not.toContain('<script');
  });
});

describe('ressembleAduHtml', () => {
  it('détecte le HTML structurel', () => {
    expect(ressembleAduHtml('<p>texte</p>')).toBe(true);
    expect(ressembleAduHtml('<h1>titre</h1>')).toBe(true);
    expect(ressembleAduHtml('<a href="x">l</a>')).toBe(true);
    expect(ressembleAduHtml('texte avec <strong>gras</strong>')).toBe(true);
  });

  it('rejette le texte brut et le Markdown', () => {
    expect(ressembleAduHtml('texte simple')).toBe(false);
    expect(ressembleAduHtml('**markdown gras**')).toBe(false);
    expect(ressembleAduHtml('- liste\n- markdown')).toBe(false);
    expect(ressembleAduHtml('')).toBe(false);
  });
});
