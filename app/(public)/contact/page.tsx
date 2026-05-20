import { PageEditorialeStub } from '@/components/home/PageEditorialeStub';
import { Alert } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
};

export default function PageContact() {
  return (
    <PageEditorialeStub
      surtitre="Nous joindre"
      titre="Contact"
      placeholder={
        <Alert variant="info" titre="[TEXTE À FAIRE — page contact]">
          Contenu attendu : adresses email officielles (contact général, presse, adhésion, dpd@…),
          adresse postale, formulaire de contact avec Turnstile. À poser au chantier 2.2 dès que les
          emails du domaine maintenant-le-mouvement.org sont actifs.
        </Alert>
      }
    />
  );
}
