import { Card, Heading } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireEnrollementTotp } from './FormulaireEnrollementTotp';

export const metadata: Metadata = {
  title: 'Activer la 2FA',
};

/**
 * Setup TOTP : scan d'un QR code + saisie du code à 6 chiffres.
 *
 * À la fin du flux, redirige vers `/profil/confidentialite?2fa=active`
 * qui affiche le message de succès dans la section dédiée.
 */
export default async function PageDeuxFA() {
  await getPersonneOuRediriger('/profil/securite/2fa');

  return (
    <article className="grid gap-6">
      <header>
        <Heading niveau={1}>Activer la 2FA</Heading>
        <p className="mt-2 text-text-2">
          Un code temporaire à 6 chiffres en plus de ton mot de passe, généré par une app
          d’authentification.
        </p>
        <p className="mt-1 text-sm text-text-3">
          <Link
            href="/profil/confidentialite"
            className="text-brand underline-offset-4 hover:underline"
          >
            Retour à Confidentialité
          </Link>
        </p>
      </header>

      <Card variant="ombre">
        <FormulaireEnrollementTotp />
      </Card>
    </article>
  );
}
