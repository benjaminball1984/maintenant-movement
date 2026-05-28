import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
};

/**
 * Fallback affiché tant que le CMS ne fournit pas de version sur-écrite
 * pour la clé `page.mentions-legales`. Lilou/Ben pourra réviser via le
 * CMS sans toucher au code (cf. directive 0bis.8 d'éditabilité généralisée
 * du CLAUDE.md).
 *
 * Cadre juridique repris du Master Plan V2.6 §4.3 : trois entités
 * distinctes, état actuel de « collectif » (association de fait) avant la
 * constitution prochaine de l'association. Les coordonnées précises restent
 * en placeholders éditables tant que Lilou/Ben ne les a pas confirmées.
 */
const FALLBACK = `## Éditeur du site

Le site est édité par **Collectif Maintenant**, association de fait portant le mouvement Maintenant!.

- Adresse postale de contact : [adresse à compléter]
- Courriel de contact : [contact@maintenant-le-mouvement.org]
- Téléphone : [numéro à compléter]
- Logo officiel : poing levé et coquelicot

Le collectif est en cours de constitution en association loi 1901. Une fois l'enregistrement préfectoral effectué, ces mentions seront mises à jour avec le numéro RNA, le numéro SIREN si applicable, et le siège social.

## Représentant

Ben (LIFE BENJAMIN BALL), cosec gé, est aujourd'hui mandaté par le collectif pour collecter les contributions financières et représenter le mouvement dans ses relations courantes, jusqu'à la formalisation de l'association et l'élection des organes statutaires.

## Directeur·rice de la publication

[Nom à compléter — désignation collégiale par le collectif]

## Hébergement

- Frontend : Cloudflare Pages (Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, USA). Proxy CDN avec terminaison TLS en Union européenne quand possible.
- Base de données et authentification : Supabase Inc. (970 Toa Payoh North, #07-04, Singapore 318992), serveurs hébergés dans la région Francfort (Allemagne).
- Médias : Supabase Storage, même région.

## Propriété intellectuelle

Le code de la plateforme est ouvert et publié sous une licence libre (cf. dépôt public du projet). Les textes, images et logos produits pour Maintenant! sont protégés. Toute reprise en dehors du cadre interne au mouvement nécessite l'accord du collectif.

Les contributions publiées par les membres restent leur propriété, mais l'inscription au site emporte une licence non exclusive d'usage par le mouvement pour assurer la diffusion (cf. CGU et politique de confidentialité).

## Données personnelles

Le traitement des données personnelles est décrit dans notre [politique de confidentialité](/confidentialite). Le responsable de traitement est le **Collectif Maintenant**.

## Accessibilité

Le site vise une conformité au RGAA (Référentiel général d'amélioration de l'accessibilité). Un audit est prévu une fois la version 1.0 stabilisée. Si vous rencontrez une difficulté d'usage, écrivez à [contact à compléter] et nous corrigerons ce qui peut l'être.

## Médiation

En cas de litige non résolu en interne, le collectif s'engage à proposer une médiation amiable avant tout recours contentieux.
`;

export default function PageMentionsLegales() {
  return (
    <PageEditorialeCMS
      surtitre="Légal"
      titreParDefaut="Mentions légales"
      cle="page.mentions-legales"
      loremFallback={FALLBACK}
    />
  );
}
