/**
 * Sanitization HTML rich text avant insertion en base (V2.5.23).
 *
 * Allowlist stricte des balises et attributs autorisés. Tout le reste est
 * supprimé. Sert à se défendre contre les XSS injectés par admin compromis
 * ou par un futur rôle CMS qui voudrait pousser du <script> dans un libellé.
 *
 * Server-only : `sanitize-html` utilise `htmlparser2` qui n'est pas
 * bundlable côté client. À appeler uniquement depuis les Server Actions
 * qui sauvegardent du HTML riche en base.
 *
 * Allowlist couvre :
 *   - Texte structuré : p, h1-h4, blockquote, ul/ol/li, br, hr
 *   - Inline : strong, em, u, s, code, mark, sub, sup
 *   - Liens : a (href, target, rel)
 *   - Images : img (src, alt, width, height)
 *   - Embeds : iframe (YouTube allowlisté par hostname)
 *   - Couleurs/polices/tailles : span/p avec style limité (color, background-color,
 *     font-size, font-family, text-align)
 *   - Listes : table/thead/tbody/tr/td/th (limité)
 *
 * Aucun <script>, <object>, <embed>, <form>, événements `on*`, javascript: URLs.
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Liste blanche des hostnames autorisés pour les iframes (embeds vidéo).
 * Toute iframe avec un hostname hors de cette liste est supprimée.
 */
const HOSTNAMES_IFRAME_AUTORISES = new Set<string>([
  'www.youtube.com',
  'www.youtube-nocookie.com',
  'youtube.com',
  'player.vimeo.com',
  'vimeo.com',
  'open.spotify.com',
  'soundcloud.com',
  'w.soundcloud.com',
  'peertube.tv',
  'tube.peertube.fr',
]);

/**
 * Propriétés CSS autorisées dans les attributs `style`. Évite injection de
 * `position: fixed`, `z-index`, `background: url(javascript:...)`, etc.
 */
const PROPRIETES_CSS_AUTORISEES = [
  'color',
  'background-color',
  'font-size',
  'font-family',
  'font-weight',
  'font-style',
  'text-align',
  'text-decoration',
  'text-transform',
  'line-height',
  'letter-spacing',
];

/**
 * Sanitize un fragment HTML pour insertion sûre dans `contenu_editorial.valeur_html`.
 *
 * Retourne du HTML propre, prêt à être inséré via `dangerouslySetInnerHTML`
 * côté lecture (pas besoin de re-sanitize à l'affichage).
 */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'pre',
      'code',
      'ul',
      'ol',
      'li',
      'br',
      'hr',
      'strong',
      'em',
      'u',
      's',
      'mark',
      'sub',
      'sup',
      'span',
      'a',
      'img',
      'figure',
      'figcaption',
      'iframe',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th',
    ],
    allowedAttributes: {
      '*': ['style', 'class'],
      a: ['href', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
    },
    // URL schemes : http/https/mailto/tel. Pas de javascript:, data:, file:.
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      // Images : permettre data:image/... pour les images uploadées en base64
      img: ['http', 'https', 'data'],
    },
    // CSS inline : allowlist stricte de propriétés
    allowedStyles: {
      '*': Object.fromEntries(
        PROPRIETES_CSS_AUTORISEES.map((prop) => [
          prop,
          [
            // Couleurs hex, rgb, rgba, mots-clés
            /^#(0x)?[0-9a-f]+$/i,
            /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
            /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
            // Tailles em/rem/px/%
            /^\d+(\.\d+)?(em|rem|px|%|pt)$/,
            // Mots-clés génériques (font-family, text-align, etc.)
            /^[a-zA-Z\-,\s'"]+$/,
            // Decimales (line-height, letter-spacing)
            /^\d+(\.\d+)?$/,
          ],
        ]),
      ),
    },
    // Iframe : filtrer par hostname allowlisté
    transformTags: {
      iframe: (_tagName, attribs) => {
        const src = attribs.src ?? '';
        try {
          const u = new URL(src);
          if (!HOSTNAMES_IFRAME_AUTORISES.has(u.hostname)) {
            return { tagName: 'span', attribs: {}, text: '' };
          }
        } catch {
          return { tagName: 'span', attribs: {}, text: '' };
        }
        // Force allowfullscreen pour les vidéos
        return {
          tagName: 'iframe',
          attribs: {
            ...attribs,
            allowfullscreen: 'true',
            frameborder: '0',
            loading: 'lazy',
          },
        };
      },
      // Force noopener/noreferrer sur les liens externes en target=_blank
      a: (tagName, attribs) => {
        if (attribs.target === '_blank') {
          return {
            tagName: 'a',
            attribs: {
              ...attribs,
              rel: `${attribs.rel ?? ''} noopener noreferrer`.trim(),
            },
          };
        }
        return { tagName, attribs };
      },
    },
  });
}

/**
 * Détecte si une chaîne contient du HTML structurel (vs plain text/markdown).
 * Heuristique : présence d'au moins une balise reconnaissable.
 */
export function ressembleAduHtml(s: string): boolean {
  return /<(p|h[1-4]|ul|ol|li|strong|em|a|img|iframe|blockquote|span)\b/i.test(s);
}
