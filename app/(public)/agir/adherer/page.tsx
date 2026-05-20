import { Alert, Card, Container, Heading } from '@/components/ui';
import { adhesionActive } from '@/lib/adhesion/requetes';
import { getSession } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Adhérer',
  description:
    'Adhérer à Maintenant! — 3 chemins (gratuit, 12 €, 12 99-coin). Page sobre, sans argumentaire pesant.',
};

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Page d'accueil Adhérer — 3 chemins en cartes.
 *
 * Cf. spec §7A : « Page sobre, doctrine ouverte. Pas d'argumentaire
 * pesant : on entre dans le mouvement, on en sort, on revient. »
 *
 * Si la personne est déjà adhérente : on lui dit, avec sa date
 * d'expiration et un bouton pour renouveler.
 */
export default async function PageAdherer() {
  const session = await getSession();
  const adhesion = session !== null ? await adhesionActive(session.userId) : null;

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-10">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
        <Heading niveau={1}>Adhérer</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          On entre dans Maintenant!, on en sort, on revient. 3 chemins : <strong>gratuit</strong>,{' '}
          <strong>12 €</strong>, <strong>12 99-coin</strong>.
        </p>
      </header>

      {adhesion !== null ? (
        <Alert variant="success" titre="Tu es déjà adhérent·e">
          Ton adhésion est active jusqu'au{' '}
          <strong>{FORMATEUR_DATE.format(new Date(adhesion.expire_le))}</strong> (chemin{' '}
          {libelleChemin(adhesion.chemin)}). Renouvelle quand tu veux ci-dessous.
        </Alert>
      ) : null}

      <ul className="mt-8 grid gap-6 sm:grid-cols-3">
        <li>
          <Link
            href="/agir/adherer/gratuit"
            className="block h-full transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Card variant="ombre" className="flex h-full flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-cap text-success">Chemin 1</p>
              <Heading niveau={2} apparenceComme={3}>
                Gratuit
              </Heading>
              <p className="text-sm text-text-2">
                Adhésion sans barrière financière. Toute personne intéressée peut entrer.
              </p>
            </Card>
          </Link>
        </li>
        <li>
          <Link
            href="/agir/adherer/euros"
            className="block h-full transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Card variant="ombre" className="flex h-full flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-cap text-brand">Chemin 2</p>
              <Heading niveau={2} apparenceComme={3}>
                12 €
              </Heading>
              <p className="text-sm text-text-2">
                Paiement par carte (Stripe). Soutient le fonctionnement du mouvement.
              </p>
            </Card>
          </Link>
        </li>
        <li>
          <Link
            href="/agir/adherer/t99cp"
            className="block h-full transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Card variant="ombre" className="flex h-full flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-cap text-accent">Chemin 3</p>
              <Heading niveau={2} apparenceComme={3}>
                12 99-coin
              </Heading>
              <p className="text-sm text-text-2">
                Transaction T99CP (Polygon). Pour les personnes déjà équipées en wallet.
              </p>
            </Card>
          </Link>
        </li>
      </ul>

      <section className="mt-12 grid gap-3 rounded-md border border-border bg-surface-2 p-6 text-sm text-text-2">
        <Heading niveau={2} apparenceComme={4}>
          Renouvellement automatique
        </Heading>
        <p>
          L'adhésion dure 365 jours. Un mail de rappel est envoyé à l'approche de l'échéance. Aucun
          prélèvement récurrent : on revient ici pour renouveler par le chemin de son choix.
        </p>
      </section>
    </Container>
  );
}

function libelleChemin(chemin: 'gratuit' | 'euros' | 't99cp'): string {
  if (chemin === 'gratuit') return 'gratuit';
  if (chemin === 'euros') return '12 €';
  return '12 99-coin';
}
