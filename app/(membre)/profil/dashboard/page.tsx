import { Alert, Badge, Card, Heading } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { chargerDashboardMembre } from '@/lib/dashboard-membre';
import {
  Bell,
  CalendarCheck,
  HandCoins,
  Inbox,
  type LucideIcon,
  MessageCircle,
  Receipt,
  ScrollText,
  Sparkles,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vue d’ensemble',
};

const FORMATEUR_EURO = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const LIBELLE_ACTIVITE = {
  signature_petition: 'Pétition signée',
  don: 'Contribution',
  reservation_creee: 'Réservation créée',
  reservation_recue: 'Réservation reçue',
  post_reseau: 'Publication',
  adhesion: 'Adhésion',
} as const;

/**
 * Dashboard membre profond (V2.4.5).
 *
 * Vue d'ensemble de l'activité personnelle : compteurs, adhésion en
 * cours, activités récentes, raccourcis vers les onglets et espaces.
 */
export default async function PageDashboard() {
  const { personne, email } = await getPersonneOuRediriger('/profil/dashboard');
  const data = await chargerDashboardMembre(personne.id);

  return (
    <article className="grid gap-8">
      <header className="flex flex-wrap items-center gap-3">
        <Heading niveau={1}>
          Bonjour {personne.prenom ?? 'à toi'}
          <span className="ml-2 inline-block">👋</span>
        </Heading>
        {personne.statut === 'pending_deletion' ? (
          <Badge variant="warning">Compte en attente de suppression</Badge>
        ) : data.adhesionActive !== null ? (
          <Badge variant="success">Adhérent·e</Badge>
        ) : (
          <Badge variant="default">Sympathisant·e</Badge>
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

      {data.adhesionActive !== null ? (
        <Card variant="ombre" className="border-success border-l-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-text-3 text-xs uppercase tracking-cap">
                Adhésion en cours
              </p>
              <p className="mt-1 font-display font-bold text-lg text-text-1">
                {data.adhesionActive.chemin === 'euros'
                  ? '12 € (Stripe)'
                  : data.adhesionActive.chemin === 't99cp'
                    ? '12 T99CP'
                    : 'Gratuite'}
              </p>
            </div>
            <div className="text-right text-text-3 text-xs">
              Du {FORMATEUR_DATE.format(new Date(data.adhesionActive.debuteLe))} au{' '}
              {FORMATEUR_DATE.format(new Date(data.adhesionActive.expireLe))}
            </div>
          </div>
        </Card>
      ) : (
        <Alert variant="info" titre="Pas encore adhérent·e ?">
          Rejoins le mouvement :{' '}
          <Link href="/agir/adherer" className="text-brand hover:underline">
            adhérer (gratuit, 12 € ou 12 T99CP)
          </Link>
          .
        </Alert>
      )}

      <section aria-label="Mes compteurs">
        <Heading niveau={2} apparenceComme={3} className="mb-3">
          En un coup d’œil
        </Heading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CarteCompteur
            href="/profil/notifications-recues"
            icone={Bell}
            libelle="Notifications non lues"
            valeur={data.nbNotificationsNonLues}
            variant={data.nbNotificationsNonLues > 0 ? 'danger' : 'default'}
          />
          <CarteCompteur
            href="/s-informer/reseau/messages"
            icone={MessageCircle}
            libelle="Messages non lus"
            valeur={data.nbMessagesNonLus}
            variant={data.nbMessagesNonLus > 0 ? 'warning' : 'default'}
          />
          <CarteCompteur
            href="/profil/reservations"
            icone={Inbox}
            libelle="Réservations en attente"
            valeur={data.nbReservationsEnAttente}
          />
          <CarteCompteur
            href="/profil/demandes-reservations"
            icone={CalendarCheck}
            libelle="Demandes reçues"
            valeur={data.nbReservationsDemandees}
          />
          <CarteCompteur
            href="/profil/mes-groupes"
            icone={Users}
            libelle="Mes groupes"
            valeur={data.nbGroupes}
          />
          <CarteCompteur
            href="/profil/contributions"
            icone={ScrollText}
            libelle="Pétitions signées"
            valeur={data.nbSignatures}
          />
          <CarteCompteur
            href="/profil/contributions"
            icone={HandCoins}
            libelle="Contributions €"
            valeurTexte={FORMATEUR_EURO.format(data.totalEurosContribues)}
          />
          <CarteCompteur
            href="/profil/contributions"
            icone={Receipt}
            libelle="Total contributions"
            valeur={data.nbContributions}
          />
        </div>
      </section>

      <section aria-label="Activités récentes">
        <Heading niveau={2} apparenceComme={3} className="mb-3">
          <Sparkles size={20} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          Activités récentes
        </Heading>
        {data.activitesRecentes.length === 0 ? (
          <p className="text-text-3 text-sm">
            Aucune activité récente. Quand tu signeras une pétition, feras un don ou publieras dans
            le réseau, ça apparaîtra ici.
          </p>
        ) : (
          <ul className="grid gap-2">
            {data.activitesRecentes.map((a) => (
              <li key={`${a.type}-${a.date}-${a.titre}`}>
                <Link href={a.href} className="block hover:opacity-90">
                  <Card variant="plat" className="grid gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="default">{LIBELLE_ACTIVITE[a.type]}</Badge>
                      <span className="text-text-3 text-xs">
                        {FORMATEUR_DATE.format(new Date(a.date))}
                      </span>
                    </div>
                    <p className="font-medium text-sm text-text-1">{a.titre}</p>
                    {a.sousTitre !== null ? (
                      <p className="text-text-3 text-xs">{a.sousTitre}</p>
                    ) : null}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Mon identité">
        <Heading niveau={2} apparenceComme={3} className="mb-3">
          Mon identité
        </Heading>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card variant="ombre">
            <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Nom</p>
            <p className="mt-1 text-lg">
              {personne.prenom} {personne.nom}
              {personne.pronom !== null ? (
                <span className="ml-1 text-text-3">({personne.pronom})</span>
              ) : null}
            </p>
          </Card>
          <Card variant="ombre">
            <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Email</p>
            <p className="mt-1 truncate text-lg">{email}</p>
          </Card>
          <Card variant="ombre">
            <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Code postal</p>
            <p className="mt-1 text-lg">{personne.code_postal ?? '—'}</p>
          </Card>
          <Card variant="ombre">
            <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Statut email</p>
            <p className="mt-1 text-lg">{personne.email_verifie ? '✅ Vérifié' : '⚠️ À vérifier'}</p>
          </Card>
        </div>
      </section>

      <section aria-label="Raccourcis">
        <Heading niveau={2} apparenceComme={3} className="mb-3">
          Raccourcis
        </Heading>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <RaccourciCard
            href="/profil/informations"
            titre="Mes informations"
            description="Nom, prénom, pronom, coordonnées, photo, bio."
          />
          <RaccourciCard
            href="/profil/mes-groupes"
            titre="Mes groupes"
            description="Communes, fédérations, GT, campagnes, groupes d’entraide."
          />
          <RaccourciCard
            href="/profil/reservations"
            titre="Mes réservations"
            description="Demandes que tu as envoyées."
          />
          <RaccourciCard
            href="/profil/demandes-reservations"
            titre="Demandes reçues"
            description="Demandes sur tes offres."
          />
          <RaccourciCard
            href="/profil/contributions"
            titre="Mes contributions"
            description="Signatures, dons, adhésions."
          />
          <RaccourciCard
            href="/profil/notifications"
            titre="Préférences notifs"
            description="Cloche, push, mails."
          />
          <RaccourciCard
            href="/profil/confidentialite"
            titre="Confidentialité"
            description="Visibilité, export ZIP, 2FA."
          />
          <RaccourciCard
            href="/profil/communes"
            titre="Mes communes"
            description="Appartenances actives."
          />
          <RaccourciCard
            href="/s-informer/reseau"
            titre="Réseau social"
            description="Flux, messages, profil public."
          />
        </div>
      </section>
    </article>
  );
}

function CarteCompteur({
  href,
  icone: Icone,
  libelle,
  valeur,
  valeurTexte,
  variant = 'default',
}: {
  href: string;
  icone: LucideIcon;
  libelle: string;
  valeur?: number;
  valeurTexte?: string;
  variant?: 'default' | 'warning' | 'danger';
}) {
  const bordureClass =
    variant === 'danger'
      ? 'border-l-4 border-danger'
      : variant === 'warning'
        ? 'border-l-4 border-warning'
        : '';
  return (
    <Link href={href} className="block hover:opacity-90">
      <Card variant="ombre" className={`grid gap-1 ${bordureClass}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-text-3 text-xs uppercase tracking-cap">{libelle}</p>
          <Icone size={16} className="text-text-3" aria-hidden="true" />
        </div>
        <p className="mt-1 font-display font-bold text-2xl text-text-1">
          {valeurTexte ?? valeur ?? 0}
        </p>
      </Card>
    </Link>
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
        <p className="mt-1 text-text-3 text-sm">{description}</p>
      </Card>
    </Link>
  );
}
