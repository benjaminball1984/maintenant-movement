import { Heading } from '@/components/ui';
import type { Metadata } from 'next';
import { FormulaireNouveauMotDePasse } from './FormulaireNouveauMotDePasse';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
};

/**
 * Page de definition d'un nouveau mot de passe.
 *
 * Pre-requis : la personne arrive ici apres avoir clique sur le lien
 * recu par mail. Le `/auth/callback` a pose une session temporaire
 * avant la redirection ici.
 */
export default function PageReinitialiserMotDePasse() {
  return (
    <article className="grid gap-6">
      <header>
        <Heading niveau={1}>Choisis un nouveau mot de passe</Heading>
        <p className="mt-2 text-text-2">
          Au moins 12 caractères, une minuscule, une majuscule et un chiffre.
        </p>
      </header>

      <FormulaireNouveauMotDePasse />
    </article>
  );
}
