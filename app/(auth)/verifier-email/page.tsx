import { Alert, Heading } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vérifie ton email',
};

/**
 * Page « Vérifie ton email » : affichée après inscription ou après
 * envoi d'un magic link. Demande à la personne de consulter sa boîte
 * mail et cliquer le lien de validation.
 *
 * En mode dev avec EMAIL_PROVIDER=mock, le mail est tracé sous
 * `var/emails/` (cf. MockEmailService) plutôt qu'envoyé réellement.
 */
export default function PageVerifierEmail() {
  return (
    <article className="grid gap-6 text-center">
      <header>
        <Heading niveau={1}>Vérifie ton email</Heading>
        <p className="mt-2 text-text-2">
          On vient de t'envoyer un lien de confirmation. Clique dessus pour activer ton compte.
        </p>
      </header>

      <Alert variant="info" titre="Tu ne reçois rien ?">
        Vérifie les dossiers indésirables. Le mail peut prendre quelques minutes à arriver. Si rien
        après 10 minutes, recommence l'inscription ou demande un nouveau lien magique.
      </Alert>

      <p className="text-sm text-text-3">
        <Link href="/connexion" className="text-brand underline-offset-4 hover:underline">
          Retour à la page de connexion
        </Link>
      </p>
    </article>
  );
}
