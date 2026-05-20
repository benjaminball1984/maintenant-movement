import { Alert, Container, Heading } from '@/components/ui';
import Link from 'next/link';

interface PageSousEspaceStubProps {
  espaceParent: { slug: string; libelle: string };
  titre: string;
  chantier: string;
  description: string;
}

/**
 * Squelette d'une page sous-espace en attente (chantier 2.1).
 *
 * Posée pour que les liens « voir tous » des unes de la home ne soient
 * pas morts. Le contenu réel viendra avec le chantier indiqué.
 */
export function PageSousEspaceStub({
  espaceParent,
  titre,
  chantier,
  description,
}: PageSousEspaceStubProps) {
  return (
    <Container taille="md" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">
          <Link href={`/${espaceParent.slug}`} className="text-text-3 hover:text-brand">
            {espaceParent.libelle}
          </Link>
        </p>
        <Heading niveau={1} className="mt-1">
          {titre}
        </Heading>
      </header>

      <Alert variant="info" titre={`Page à venir (${chantier})`}>
        {description}
      </Alert>

      <p className="mt-8 text-sm text-text-3">
        <Link href="/" className="text-brand underline-offset-4 hover:underline">
          Retour à l'accueil
        </Link>
      </p>
    </Container>
  );
}
