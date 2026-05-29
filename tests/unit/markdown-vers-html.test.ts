import { markdownLegerEnHtml } from '@/lib/rich-text/markdown-vers-html';
import { sanitizeRichHtml } from '@/lib/rich-text/sanitize';
import { describe, expect, it } from 'vitest';

/**
 * Tests du convertisseur Markdown léger → HTML (V2.5.31).
 *
 * Couvre les cas du `MarkdownLeger` Server Component (mêmes règles) :
 * titres ##/###, listes -, paragraphes, inline **gras** et *italique*.
 * Utilisé pour pré-remplir l'éditeur TipTap quand on bascule du mode
 * Markdown au mode Riche, sans perdre le contenu existant.
 */

describe('markdownLegerEnHtml — structures de blocs', () => {
  it('retourne chaîne vide pour input vide ou espaces', () => {
    expect(markdownLegerEnHtml('')).toBe('');
    expect(markdownLegerEnHtml('   ')).toBe('');
    expect(markdownLegerEnHtml('\n\n')).toBe('');
  });

  it('convertit un paragraphe simple', () => {
    expect(markdownLegerEnHtml('Bonjour le monde')).toBe('<p>Bonjour le monde</p>');
  });

  it('convertit ## en h2', () => {
    expect(markdownLegerEnHtml('## Titre 2')).toBe('<h2>Titre 2</h2>');
  });

  it('convertit ### en h3', () => {
    expect(markdownLegerEnHtml('### Titre 3')).toBe('<h3>Titre 3</h3>');
  });

  it('groupe les `- item` consécutifs en une seule liste', () => {
    const out = markdownLegerEnHtml('- a\n- b\n- c');
    expect(out).toBe('<ul><li>a</li><li>b</li><li>c</li></ul>');
  });

  it('sépare deux listes par un paragraphe', () => {
    const out = markdownLegerEnHtml('- a\n- b\n\ntexte\n\n- c\n- d');
    expect(out).toBe('<ul><li>a</li><li>b</li></ul><p>texte</p><ul><li>c</li><li>d</li></ul>');
  });

  it('joint plusieurs lignes consécutives dans un même paragraphe', () => {
    const out = markdownLegerEnHtml('ligne 1\nligne 2\nligne 3');
    expect(out).toBe('<p>ligne 1 ligne 2 ligne 3</p>');
  });

  it('sépare les paragraphes par lignes vides', () => {
    const out = markdownLegerEnHtml('para 1\n\npara 2');
    expect(out).toBe('<p>para 1</p><p>para 2</p>');
  });
});

describe('markdownLegerEnHtml — inline formatting', () => {
  it('convertit **gras**', () => {
    expect(markdownLegerEnHtml('texte **gras** ici')).toBe(
      '<p>texte <strong>gras</strong> ici</p>',
    );
  });

  it('convertit *italique*', () => {
    expect(markdownLegerEnHtml('texte *italique* ici')).toBe('<p>texte <em>italique</em> ici</p>');
  });

  it('gère plusieurs gras et italiques dans un paragraphe', () => {
    const out = markdownLegerEnHtml('**a** et *b* puis **c**');
    expect(out).toBe('<p><strong>a</strong> et <em>b</em> puis <strong>c</strong></p>');
  });

  it('applique le inline formatting dans les titres et listes', () => {
    expect(markdownLegerEnHtml('## Mon **titre**')).toBe('<h2>Mon <strong>titre</strong></h2>');
    expect(markdownLegerEnHtml('- *premier*\n- second')).toBe(
      '<ul><li><em>premier</em></li><li>second</li></ul>',
    );
  });
});

describe('markdownLegerEnHtml — échappement HTML', () => {
  it('échappe les < > & dans le texte', () => {
    expect(markdownLegerEnHtml('1 < 2 & 3 > 2')).toBe('<p>1 &lt; 2 &amp; 3 &gt; 2</p>');
  });

  it('échappe le HTML brut dans le contenu Markdown', () => {
    const out = markdownLegerEnHtml('<script>alert(1)</script>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('échappe les balises dans les titres', () => {
    expect(markdownLegerEnHtml('## <img src=x>')).toBe('<h2>&lt;img src=x&gt;</h2>');
  });
});

describe('markdownLegerEnHtml — intégration avec sanitizeRichHtml', () => {
  /**
   * Le pipeline réel est : MD → convertisseur → TipTap (édition) → save →
   * sanitize → base. Donc la sortie du convertisseur DOIT passer par
   * sanitize sans rien perdre des balises légitimes qu'il produit.
   * (Anti-régression : si l'allowlist sanitize se durcit, on saura.)
   */
  it('sortie du convertisseur passe par sanitize sans perte', () => {
    const md = 'Para **gras** et *ita*.\n\n## Titre\n\n- a\n- b';
    const html = markdownLegerEnHtml(md);
    const propre = sanitizeRichHtml(html);
    // Toutes les balises produites sont allowlistées.
    expect(propre).toContain('<p>');
    expect(propre).toContain('<strong>');
    expect(propre).toContain('<em>');
    expect(propre).toContain('<h2>');
    expect(propre).toContain('<ul>');
    expect(propre).toContain('<li>');
  });

  it('échappement protège contre injection HTML dans Markdown', () => {
    const md = 'texte avec <script>alert(1)</script> dedans';
    const html = markdownLegerEnHtml(md);
    const propre = sanitizeRichHtml(html);
    // La balise <script> ne doit JAMAIS apparaître comme tag. Le texte
    // littéral "alert(1)" reste visible (l'utilisateurice l'a tapé dans
    // son Markdown), mais entre &lt;/&gt; donc inerte pour le navigateur.
    expect(propre).not.toContain('<script');
    expect(propre).toContain('&lt;script&gt;');
  });
});

describe('markdownLegerEnHtml — combinaisons réalistes', () => {
  it('rend un document complet en HTML compatible TipTap', () => {
    const md = `Intro du document.

## Première partie

Texte normal avec **gras** et *italique*.

- élément 1
- élément 2

## Deuxième partie

Conclusion.`;
    const out = markdownLegerEnHtml(md);
    expect(out).toBe(
      '<p>Intro du document.</p>' +
        '<h2>Première partie</h2>' +
        '<p>Texte normal avec <strong>gras</strong> et <em>italique</em>.</p>' +
        '<ul><li>élément 1</li><li>élément 2</li></ul>' +
        '<h2>Deuxième partie</h2>' +
        '<p>Conclusion.</p>',
    );
  });
});
