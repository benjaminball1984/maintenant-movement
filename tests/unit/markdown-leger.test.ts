import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

/**
 * Tests du composant `MarkdownLeger` (mission F : support des liens).
 *
 * Le composant est un Server Component pur (aucun hook, aucun état) : on
 * peut donc le rendre en HTML statique via `renderToStaticMarkup` dans
 * l'environnement node de Vitest, sans jsdom.
 *
 * Règles strictes des liens `[texte](url)` :
 * - chemin interne commençant par `/` : ancre simple, sans target ;
 * - URL `https://` : ancre avec target="_blank" et rel="noopener noreferrer" ;
 * - tout autre schéma (javascript:, data:, http:, mailto:) : refusé,
 *   le texte source reste affiché tel quel.
 */

/** Rend le composant en chaîne HTML statique pour les assertions. */
function rendre(texte: string): string {
  return renderToStaticMarkup(createElement(MarkdownLeger, { texte }));
}

describe('MarkdownLeger : liens [texte](url)', () => {
  it('rend un lien interne commençant par / en ancre simple sans target', () => {
    const html = rendre('Voir la [politique de confidentialité](/confidentialite) du site.');
    expect(html).toContain('<a href="/confidentialite"');
    expect(html).toContain('politique de confidentialité</a>');
    expect(html).not.toContain('target=');
    // Le texte source brut ne doit plus apparaître.
    expect(html).not.toContain('[politique de confidentialité](/confidentialite)');
  });

  it('rend un lien https externe avec target _blank et rel noopener noreferrer', () => {
    const html = rendre('Voir [le site](https://example.org/page) pour en savoir plus.');
    expect(html).toContain('href="https://example.org/page"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('le site</a>');
  });

  it('applique la classe de lien canonique du projet', () => {
    const html = rendre('[lien](/page)');
    expect(html).toContain('underline');
    expect(html).toContain('text-brand');
  });

  it('refuse le schéma javascript: et laisse le texte brut', () => {
    const html = rendre('Cliquer [ici](javascript:void0) ne doit rien faire.');
    expect(html).not.toContain('<a');
    expect(html).toContain('[ici](javascript:void0)');
  });

  it('refuse le schéma data: et laisse le texte brut', () => {
    const html = rendre('[image](data:text/html;base64,AAAA)');
    expect(html).not.toContain('<a');
    expect(html).toContain('[image](data:text/html;base64,AAAA)');
  });

  it('refuse http: non sécurisé et laisse le texte brut', () => {
    const html = rendre('[site](http://example.org)');
    expect(html).not.toContain('<a');
    expect(html).toContain('[site](http://example.org)');
  });

  it('refuse mailto: et laisse le texte brut', () => {
    const html = rendre('[écrire](mailto:contact@example.org)');
    expect(html).not.toContain('<a');
    expect(html).toContain('[écrire](mailto:contact@example.org)');
  });

  it('refuse les URLs relatives au protocole // (autre domaine déguisé)', () => {
    const html = rendre('[piège](//evil.example.org)');
    expect(html).not.toContain('<a');
    expect(html).toContain('[piège](//evil.example.org)');
  });

  it('laisse inchangé un texte sans lien', () => {
    const html = rendre('Un paragraphe sobre, sans lien ni crochet.');
    expect(html).not.toContain('<a');
    expect(html).toContain('Un paragraphe sobre, sans lien ni crochet.');
  });

  it('combine gras, italique et lien dans le même paragraphe', () => {
    const html = rendre('Du **gras**, de l’*italique* et un [lien](/page).');
    expect(html).toContain('<strong>gras</strong>');
    expect(html).toContain('<em>italique</em>');
    expect(html).toContain('<a href="/page"');
    expect(html).toContain('lien</a>');
  });

  it('rend un lien dans un item de liste', () => {
    const html = rendre('- [première page](/premiere)\n- seconde puce');
    expect(html).toContain('<li>');
    expect(html).toContain('<a href="/premiere"');
    expect(html).toContain('première page</a>');
  });
});
