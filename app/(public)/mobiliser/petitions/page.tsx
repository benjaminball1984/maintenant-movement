import { CartePetition } from '@/components/petitions/CartePetition';
import { Alert, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerPetitionsPubliees } from '@/lib/petitions/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pétitions',
  description:
    'Pétitions citoyennes en cours sur Maintenant!. Signer en quelques secondes, créer la tienne en quelques minutes.',
};

/**
 * Page liste des pétitions (`/mobiliser/petitions`, chantier 3.1).
 *
 * - Affiche toutes les pétitions publiées (`statut = 'publiee'`), tri
 *   par récence. Pas de pagination explicite tant que la masse reste
 *   raisonnable (cf. `listerPetitionsPubliees`, limite 50).
 * - Bouton « Lancer une pétition » visible toujours ; redirige vers
 *   `/connexion?prochaine=...` si la personne n'est pas connectée
 *   (gestion centralisée par la page `/mobiliser/petitions/nouvelle`).
 * - État vide propre quand aucune pétition n'est encore publiée :
 *   message explicatif + CTA création.
 */
export default async function PagePetitions() {
  const [petitions, session] = await Promise.all([listerPetitionsPubliees(), getSession()]);
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
            Pétitions
          </Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Toutes les pétitions citoyennes en cours sur Maintenant!. Chaque pétition est modérée
            avant publication. Signe en quelques secondes, ou lance la tienne.
          </p>
        </div>
        <Link
          href="/mobiliser/petitions/nouvelle"
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {personneConnectee ? 'Lancer une pétition' : 'Connecte-toi pour lancer une pétition'}
        </Link>
      </header>

      {petitions.length === 0 ? (
        <Alert variant="info" titre="Aucune pétition active pour le moment">
          La première pétition publiée apparaîtra ici. Tu peux être à l'origine de cette première.
        </Alert>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {petitions.map((petition, index) => (
            <li key={petition.id}>
              <CartePetition petition={petition} enAvant={index === 0} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <p>
          Les pétitions sont modérées <strong>a priori</strong>, avant publication, par l'équipe de
          Maintenant!. Le délai habituel de modération est de 24 à 48 heures.
        </p>
      </footer>
    </Container>
  );
}
