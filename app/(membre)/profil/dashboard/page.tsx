import { Alert, Badge, Card, Heading } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vue d’ensemble',
};

/**
 * Page d'accueil du profil : synthèse + raccourcis.
 *
 * Affiche un état spécial si la personne est en cours de suppression
 * différée (statut = 'pending_deletion').
 */
export default async function PageDashboard() {
  const { personne, email } = await getPersonneOuRediriger('/profil/dashboard');

  return (
    <article className="grid gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <Heading niveau={1}>Bonjour {personne.prenom ?? 'à toi'}</Heading>
        {personne.statut === 'pending_deletion' ? (
          <Badge variant="warning">Compte en attente de suppression</Badge>
        ) : (
          <Badge variant="default">Compte actif</Badge>
        )}
      </header>

      {personne.statut === 'pending_deletion' ? (
        <Alert variant="warning" titre="Suppression programmée">
          Ton compte sera définitivement anonymisé 30 jours après ta demande. Tu peux annuler à tout
          moment depuis l’onglet{' '}
          <Link href="/profil/confidentialite" className="underline">
            Confidentialité
          </Link>
          .
        </Alert>
      ) : null}

      <section aria-label="Informations principales" className="grid gap-3 sm:grid-cols-2">
        <Card variant="ombre">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Identité</p>
          <p className="mt-1 text-lg">
            {personne.prenom} {personne.nom}{' '}
            {personne.pronom !== null ? (
              <span className="text-text-3">({personne.pronom})</span>
            ) : null}
          </p>
        </Card>
        <Card variant="ombre">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Email</p>
          <p className="mt-1 text-lg">{email}</p>
        </Card>
        <Card variant="ombre">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Code postal</p>
          <p className="mt-1 text-lg">{personne.code_postal ?? 'Non renseigné'}</p>
        </Card>
        <Card variant="ombre">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Statut</p>
          <p className="mt-1 text-lg">
            {personne.email_verifie ? 'Email vérifié' : 'Email à vérifier'}
          </p>
        </Card>
      </section>

      <section aria-label="Raccourcis">
        <Heading niveau={3} className="mb-3">
          Raccourcis
        </Heading>
        <div className="grid gap-2 sm:grid-cols-2">
          <RaccourciCard
            href="/profil/informations"
            titre="Modifier mes informations"
            description="Nom, prénom, pronom, coordonnées, photo, bio."
          />
          <RaccourciCard
            href="/profil/notifications"
            titre="Préférences de notifications"
            description="Cloche, push, mardi récap, vendredi newsletter."
          />
          <RaccourciCard
            href="/profil/confidentialite"
            titre="Confidentialité"
            description="Visibilité par champ, export ZIP, suppression, 2FA."
          />
          <RaccourciCard
            href="/profil/communes"
            titre="Mes communes"
            description="Appartenances actives (max 3)."
          />
        </div>
      </section>
    </article>
  );
}

function RaccourciCard({
  href,
  titre,
  description,
}: {
  href: string;
  titre: string;
  description: string;
}) {
  return (
    <Link href={href} className="block">
      <Card variant="plat" className="h-full hover:border-border-dark hover:shadow-sm">
        <p className="font-bold">{titre}</p>
        <p className="mt-1 text-sm text-text-3">{description}</p>
      </Card>
    </Link>
  );
}
