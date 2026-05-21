import { Alert, Card, Heading } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BoutonsOAuth } from './BoutonsOAuth';
import { FormulaireConnexionMdp } from './FormulaireConnexionMdp';
import { FormulaireMagicLink } from './FormulaireMagicLink';

export const metadata: Metadata = {
  title: 'Se connecter',
};

/**
 * Page de connexion : 4 portes empilées (cf. spec §9).
 *
 * Choix d'ergonomie : on affiche les 4 méthodes empilées plutôt que des
 * tabs, pour rendre l'éventail des options immédiatement visible
 * (transparence) et éviter de cacher des méthodes derrière des onglets.
 *
 * Le paramètre `?erreur=...` (envoyé par `app/auth/callback/route.ts`
 * en cas d'échec OAuth ou magic link) s'affiche en haut de page.
 */
export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <article className="grid gap-6">
      <header>
        <Heading niveau={1}>Se connecter</Heading>
        <p className="mt-2 text-text-2">Quatre portes au choix.</p>
      </header>

      {erreur !== undefined ? (
        <Alert variant="danger" titre="Connexion impossible">
          {erreur === 'code-manquant'
            ? 'Le lien de connexion a expiré ou est incomplet. Recommence le flux.'
            : erreur}
        </Alert>
      ) : null}

      <Card variant="ombre">
        <Heading niveau={3} className="mb-3 text-lg">
          Mot de passe
        </Heading>
        <FormulaireConnexionMdp />
        <p className="mt-3 text-sm">
          <Link
            href="/mot-de-passe-oublie"
            className="text-brand underline-offset-4 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </p>
      </Card>

      <Card variant="ombre">
        <Heading niveau={3} className="mb-3 text-lg">
          Lien magique par email
        </Heading>
        <p className="mb-3 text-sm text-text-2">
          Pas besoin de mot de passe : on t'envoie un lien à usage unique.
        </p>
        <FormulaireMagicLink />
      </Card>

      <Card variant="ombre">
        <Heading niveau={3} className="mb-3 text-lg">
          Comptes existants
        </Heading>
        <BoutonsOAuth />
      </Card>

      <p className="text-sm text-text-3">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="text-brand underline-offset-4 hover:underline">
          Créer un compte
        </Link>
      </p>
    </article>
  );
}
