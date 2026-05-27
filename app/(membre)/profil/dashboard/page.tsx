import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { chargerDashboardMembre } from '@/lib/dashboard-membre';
import { formaterRelativePassee } from '@/lib/mobilisations/dates';
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
  Video,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vue d’ensemble',
};

const FALLBACKS = {
  salutation: 'Bonjour',
  salutationFallback: 'à toi',
  badgeSuppression: 'Compte en attente de suppression',
  badgeAdherent: 'Adhérent·e',
  badgeSympathisant: 'Sympathisant·e',
  alertSuppressionTitre: 'Suppression programmée',
  alertSuppressionAmorce:
    'Ton compte sera définitivement anonymisé 30 jours après ta demande. Tu peux annuler à tout moment depuis l’onglet',
  alertSuppressionLien: 'Confidentialité',
  adhesionCardLabel: 'Adhésion en cours',
  adhesionEuros: '12 € (Stripe)',
  adhesionT99cp: '12 T99CP',
  adhesionGratuite: 'Gratuite',
  adhesionDu: 'Du',
  adhesionAu: 'au',
  alertPasAdherentTitre: 'Pas encore adhérent·e ?',
  alertPasAdherentAmorce: 'Rejoins le mouvement :',
  alertPasAdherentLien: 'adhérer (gratuit, 12 € ou 12 T99CP)',
  sectionCompteurs: 'En un coup d’œil',
  compteurNotifications: 'Notifications non lues',
  compteurMessages: 'Messages non lus',
  compteurReservations: 'Réservations en attente',
  compteurDemandes: 'Demandes reçues',
  compteurGroupes: 'Mes groupes',
  compteurPetitions: 'Pétitions signées',
  compteurContributionsE: 'Contributions €',
  compteurContributionsTotal: 'Total contributions',
  compteurReunions: 'Réunions à venir',
  sectionActivites: 'Activités récentes',
  activitesEmpty:
    'Aucune activité récente. Quand tu signeras une pétition, feras un don ou publieras dans le réseau, ça apparaîtra ici.',
  activiteSignature: 'Pétition signée',
  activiteDon: 'Contribution',
  activiteReservationCreee: 'Réservation créée',
  activiteReservationRecue: 'Réservation reçue',
  activitePost: 'Publication',
  activiteAdhesion: 'Adhésion',
  sectionIdentite: 'Mon identité',
  identiteLabelNom: 'Nom',
  identiteLabelEmail: 'Email',
  identiteLabelCodePostal: 'Code postal',
  identiteLabelStatutEmail: 'Statut email',
  identiteFallbackVide: '—',
  identiteVerifie: '✅ Vérifié',
  identiteAVerifier: '⚠️ À vérifier',
  sectionRaccourcis: 'Raccourcis',
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

/**
 * Definition des raccourcis : ordre + slug stable + fallback titre + description.
 * Slug sert de cle CMS, ne change pas si admin renomme le titre.
 */
const RACCOURCIS = [
  {
    slug: 'informations',
    href: '/profil/informations',
    titre: 'Mes informations',
    description: 'Nom, prénom, pronom, coordonnées, photo, bio.',
  },
  {
    slug: 'mes_groupes',
    href: '/profil/mes-groupes',
    titre: 'Mes groupes',
    description: 'Communes, fédérations, GT, campagnes, groupes d’entraide.',
  },
  {
    slug: 'reservations',
    href: '/profil/reservations',
    titre: 'Mes réservations',
    description: 'Demandes que tu as envoyées.',
  },
  {
    slug: 'demandes_reservations',
    href: '/profil/demandes-reservations',
    titre: 'Demandes reçues',
    description: 'Demandes sur tes offres.',
  },
  {
    slug: 'contributions',
    href: '/profil/contributions',
    titre: 'Mes contributions',
    description: 'Signatures, dons, adhésions.',
  },
  {
    slug: 'notifications',
    href: '/profil/notifications',
    titre: 'Préférences notifs',
    description: 'Cloche, push, mails.',
  },
  {
    slug: 'confidentialite',
    href: '/profil/confidentialite',
    titre: 'Confidentialité',
    description: 'Visibilité, export ZIP, 2FA.',
  },
  {
    slug: 'communes',
    href: '/profil/communes',
    titre: 'Mes communes',
    description: 'Appartenances actives.',
  },
  {
    slug: 'reseau',
    href: '/s-informer/reseau',
    titre: 'Réseau social',
    description: 'Flux, messages, profil public.',
  },
  {
    slug: 'decider',
    href: '/profil/decider',
    titre: 'Mes réunions Décider',
    description: 'Prochaines réunions et dernières décisions visibles.',
  },
  {
    slug: 'mes_creations',
    href: '/profil/mes-creations',
    titre: 'Mes créations',
    description: 'Tout ce que tu as créé : pétitions, cagnottes, articles…',
  },
] as const;

/**
 * Dashboard membre profond (V2.4.5).
 *
 * Vue d'ensemble de l'activite personnelle : compteurs, adhesion en
 * cours, activites recentes, raccourcis vers les onglets et espaces.
 *
 * Tous les libelles editables admin via le CMS (cles `profil.dashboard.*`).
 */
export default async function PageDashboard() {
  const { personne, email } = await getPersonneOuRediriger('/profil/dashboard');

  const [data, estAdmin, ...lectures] = await Promise.all([
    chargerDashboardMembre(personne.id),
    estAdminCourant(),
    // Lecture systematique de toutes les cles CMS du dashboard.
    ...Object.entries(FALLBACKS).map(([cle, fb]) =>
      lireContenuEditorial(`profil.dashboard.${cle}`, { valeurMd: fb }),
    ),
    // 11 raccourcis × 2 (titre + description) = 22 cles supplementaires.
    ...RACCOURCIS.flatMap((r) => [
      lireContenuEditorial(`profil.dashboard.raccourci.${r.slug}.titre`, {
        valeurMd: r.titre,
      }),
      lireContenuEditorial(`profil.dashboard.raccourci.${r.slug}.description`, {
        valeurMd: r.description,
      }),
    ]),
  ]);

  // Reconstitue l'index des libelles depuis le tableau `lectures` selon
  // l'ordre d'insertion dans le Promise.all ci-dessus.
  const fallbackKeys = Object.keys(FALLBACKS);
  const cms = Object.fromEntries(
    fallbackKeys.map((cle, i) => [
      cle,
      lectures[i]?.valeurMd ?? (FALLBACKS as Record<string, string>)[cle],
    ]),
  ) as Record<keyof typeof FALLBACKS, string>;
  const raccourcisOffset = fallbackKeys.length;
  const raccourcisAvecCms = RACCOURCIS.map((r, i) => ({
    ...r,
    titreCms: lectures[raccourcisOffset + i * 2]?.valeurMd ?? r.titre,
    descriptionCms: lectures[raccourcisOffset + i * 2 + 1]?.valeurMd ?? r.description,
  }));

  // Helper pour wrap simple text en TexteEditableAdmin (reduit la verbosite ci-dessous).
  const E = (cleCourte: keyof typeof FALLBACKS, longueurMax = 100, multilignes = false) =>
    ({
      cle: `profil.dashboard.${cleCourte}`,
      valeurInitiale: cms[cleCourte],
      estAdmin,
      libelle: `dashboard.${cleCourte}`,
      longueurMax,
      multilignes,
    }) as const;

  return (
    <article className="grid gap-8">
      <header className="flex flex-wrap items-center gap-3">
        <Heading niveau={1}>
          <TexteEditableAdmin {...E('salutation', 40)}>{(t) => <>{t}</>}</TexteEditableAdmin>{' '}
          {personne.prenom ?? cms.salutationFallback}
          <span className="ml-2 inline-block">👋</span>
        </Heading>
        {personne.statut === 'pending_deletion' ? (
          <TexteEditableAdmin {...E('badgeSuppression', 60)}>
            {(t) => <Badge variant="warning">{t}</Badge>}
          </TexteEditableAdmin>
        ) : data.adhesionActive !== null ? (
          <TexteEditableAdmin {...E('badgeAdherent', 40)}>
            {(t) => <Badge variant="success">{t}</Badge>}
          </TexteEditableAdmin>
        ) : (
          <TexteEditableAdmin {...E('badgeSympathisant', 40)}>
            {(t) => <Badge variant="default">{t}</Badge>}
          </TexteEditableAdmin>
        )}
      </header>

      {personne.statut === 'pending_deletion' ? (
        <Alert
          variant="warning"
          titre={
            <TexteEditableAdmin {...E('alertSuppressionTitre', 60)}>
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin {...E('alertSuppressionAmorce', 300, true)}>
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          <TexteEditableAdmin {...E('alertSuppressionLien', 40)}>
            {(t) => (
              <Link href="/profil/confidentialite" className="underline">
                {t}
              </Link>
            )}
          </TexteEditableAdmin>
          .
        </Alert>
      ) : null}

      {data.adhesionActive !== null ? (
        <Card variant="ombre" className="border-success border-l-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <TexteEditableAdmin {...E('adhesionCardLabel', 40)}>
                {(t) => <p className="font-bold text-text-3 text-xs uppercase tracking-cap">{t}</p>}
              </TexteEditableAdmin>
              <p className="mt-1 font-display font-bold text-lg text-text-1">
                {data.adhesionActive.chemin === 'euros' ? (
                  <TexteEditableAdmin {...E('adhesionEuros', 40)}>
                    {(t) => <>{t}</>}
                  </TexteEditableAdmin>
                ) : data.adhesionActive.chemin === 't99cp' ? (
                  <TexteEditableAdmin {...E('adhesionT99cp', 40)}>
                    {(t) => <>{t}</>}
                  </TexteEditableAdmin>
                ) : (
                  <TexteEditableAdmin {...E('adhesionGratuite', 40)}>
                    {(t) => <>{t}</>}
                  </TexteEditableAdmin>
                )}
              </p>
            </div>
            <div className="text-right text-text-3 text-xs">
              <TexteEditableAdmin {...E('adhesionDu', 20)}>{(t) => <>{t}</>}</TexteEditableAdmin>{' '}
              {FORMATEUR_DATE.format(new Date(data.adhesionActive.debuteLe))}{' '}
              <TexteEditableAdmin {...E('adhesionAu', 20)}>{(t) => <>{t}</>}</TexteEditableAdmin>{' '}
              {FORMATEUR_DATE.format(new Date(data.adhesionActive.expireLe))}
            </div>
          </div>
        </Card>
      ) : (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin {...E('alertPasAdherentTitre', 60)}>
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin {...E('alertPasAdherentAmorce', 60)}>
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          <TexteEditableAdmin {...E('alertPasAdherentLien', 80)}>
            {(t) => (
              <Link href="/agir/adherer" className="text-brand hover:underline">
                {t}
              </Link>
            )}
          </TexteEditableAdmin>
          .
        </Alert>
      )}

      <section aria-label="Mes compteurs">
        <TexteEditableAdmin {...E('sectionCompteurs', 40)}>
          {(t) => (
            <Heading niveau={2} apparenceComme={3} className="mb-3">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CarteCompteur
            href="/profil/notifications-recues"
            icone={Bell}
            libelle={cms.compteurNotifications}
            valeur={data.nbNotificationsNonLues}
            variant={data.nbNotificationsNonLues > 0 ? 'danger' : 'default'}
          />
          <CarteCompteur
            href="/s-informer/reseau/messages"
            icone={MessageCircle}
            libelle={cms.compteurMessages}
            valeur={data.nbMessagesNonLus}
            variant={data.nbMessagesNonLus > 0 ? 'warning' : 'default'}
          />
          <CarteCompteur
            href="/profil/reservations"
            icone={Inbox}
            libelle={cms.compteurReservations}
            valeur={data.nbReservationsEnAttente}
          />
          <CarteCompteur
            href="/profil/demandes-reservations"
            icone={CalendarCheck}
            libelle={cms.compteurDemandes}
            valeur={data.nbReservationsDemandees}
          />
          <CarteCompteur
            href="/profil/mes-groupes"
            icone={Users}
            libelle={cms.compteurGroupes}
            valeur={data.nbGroupes}
          />
          <CarteCompteur
            href="/profil/contributions"
            icone={ScrollText}
            libelle={cms.compteurPetitions}
            valeur={data.nbSignatures}
          />
          <CarteCompteur
            href="/profil/contributions"
            icone={HandCoins}
            libelle={cms.compteurContributionsE}
            valeurTexte={FORMATEUR_EURO.format(data.totalEurosContribues)}
          />
          <CarteCompteur
            href="/profil/contributions"
            icone={Receipt}
            libelle={cms.compteurContributionsTotal}
            valeur={data.nbContributions}
          />
          <CarteCompteur
            href="/profil/decider"
            icone={Video}
            libelle={cms.compteurReunions}
            valeur={data.nbReunionsAVenir}
            variant={data.nbReunionsAVenir > 0 ? 'warning' : 'default'}
          />
        </div>
      </section>

      <section aria-label="Activités récentes">
        <Heading niveau={2} apparenceComme={3} className="mb-3">
          <Sparkles size={20} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          <TexteEditableAdmin {...E('sectionActivites', 40)}>{(t) => <>{t}</>}</TexteEditableAdmin>
        </Heading>
        {data.activitesRecentes.length === 0 ? (
          <TexteEditableAdmin {...E('activitesEmpty', 300, true)}>
            {(t) => <p className="text-text-3 text-sm">{t}</p>}
          </TexteEditableAdmin>
        ) : (
          <ul className="grid gap-2">
            {data.activitesRecentes.map((a) => {
              const libelleActivite =
                a.type === 'signature_petition'
                  ? cms.activiteSignature
                  : a.type === 'don'
                    ? cms.activiteDon
                    : a.type === 'reservation_creee'
                      ? cms.activiteReservationCreee
                      : a.type === 'reservation_recue'
                        ? cms.activiteReservationRecue
                        : a.type === 'post_reseau'
                          ? cms.activitePost
                          : cms.activiteAdhesion;
              return (
                <li key={`${a.type}-${a.date}-${a.titre}`}>
                  <Link href={a.href} className="block hover:opacity-90">
                    <Card variant="plat" className="grid gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="default">{libelleActivite}</Badge>
                        <span
                          className="text-text-3 text-xs"
                          title={FORMATEUR_DATE.format(new Date(a.date))}
                        >
                          {formaterRelativePassee(a.date)}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-text-1">{a.titre}</p>
                      {a.sousTitre !== null ? (
                        <p className="text-text-3 text-xs">{a.sousTitre}</p>
                      ) : null}
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="Mon identité">
        <TexteEditableAdmin {...E('sectionIdentite', 40)}>
          {(t) => (
            <Heading niveau={2} apparenceComme={3} className="mb-3">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card variant="ombre">
            <TexteEditableAdmin {...E('identiteLabelNom', 20)}>
              {(t) => <p className="font-bold text-text-3 text-xs uppercase tracking-cap">{t}</p>}
            </TexteEditableAdmin>
            <p className="mt-1 text-lg">
              {personne.prenom} {personne.nom}
              {personne.pronom !== null ? (
                <span className="ml-1 text-text-3">({personne.pronom})</span>
              ) : null}
            </p>
          </Card>
          <Card variant="ombre">
            <TexteEditableAdmin {...E('identiteLabelEmail', 20)}>
              {(t) => <p className="font-bold text-text-3 text-xs uppercase tracking-cap">{t}</p>}
            </TexteEditableAdmin>
            <p className="mt-1 truncate text-lg">{email}</p>
          </Card>
          <Card variant="ombre">
            <TexteEditableAdmin {...E('identiteLabelCodePostal', 20)}>
              {(t) => <p className="font-bold text-text-3 text-xs uppercase tracking-cap">{t}</p>}
            </TexteEditableAdmin>
            <p className="mt-1 text-lg">{personne.code_postal ?? cms.identiteFallbackVide}</p>
          </Card>
          <Card variant="ombre">
            <TexteEditableAdmin {...E('identiteLabelStatutEmail', 30)}>
              {(t) => <p className="font-bold text-text-3 text-xs uppercase tracking-cap">{t}</p>}
            </TexteEditableAdmin>
            <p className="mt-1 text-lg">
              {personne.email_verifie ? cms.identiteVerifie : cms.identiteAVerifier}
            </p>
          </Card>
        </div>
      </section>

      <section aria-label="Raccourcis">
        <TexteEditableAdmin {...E('sectionRaccourcis', 40)}>
          {(t) => (
            <Heading niveau={2} apparenceComme={3} className="mb-3">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {raccourcisAvecCms.map((r) => (
            <RaccourciCard
              key={r.slug}
              href={r.href}
              slug={r.slug}
              titre={r.titreCms}
              description={r.descriptionCms}
              estAdmin={estAdmin}
            />
          ))}
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
  slug,
  titre,
  description,
  estAdmin,
}: {
  href: string;
  slug: string;
  titre: string;
  description: string;
  estAdmin: boolean;
}) {
  return (
    <Link href={href} className="block">
      <Card variant="plat" className="h-full hover:border-border-dark hover:shadow-sm">
        <TexteEditableAdmin
          cle={`profil.dashboard.raccourci.${slug}.titre`}
          valeurInitiale={titre}
          estAdmin={estAdmin}
          libelle={`titre du raccourci ${slug}`}
          longueurMax={50}
        >
          {(t) => <p className="font-bold">{t}</p>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle={`profil.dashboard.raccourci.${slug}.description`}
          valeurInitiale={description}
          estAdmin={estAdmin}
          libelle={`description du raccourci ${slug}`}
          multilignes
          longueurMax={200}
        >
          {(t) => <p className="mt-1 text-text-3 text-sm">{t}</p>}
        </TexteEditableAdmin>
      </Card>
    </Link>
  );
}
