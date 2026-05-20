import { Container, Heading } from '@/components/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface PageEditorialeStubProps {
  /** Sous-titre court (qu'est-ce que c'est, qui est concerné·e). */
  surtitre: string;
  titre: string;
  /**
   * Bloc placeholder visible qui annonce le contenu attendu. Typiquement
   * une `<Alert>` qui décrit ce que la page doit contenir et son chantier
   * de référence. Listé dans le MANIFEST sous « Contenus à arbitrer ».
   */
  placeholder: ReactNode;
}

/**
 * Squelette d'une page éditoriale en attente de contenu (chantier 2.2
 * ou autre). Permet de poser le lien dans le footer sans créer de 404
 * et de signaler clairement à toute personne qui atterrit ici qu'on
 * connaît le trou et qu'on va le combler.
 */
export function PageEditorialeStub({ surtitre, titre, placeholder }: PageEditorialeStubProps) {
  return (
    <Container taille="md" className="py-16">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">{surtitre}</p>
        <Heading niveau={1} className="mt-1">
          {titre}
        </Heading>
      </header>

      {placeholder}

      <p className="mt-8 text-sm text-text-3">
        <Link href="/" className="text-brand underline-offset-4 hover:underline">
          Retour à l'accueil
        </Link>
      </p>
    </Container>
  );
}
