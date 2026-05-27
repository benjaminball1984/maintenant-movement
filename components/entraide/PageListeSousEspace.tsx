import { CarteOffre } from '@/components/entraide/CarteOffre';
import { Alert, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import { listerOffresPubliees } from '@/lib/entraide/requetes';
import { cn } from '@/lib/utils';
import type { TypeOffreEntraide } from '@/types/database';
import Link from 'next/link';

interface PageListeSousEspaceProps {
  type: TypeOffreEntraide;
}

/**
 * Vue liste partagée pour les 4 sous-espaces S'entraider (chantier 4.1).
 *
 * Évite d'écrire 4 pages quasi-identiques : chaque page de sous-espace
 * appelle simplement `<PageListeSousEspace type="hebergement" />`.
 *
 * Filtre par défaut sur `sens = 'propose'` (les offres), pivot vers les
 * demandes via deux sections distinctes : Offres / Demandes.
 */
export async function PageListeSousEspace({ type }: PageListeSousEspaceProps) {
  const config = SOUS_ESPACES[type];
  const [offres, session] = await Promise.all([listerOffresPubliees(type), getSession()]);
  const personneConnectee = session !== null;

  const offresProposees = offres.filter((o) => o.sens === 'propose');
  const offresCherchees = offres.filter((o) => o.sens === 'cherche');

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading niveau={1}>{config.titre}</Heading>
          <p className="mt-3 max-w-2xl text-text-2">{config.description}</p>
        </div>
        <Link
          href={`/s-entraider/${config.slug}/nouvelle`}
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {personneConnectee ? 'Publier une offre' : 'Connecte-toi pour publier'}
        </Link>
      </header>

      <section aria-labelledby="titre-propose" className="mb-12">
        <Heading niveau={2} apparenceComme={3} className="mb-4" id="titre-propose">
          {config.verbeOffre}
        </Heading>
        {offresProposees.length === 0 ? (
          <Alert variant="info" titre="Aucune offre publiée pour le moment">
            Tu peux en publier une.
          </Alert>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offresProposees.map((offre, index) => (
              <li key={offre.id}>
                <CarteOffre offre={offre} enAvant={index === 0} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titre-cherche">
        <Heading niveau={2} apparenceComme={3} className="mb-4" id="titre-cherche">
          {config.verbeDemande}
        </Heading>
        {offresCherchees.length === 0 ? (
          <Alert variant="info" titre="Aucune demande publiée">
            Tu peux en publier une si tu as besoin de cette entraide.
          </Alert>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offresCherchees.map((offre) => (
              <li key={offre.id}>
                <CarteOffre offre={offre} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <p>
          Modération <strong>a posteriori</strong>. Contact via la messagerie interne du{' '}
          <a href="/s-informer/reseau/messages" className="underline">
            réseau social
          </a>
          .
        </p>
      </footer>
    </>
  );
}
