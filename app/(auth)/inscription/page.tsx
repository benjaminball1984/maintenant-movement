import { Heading } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireInscription } from './FormulaireInscription';

export const metadata: Metadata = {
  title: 'Créer un compte',
};

/**
 * Page d'inscription : formulaire complet avec Turnstile et CGU.
 *
 * La page elle-même est un Server Component ; le formulaire est isolé en
 * Client Component (`FormulaireInscription`) parce qu'il a besoin de
 * `react-hook-form` (state + onSubmit).
 */
export default function PageInscription() {
  return (
    <article className="grid gap-6">
      <header>
        <Heading niveau={1}>Créer mon compte</Heading>
        <p className="mt-2 text-text-2">Bienvenue. Quelques minutes pour rejoindre Maintenant!.</p>
      </header>

      <FormulaireInscription />

      <p className="text-sm text-text-3">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="text-brand underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </p>
    </article>
  );
}
