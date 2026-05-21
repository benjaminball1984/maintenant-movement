import { CarteMobilisation } from '@/components/mobilisations/CarteMobilisation';
import { Alert, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import {
  listerMobilisationsAVenir,
  listerMobilisationsPassees,
} from '@/lib/mobilisations/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mobilisations',
  description:
    'Mobilisations citoyennes (rassemblements, AG, actions) géolocalisées. Agenda à venir, clic je participe anonyme.',
};

/**
 * Page liste des mobilisations (`/mobiliser/mobilisations`, chantier 3.2).
 *
 * - Section principale « À venir » : agenda chronologique des mobilisations
 *   publiées dont `date_debut >= now`.
 * - Section « Passées » : repli historique en bas (max 20 entrées).
 * - CTA création : auth requise, redirection vers `/connexion?prochaine=...`
 *   géré par la page de création elle-même.
 * - Renvoi vers la carte unifiée pour la vue géographique.
 *
 * Modération a posteriori : pas de file d'attente, les mobilisations
 * apparaissent immédiatement après création (cf. spec §5C et §11).
 */
export default async function PageMobilisations() {
  const [aVenir, passees, session] = await Promise.all([
    listerMobilisationsAVenir(),
    listerMobilisationsPassees(),
    getSession(),
  ]);
  const personneConnectee = session !== null;

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">
            <Link href="/mobiliser" className="text-text-3 hover:text-brand">
              Mobiliser
            </Link>
          </p>
          <Heading niveau={1} className="mt-1">
            Mobilisations
          </Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Rassemblements, assemblées, actions de rue. Géolocalisé. Un clic suffit pour dire « je
            participe » — anonyme par défaut.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/carte"
            className={cn(
              'inline-flex h-11 items-center justify-center rounded-md border border-brand bg-transparent px-5',
              'font-body text-sm font-bold text-brand transition hover:bg-brand-light',
            )}
          >
            Voir sur la carte
          </Link>
          <Link
            href="/mobiliser/mobilisations/nouvelle"
            className={cn(
              'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
              'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
            )}
          >
            {personneConnectee ? 'Créer une mobilisation' : 'Connecte-toi pour créer'}
          </Link>
        </div>
      </header>

      <section aria-labelledby="titre-a-venir" className="mb-12">
        <Heading niveau={2} apparenceComme={3} className="mb-4" id="titre-a-venir">
          À venir
        </Heading>
        {aVenir.length === 0 ? (
          <Alert variant="info" titre="Aucune mobilisation à venir">
            La prochaine mobilisation à venir apparaîtra ici. Tu peux lancer la tienne.
          </Alert>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aVenir.map((mobilisation, index) => (
              <li key={mobilisation.id}>
                <CarteMobilisation mobilisation={mobilisation} enAvant={index === 0} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {passees.length > 0 ? (
        <section aria-labelledby="titre-passees">
          <Heading niveau={2} apparenceComme={4} className="mb-4" id="titre-passees">
            Passées récentes
          </Heading>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {passees.map((mobilisation) => (
              <li key={mobilisation.id}>
                <CarteMobilisation mobilisation={mobilisation} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <p>
          Les mobilisations sont modérées <strong>a posteriori</strong> : elles sont publiées
          immédiatement et l'équipe Maintenant! peut les retirer en cas de problème (propos haineux,
          lieu mensonger, etc.).
        </p>
      </footer>
    </Container>
  );
}
