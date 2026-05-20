import { Alert, Container, Heading } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Paiement simulé',
};

interface PageMockProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ succes?: string; annulation?: string }>;
}

/**
 * Page de paiement mockée (chantier 3.3).
 *
 * Sert d'écran de simulation lorsque `PAYMENT_PROVIDER=mock` (défaut en
 * dev) : la Server Action `faireDonEuros` redirige ici plutôt que sur
 * Stripe Checkout. Deux boutons (« Confirmer le paiement » /
 * « Annuler ») renvoient vers les URLs fournies par la Server Action.
 *
 * En prod (Stripe réel), cette route n'est jamais visitée.
 */
export default async function PagePaiementMock({ params, searchParams }: PageMockProps) {
  const { sessionId } = await params;
  const { succes, annulation } = await searchParams;

  const urlSucces = succes ?? '/';
  const urlAnnulation = annulation ?? '/';

  return (
    <Container taille="sm" className="py-12">
      <Heading niveau={1}>Paiement simulé</Heading>
      <p className="mt-2 text-text-2">
        Cette page simule Stripe Checkout en environnement local. En prod, tu serais sur le domaine
        Stripe avec un formulaire de carte bancaire.
      </p>

      <Alert variant="info" titre="Session Checkout mock" className="my-6">
        <code className="font-mono text-xs">{sessionId}</code>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={urlSucces}
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          Confirmer le paiement
        </Link>
        <Link
          href={urlAnnulation}
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-5',
            'font-body text-sm font-bold text-text-1 transition hover:bg-surface-2',
          )}
        >
          Annuler
        </Link>
      </div>

      <p className="mt-6 text-xs text-text-3">
        Pour brancher Stripe réel : configurer <code>PAYMENT_PROVIDER=stripe_test</code> et
        compléter l'implémentation dans <code>lib/payments/StripePaymentService.ts</code>.
      </p>
    </Container>
  );
}
