import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import { LOREM_MOYEN } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
};

const FALLBACK = `Pour joindre l'équipe Maintenant!.

## Adresses email

- Contact général : contact@maintenant-le-mouvement.org
- Adhésion : adhesion@maintenant-le-mouvement.org
- Presse : presse@maintenant-le-mouvement.org
- Délégué·e à la protection des données : dpd@maintenant-le-mouvement.org

## Adresse postale

[À compléter]

${LOREM_MOYEN}
`;

export default function PageContact() {
  return (
    <PageEditorialeCMS
      surtitre="Nous joindre"
      titreParDefaut="Contact"
      cle="page.contact"
      loremFallback={FALLBACK}
    />
  );
}
