import { Alert, Container, Heading } from '@/components/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface PageEditorialeStubProps {
  /** Sous-titre court (qu'est-ce que c'est, qui est concerné·e). */
  surtitre: string;
  titre: string;
  /**
   * Bloc placeholder technique visible en développement. Décrit ce que
   * la page doit contenir, son chantier de référence et les contenus
   * attendus. Listé dans `docs/CONTENUS-A-ARBITRER.md` sous le titre
   * correspondant.
   */
  placeholder: ReactNode;
}

/**
 * Indique si l'affichage doit montrer le placeholder technique détaillé
 * (utile aux développeur·euses et à Lilou/Ben pour savoir quoi rédiger)
 * ou bien une bannière neutre destinée au public.
 *
 * - En développement (`NODE_ENV !== 'production'`) : toujours le détail.
 * - En production avec `NEXT_PUBLIC_AFFICHER_PLACEHOLDERS=true` : détail.
 * - En production sans cette variable : bannière neutre.
 *
 * Cette double lecture permet de déployer une preview interne sans
 * exposer publiquement les `[TEXTE À FAIRE]` qui sont une convention
 * interne (cf. CLAUDE.md §3).
 */
function afficherPlaceholderTechnique(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.NEXT_PUBLIC_AFFICHER_PLACEHOLDERS === 'true';
}

/**
 * Squelette d'une page éditoriale en attente de contenu (chantier 2.2
 * ou autre). Permet de poser le lien dans le footer sans créer de 404
 * et de signaler clairement à toute personne qui atterrit ici qu'on
 * connaît le trou et qu'on va le combler.
 *
 * Affichage public (prod sans flag) : bannière neutre « Page en cours
 * de rédaction » qui invite à revenir plus tard.
 * Affichage dev (ou prod avec `NEXT_PUBLIC_AFFICHER_PLACEHOLDERS=true`)
 * : détail technique avec contenus attendus, utile à Lilou/Ben.
 */
export function PageEditorialeStub({ surtitre, titre, placeholder }: PageEditorialeStubProps) {
  const detailVisible = afficherPlaceholderTechnique();
  return (
    <Container taille="md" className="py-16">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">{surtitre}</p>
        <Heading niveau={1} className="mt-1">
          {titre}
        </Heading>
      </header>

      {detailVisible ? (
        placeholder
      ) : (
        <Alert variant="info" titre="Page en cours de rédaction">
          Cette page sera publiée prochainement. Vous pouvez revenir plus tard, ou{' '}
          <Link href="/" className="text-brand underline-offset-4 hover:underline">
            retourner à l'accueil
          </Link>
          .
        </Alert>
      )}

      <p className="mt-8 text-sm text-text-3">
        <Link href="/" className="text-brand underline-offset-4 hover:underline">
          Retour à l'accueil
        </Link>
      </p>
    </Container>
  );
}
