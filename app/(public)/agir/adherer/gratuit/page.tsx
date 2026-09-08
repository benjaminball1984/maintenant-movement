import { adhererGratuit, adhererSansCompte } from '@/app/(public)/agir/adherer/actions';
import { FormulaireAdhesionGratuit } from '@/components/adhesion/FormulaireAdhesionGratuit';
import { FormulaireAdhesionSansCompte } from '@/components/adhesion/FormulaireAdhesionSansCompte';
import { Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Adhésion gratuite' };

/**
 * Page d'adhésion gratuite.
 *
 * Jusqu'au 08/09/2026, elle commençait par `getSessionOuRediriger` : sans
 * compte, on était renvoyé vers la connexion, donc vers l'inscription.
 * Deux murs avant le geste, pour une adhésion pourtant gratuite et
 * ouverte à tout le monde. Décision Lilou/Ben : « il faut pouvoir adhérer
 * sans compte, et l'adhésion crée un compte automatiquement ».
 *
 * La page sert donc deux formulaires selon qui la regarde :
 *  - connecté·e : le formulaire d'un clic (identité déjà connue) ;
 *  - sinon : identité + email, et le compte se crée avec l'adhésion.
 */
export default async function PageAdhererGratuit() {
  const session = await getSession();
  const connectee = session !== null;

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/adherer" className="hover:text-brand">
          Retour
        </Link>
      </p>
      <Heading niveau={1}>Adhésion gratuite</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        {connectee
          ? 'Pas de barrière financière. Tu deviens adhérent·e pour 365 jours, on te rappelle pour le renouvellement par mail.'
          : 'Pas de barrière financière, et pas de compte à créer avant : il se crée avec ton adhésion. Tu deviens adhérent·e pour 365 jours, on te rappelle pour le renouvellement par mail.'}
      </p>
      <div className="mt-8">
        {connectee ? (
          <FormulaireAdhesionGratuit adhererGratuit={adhererGratuit} />
        ) : (
          <FormulaireAdhesionSansCompte adhererSansCompte={adhererSansCompte} />
        )}
      </div>
    </Container>
  );
}
