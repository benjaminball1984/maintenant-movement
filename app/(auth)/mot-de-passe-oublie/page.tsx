import { Heading } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireDemandeReset } from './FormulaireDemandeReset';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
};

/**
 * Demande de reinitialisation du mot de passe.
 *
 * Saisie email + Turnstile -> envoi d'un lien magique par mail
 * (cf. Server Action `demanderResetMotDePasse`).
 */
export default function PageMotDePasseOublie() {
  return (
    <article className="grid gap-6">
      <header>
        <Heading niveau={1}>Mot de passe oublié</Heading>
        <p className="mt-2 text-text-2">
          Saisis ton email, on t'envoie un lien pour en choisir un nouveau.
        </p>
      </header>

      <FormulaireDemandeReset />

      <p className="text-sm text-text-3">
        Tu te souviens de ton mot de passe ?{' '}
        <Link href="/connexion" className="text-brand underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </article>
  );
}
