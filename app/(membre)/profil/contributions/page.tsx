import { Alert, Heading } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mes contributions',
};

/**
 * Liste les contributions de la personne (pétitions signées,
 * mobilisations rejointes, articles écrits, cagnottes contribuées,
 * votes Décider, services SEL).
 *
 * Pour le chantier 1.3, les tables correspondantes (`petition`,
 * `mobilisation`, `article`, etc.) n'existent pas encore : elles
 * arrivent aux phases 3 (Mobiliser), 4 (S'entraider), 7 (S'informer).
 * On affiche donc un état d'attente honnête.
 */
export default async function PageContributions() {
  await getPersonneOuRediriger('/profil/contributions');

  return (
    <article className="grid gap-6">
      <header>
        <Heading niveau={1}>Mes contributions</Heading>
        <p className="mt-2 text-text-2">
          Pétitions signées, mobilisations rejointes, articles écrits, cagnottes contribuées, votes
          Décider, services SEL : tout ce que tu fais sur le mouvement apparaîtra ici.
        </p>
      </header>

      <Alert variant="info" titre="Aucune contribution pour l’instant">
        Les fonctionnalités correspondantes (pétitions, mobilisations, cagnottes, etc.) sont posées
        aux phases 3 et 4 du plan de développement. Reviens ici quand le mouvement aura commencé à
        grandir.
      </Alert>
    </article>
  );
}
