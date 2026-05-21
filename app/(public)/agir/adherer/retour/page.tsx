import { confirmerAdhesionEuros } from '@/app/(public)/agir/adherer/actions';
import { Alert, Container, Heading } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Retour de paiement adhésion' };

interface PageRetourProps {
  searchParams: Promise<{ session_id?: string; adhesion_id?: string }>;
}

/**
 * Page de retour Stripe Checkout (mock) pour l'adhésion 12 €. Reçoit
 * `session_id` et `adhesion_id` en query string et confirme l'adhésion.
 */
export default async function PageRetourAdhesion({ searchParams }: PageRetourProps) {
  const { session_id, adhesion_id } = await searchParams;
  let message: string | null = null;
  let succes = false;

  if (
    session_id !== undefined &&
    session_id !== '' &&
    adhesion_id !== undefined &&
    adhesion_id !== ''
  ) {
    const resultat = await confirmerAdhesionEuros(session_id, adhesion_id);
    if (resultat.ok) {
      succes = true;
    } else {
      message = resultat.message;
    }
  } else {
    message = 'Paramètres manquants (session_id ou adhesion_id).';
  }

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/adherer" className="hover:text-brand">
          ← Adhérer
        </Link>
      </p>
      <Heading niveau={1}>Retour Stripe</Heading>
      <div className="mt-6">
        {succes ? (
          <Alert variant="success" titre="Adhésion confirmée">
            Ton adhésion 12 € est active pour 365 jours. Merci. Tu retrouveras le statut dans{' '}
            <Link href="/profil/dashboard" className="underline">
              ton profil
            </Link>
            .
          </Alert>
        ) : (
          <Alert variant="danger" titre="Adhésion non confirmée">
            {message ?? 'Une erreur est survenue.'}
          </Alert>
        )}
      </div>
    </Container>
  );
}
