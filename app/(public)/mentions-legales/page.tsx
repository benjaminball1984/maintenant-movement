import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import { LOREM_LONG } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
};

const FALLBACK = `## Éditeur

Association Maintenant!
[Adresse postale à compléter]
RNA : [numéro à compléter]
Directeur·rice de publication : [nom à compléter, en collégial]
Contact : contact@maintenant-le-mouvement.org

## Hébergement

Site hébergé par Cloudflare Pages (San Francisco, CA, USA — données proxy en EU).
Base de données : Supabase, région Francfort (Allemagne).

## Données personnelles

Cf. notre [politique de confidentialité](/confidentialite).

${LOREM_LONG}
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
