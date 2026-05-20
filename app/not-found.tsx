import { Container, Heading } from '@/components/ui';
import Link from 'next/link';

/**
 * Page 404 globale.
 *
 * Sobre, en français, sans surcouche émotionnelle. Renvoie vers la
 * home + propose les 5 espaces principaux.
 *
 * `app/not-found.tsx` est utilisée par Next.js dès qu'une route ne
 * matche pas. Pas de layout particulier nécessaire : on hérite du
 * RootLayout (`app/layout.tsx`) qui pose la chrome minimale.
 */
export default function PageIntrouvable() {
  return (
    <Container
      taille="md"
      className="flex min-h-screen flex-col justify-center gap-6 py-16 text-center"
    >
      <p className="font-mono text-sm text-text-3">404</p>
      <Heading niveau={1}>Page introuvable</Heading>
      <p className="text-text-2">
        L’adresse demandée n’existe pas ou plus. Possible cause : un lien obsolète, une page pas
        encore livrée, ou une faute de frappe.
      </p>
      <p className="text-sm">
        <Link href="/" className="text-brand underline-offset-4 hover:underline">
          Retour à l’accueil
        </Link>
      </p>
    </Container>
  );
}
