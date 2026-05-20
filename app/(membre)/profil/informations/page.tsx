import { Heading } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import type { DonneesMiseAJourProfil } from '@/lib/validations/profil';
import type { Metadata } from 'next';
import { FormulaireInformations } from './FormulaireInformations';

export const metadata: Metadata = {
  title: 'Mes informations',
};

export default async function PageInformations() {
  const { personne } = await getPersonneOuRediriger('/profil/informations');

  const valeursInitiales: DonneesMiseAJourProfil = {
    nom: personne.nom ?? '',
    prenom: personne.prenom ?? '',
    pronom: personne.pronom ?? '',
    code_postal: personne.code_postal ?? '',
    telephone: personne.telephone ?? '',
    photo_url: personne.photo_url ?? '',
    bio: personne.bio ?? '',
    mode_theme: personne.mode_theme ?? 'auto',
  };

  return (
    <article className="grid gap-6">
      <header>
        <Heading niveau={1}>Mes informations</Heading>
        <p className="mt-2 text-text-2">
          Ces champs sont modifiables à tout moment. La visibilité de chacun se règle dans l’onglet
          Confidentialité.
        </p>
      </header>

      <FormulaireInformations valeursInitiales={valeursInitiales} />
    </article>
  );
}
