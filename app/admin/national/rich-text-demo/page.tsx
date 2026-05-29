import { RenduRiche } from '@/components/rich-text/RenduRiche';
import { Card, Container, Heading } from '@/components/ui';
import { markdownLegerEnHtml } from '@/lib/rich-text/markdown-vers-html';
import { sanitizeRichHtml } from '@/lib/rich-text/sanitize';
import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Démo rich text',
};

/**
 * Page admin de démonstration des capacités rich text (V2.5.44).
 *
 * Donne à Lilou/Ben un endroit pour voir, dans une seule page, ce que
 * le rich text permet : balises supportées, sanitization à l'œuvre,
 * conversion Markdown léger → HTML, et le rendu final côté visiteur.
 *
 * Pas de Server Action ici : page purement visuelle. Pour éditer
 * réellement, aller dans `/admin/national/contenus` ou sur n'importe
 * quelle page éditoriale.
 */

const EXEMPLE_RICHE = `<h2 style="color: #7C3AED;">Bienvenue dans le rich text</h2>
<p>Voici ce que tu peux faire dans <strong>n'importe quelle</strong> zone éditable du site :</p>
<ul>
  <li><strong>Gras</strong>, <em>italique</em>, <u>souligné</u>, <s>barré</s></li>
  <li>Liens : <a href="https://maintenant-le-mouvement.org">le site</a></li>
  <li>Couleurs : <span style="color: #DC2626;">rouge</span>, <span style="color: #16A34A;">vert</span>, <span style="color: #2563EB;">bleu</span></li>
  <li>Polices : <span style="font-family: monospace;">monospace</span>, <span style="font-size: 18px;">taille augmentée</span></li>
</ul>
<blockquote>
  <p>Les citations sont mises en valeur avec une bordure brand.</p>
</blockquote>
<p style="text-align: center;">Texte centré possible.</p>
<h3>Listes ordonnées</h3>
<ol>
  <li>Premier</li>
  <li>Deuxième</li>
  <li>Troisième</li>
</ol>`;

const EXEMPLE_MD_AVEC_HTML_BRUT = `## Tentative d'injection

texte normal avec **gras**.

<script>alert("XSS !")</script>

<iframe src="https://evil.com/p"></iframe>

Ces balises seront échappées ou supprimées.`;

export default function PageDemoRichText() {
  const htmlConverti = markdownLegerEnHtml(EXEMPLE_MD_AVEC_HTML_BRUT);
  const htmlSanitize = sanitizeRichHtml(htmlConverti);
  const htmlRicheRendu = sanitizeRichHtml(EXEMPLE_RICHE);

  return (
    <Container taille="md" className="py-8">
      <Heading niveau={1}>
        <Sparkles size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Démo rich text
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        Vue d'ensemble des capacités rich text disponibles dans le site (pages éditoriales, console
        CMS, journal-affiche, Décider, emails). Pas d'édition ici : c'est une page de démonstration.
      </p>

      <section className="mt-8 grid gap-4">
        <Heading niveau={2} apparenceComme={3}>
          1. Exemple de rendu HTML riche complet
        </Heading>
        <p className="text-sm text-text-3">
          Le contenu ci-dessous est du HTML sanitizé (allowlist stricte) puis injecté via{' '}
          <code className="font-mono text-xs">dangerouslySetInnerHTML</code>. C'est ce que voit le
          visiteur quand un admin a posé une version riche d'un contenu éditorial.
        </p>
        <Card variant="ombre">
          <RenduRiche valeurHtml={htmlRicheRendu} valeurMd={null} />
        </Card>
      </section>

      <section className="mt-12 grid gap-4">
        <Heading niveau={2} apparenceComme={3}>
          2. Sanitization en action (anti-XSS)
        </Heading>
        <p className="text-sm text-text-3">
          Si un admin (ou un compte CMS) tape du HTML brut avec des balises dangereuses, la
          sanitization les filtre. Exemple : entrée Markdown contenant{' '}
          <code className="font-mono text-xs">&lt;script&gt;</code> et{' '}
          <code className="font-mono text-xs">&lt;iframe&gt;</code> hors allowlist.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="plat">
            <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Entrée Markdown</p>
            <pre className="mt-2 overflow-x-auto rounded-md bg-surface-2 p-3 text-text-1 text-xs">
              {EXEMPLE_MD_AVEC_HTML_BRUT}
            </pre>
          </Card>
          <Card variant="plat">
            <p className="font-bold text-text-3 text-xs uppercase tracking-cap">
              Sortie sanitizée (rendu)
            </p>
            <div className="mt-2">
              <RenduRiche valeurHtml={htmlSanitize} valeurMd={null} />
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-12 grid gap-4">
        <Heading niveau={2} apparenceComme={3}>
          3. Où le rich text est disponible
        </Heading>
        <ul className="grid gap-2 text-sm text-text-2">
          <li>
            <strong>Pages éditoriales</strong> (Doctrine, Commune libre, FAQ, etc.) : clique sur «
            Modifier » puis bascule en mode Riche.
          </li>
          <li>
            <strong>Console CMS</strong> (
            <code className="font-mono text-xs">/admin/national/contenus</code>) : édite n'importe
            quelle clé en mode Riche (utile pour les corps d'emails).
          </li>
          <li>
            <strong>Journal-affiche</strong> : édition des articles longs avec couleurs et embeds
            vidéo.
          </li>
          <li>
            <strong>Décider</strong> : ordre du jour et procès-verbal des réunions en Riche ou
            Markdown au choix.
          </li>
          <li>
            <strong>Emails</strong> (templates RGPD, adhésion, notifs réseau) : l'admin peut styler
            le corps via la console CMS.
          </li>
        </ul>
      </section>

      <section className="mt-12 grid gap-4">
        <Heading niveau={2} apparenceComme={3}>
          4. Balises autorisées (allowlist)
        </Heading>
        <p className="text-sm text-text-3">
          La sanitization conserve uniquement les balises et attributs ci-dessous. Tout le reste est
          supprimé à l'enregistrement.
        </p>
        <div className="grid gap-2 text-sm text-text-2 md:grid-cols-2">
          <Card variant="plat">
            <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Texte structuré</p>
            <p className="mt-1">p, h1, h2, h3, h4, blockquote, pre, code, ul, ol, li, br, hr</p>
          </Card>
          <Card variant="plat">
            <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Inline</p>
            <p className="mt-1">strong, em, u, s, mark, sub, sup, span, a</p>
          </Card>
          <Card variant="plat">
            <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Média</p>
            <p className="mt-1">img (http/https/data:), figure, figcaption, iframe (YouTube,</p>
            <p>Vimeo, Spotify, SoundCloud, PeerTube)</p>
          </Card>
          <Card variant="plat">
            <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Tableaux</p>
            <p className="mt-1">table, thead, tbody, tr, td, th</p>
          </Card>
        </div>
        <p className="text-text-3 text-xs italic">
          CSS allowlistées : color, background-color, font-size, font-family, font-weight,
          font-style, text-align, text-decoration, text-transform, line-height, letter-spacing.
        </p>
      </section>
    </Container>
  );
}
