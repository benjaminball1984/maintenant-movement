import { Container, Heading } from '@/components/ui';
import Link from 'next/link';

// Les 5 espaces principaux du site, proposés comme portes de sortie
// depuis la 404 (libellés avec apostrophes typographiques).
const ESPACES = [
  { href: '/s-informer', libelle: 'S’informer' },
  { href: '/mobiliser', libelle: 'Mobiliser' },
  { href: '/s-entraider', libelle: 'S’entraider' },
  { href: '/agir', libelle: 'Agir' },
  { href: '/comprendre', libelle: 'Comprendre' },
] as const;

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
      <nav
        aria-label="Espaces du site"
        className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm"
      >
        {ESPACES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="text-text-2 underline-offset-4 hover:text-brand hover:underline"
          >
            {e.libelle}
          </Link>
        ))}
      </nav>
    </Container>
  );
}
