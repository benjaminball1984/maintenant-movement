/**
 * Gabarit d'email identitaire (V2.5.16 — Master Plan V2.6 Phase L).
 *
 * Enveloppe un contenu HTML libre dans une mise en page Maintenant! :
 *  - En-tête avec wordmark coloré (le dégradé CSS ne marche pas en email,
 *    on utilise la première couleur du dégradé `#7C3AED` en aplat).
 *  - Bloc central blanc, padding aéré, typographie lisible.
 *  - Pied de page avec mentions de désinscription et lien vers la
 *    politique de confidentialité.
 *
 * Le contenu (passé en `contenuHtml`) reste éditable via CMS pour chaque
 * type d'email. Le gabarit est codé une fois et appliqué automatiquement
 * par `envoyerEmailTemplee` (cf. `lib/email-templates.ts`).
 *
 * Compatible Outlook : layout en table (pas de flex/grid), styles inline
 * sur les éléments critiques, max-width 600px (standard email), couleurs
 * en hex (pas de var CSS, ignorées par les clients mail).
 *
 * Conforme à la règle de non-invention §3 : pas de copy politique inventée,
 * juste une enveloppe technique. Tous les libellés du gabarit sont également
 * éditables via CMS (clés `email.gabarit.*`).
 */

import { SITE, getSiteUrl } from '@/config/site';
import { lireContenuEditorial } from '@/lib/contenu-editorial';

interface OptionsGabarit {
  /** Titre du bloc principal (ex. « Confirme ton adhésion »). Optionnel. */
  titre?: string;
  /** Texte de pré-en-tête masqué pour les previews mail (Gmail, Outlook). */
  preheader?: string;
  /** Affiche le lien de désinscription dans le pied (false pour les transactionnels). */
  avecDesinscription?: boolean;
}

/** Couleur signature Maintenant! en aplat (le dégradé CSS ne marche pas en email). */
const COULEUR_BRAND = '#7C3AED';
const COULEUR_BRAND_FONCE = '#5B21B6';
const COULEUR_TEXTE = '#1F2937';
const COULEUR_TEXTE_2 = '#4B5563';
const COULEUR_TEXTE_3 = '#9CA3AF';
const COULEUR_BORDURE = '#E5E7EB';
const COULEUR_FOND = '#F9FAFB';

/**
 * Enveloppe un contenu HTML dans le gabarit identitaire Maintenant!.
 *
 * Le contenu doit être du HTML simple (`<p>`, `<a>`, `<strong>`, listes,
 * boutons via `<a class="bouton-grad">`). Pas de `<html>`, `<body>`,
 * `<head>` : le gabarit s'en charge.
 */
export async function gabaritEmailHTML(
  contenuHtml: string,
  options: OptionsGabarit = {},
): Promise<string> {
  const { titre, preheader, avecDesinscription = false } = options;
  const urlSite = getSiteUrl();

  // Lecture des libellés du gabarit (éditables CMS).
  const [baselineCms, desinscriptionCms, confidentialiteCms, visiterSiteCms, copyrightCms] =
    await Promise.all([
      lireContenuEditorial('email.gabarit.baseline', {
        valeurMd: 'La plateforme citoyenne des 99 %',
      }),
      lireContenuEditorial('email.gabarit.desinscription', {
        valeurMd: 'Se désabonner de ces emails',
      }),
      lireContenuEditorial('email.gabarit.confidentialite', {
        valeurMd: 'Politique de confidentialité',
      }),
      lireContenuEditorial('email.gabarit.visiter_site', {
        valeurMd: 'Visiter le site',
      }),
      lireContenuEditorial('email.gabarit.copyright', {
        valeurMd: `© ${new Date().getFullYear()} Collectif Maintenant!`,
      }),
    ]);

  const blockPreheader =
    preheader !== undefined && preheader !== ''
      ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:transparent;opacity:0;">${escapeHtml(preheader)}</div>`
      : '';

  const blockTitre =
    titre !== undefined && titre !== ''
      ? `<h1 style="margin:0 0 16px;font-family:'Inter',Arial,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:${COULEUR_TEXTE};">${escapeHtml(titre)}</h1>`
      : '';

  const blockDesinscription = avecDesinscription
    ? `<a href="${urlSite}/profil/notifications" style="color:${COULEUR_TEXTE_3};text-decoration:underline;">${escapeHtml(desinscriptionCms.valeurMd)}</a> · `
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(SITE.nom)}</title>
</head>
<body style="margin:0;padding:0;background:${COULEUR_FOND};font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:${COULEUR_TEXTE};">
${blockPreheader}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COULEUR_FOND};padding:24px 12px;">
<tr><td align="center">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;border:1px solid ${COULEUR_BORDURE};overflow:hidden;">

<!-- Bandeau identitaire -->
<tr>
<td style="background:${COULEUR_BRAND};padding:24px 32px;text-align:center;">
<a href="${urlSite}" style="color:#ffffff;text-decoration:none;font-family:'Inter',Arial,sans-serif;font-size:24px;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(SITE.nom)}</a>
<p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${escapeHtml(baselineCms.valeurMd)}</p>
</td>
</tr>

<!-- Contenu -->
<tr>
<td style="padding:32px;">
${blockTitre}
<div style="color:${COULEUR_TEXTE_2};font-size:15px;line-height:1.6;">
${contenuHtml}
</div>
</td>
</tr>

<!-- Pied de page -->
<tr>
<td style="border-top:1px solid ${COULEUR_BORDURE};padding:20px 32px;background:#FAFAFA;text-align:center;font-size:12px;color:${COULEUR_TEXTE_3};">
<p style="margin:0 0 8px;">
<a href="${urlSite}" style="color:${COULEUR_BRAND};text-decoration:none;font-weight:600;">${escapeHtml(visiterSiteCms.valeurMd)}</a>
</p>
<p style="margin:0;">
${blockDesinscription}<a href="${urlSite}/confidentialite" style="color:${COULEUR_TEXTE_3};text-decoration:underline;">${escapeHtml(confidentialiteCms.valeurMd)}</a>
</p>
<p style="margin:8px 0 0;">${escapeHtml(copyrightCms.valeurMd)}</p>
</td>
</tr>

</table>

</td></tr>
</table>

</body>
</html>`;
}

/**
 * Helper pour créer un bouton CTA dans un email. Style « bouton-grad »
 * inline (table imbriquée car Outlook ne respecte pas `padding` sur `<a>`).
 *
 * Usage dans un contenu d'email :
 *   ${ctaEmail('Confirmer mon adhésion', 'https://maintenant.org/agir/adherer')}
 */
export function ctaEmail(libelle: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
<tr><td bgcolor="${COULEUR_BRAND}" style="background:${COULEUR_BRAND};border-radius:6px;">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-family:'Inter',Arial,sans-serif;font-size:15px;font-weight:700;border-radius:6px;background:${COULEUR_BRAND};">
${escapeHtml(libelle)}
</a>
</td></tr>
</table>`;
}

/** Échappe HTML pour les variables interpolées (anti-XSS basique). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Re-export pour aider à composer des liens dans le contenu.
export { COULEUR_BRAND, COULEUR_BRAND_FONCE };
