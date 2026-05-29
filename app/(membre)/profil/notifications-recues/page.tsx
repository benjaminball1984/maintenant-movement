import {
  marquerNotificationLue,
  marquerToutesLues,
} from '@/app/(membre)/profil/notifications/actions';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Button, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSessionOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { type Notification, listerNotifications } from '@/lib/notification';
import { Bell, Check } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mes notifications',
  description: 'Liste de la cloche in-app.',
};

/**
 * Page « Mes notifications reçues » (V2.3.25) — canal 1 du CDC V2 §7.
 *
 * Liste des notifs (50 dernières) avec badge non lu, lien cible,
 * bouton « tout marquer lu ». Distinct de `/profil/notifications` qui
 * gère les *préférences* (chantier 8.1 V1, opt-in/opt-out des canaux).
 *
 * Philosophie acté 19/05 : « on respecte l'attention, on ne la capte
 * pas ». Pas de toast, pas d'auto-refresh, pas de son.
 *
 * Réutilise les Server Actions V1 `marquerNotificationLue` et
 * `marquerToutesLues` (doctrine de greffe V2 §0.3).
 */
export default async function PageNotificationsRecues() {
  const session = await getSessionOuRediriger('/profil/notifications-recues');
  const [notifs, estAdmin, titre, introAmorce, introLien, ctaToutMarquer, emptyTitre, emptyCorps] =
    await Promise.all([
      listerNotifications(session.userId, 50),
      estAdminCourant(),
      lireContenuEditorial('profil.notifications_recues.titre', {
        valeurMd: 'Mes notifications',
      }),
      lireContenuEditorial('profil.notifications_recues.intro_amorce', {
        valeurMd: 'Cloche in-app — 50 dernières notifications.',
      }),
      lireContenuEditorial('profil.notifications_recues.intro_lien', {
        valeurMd: 'Gérer mes préférences (mail, push)',
      }),
      lireContenuEditorial('profil.notifications_recues.cta_tout_marquer', {
        valeurMd: 'Tout marquer comme lu',
      }),
      lireContenuEditorial('profil.notifications_recues.empty_titre', {
        valeurMd: 'Pas encore de notification',
      }),
      lireContenuEditorial('profil.notifications_recues.empty_corps', {
        valeurMd:
          'Quand quelque chose te concerne (réservation, modération, commentaire), une notification apparaît ici. Tu peux aussi consulter ta messagerie interne pour les DM.',
      }),
    ]);
  const nbNonLues = notifs.filter((n) => !n.lue).length;

  return (
    <Container taille="md" className="py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading niveau={1}>
            <Bell size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
            <TexteEditableAdmin
              cle="profil.notifications_recues.titre"
              valeurInitiale={titre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre page notifications recues"
              longueurMax={50}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Heading>
          <p className="mt-2 text-text-2">
            <TexteEditableAdmin
              cle="profil.notifications_recues.intro_amorce"
              valeurInitiale={introAmorce.valeurMd}
              estAdmin={estAdmin}
              libelle="amorce intro (avant le lien)"
              longueurMax={150}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="profil.notifications_recues.intro_lien"
              valeurInitiale={introLien.valeurMd}
              estAdmin={estAdmin}
              libelle="lien vers preferences"
              longueurMax={60}
            >
              {(t) => (
                <Link href="/profil/notifications" className="text-brand hover:underline">
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>
            .
          </p>
        </div>
        {nbNonLues > 0 ? (
          <form
            action={async () => {
              'use server';
              await marquerToutesLues();
            }}
          >
            <Button type="submit" variant="ghost" taille="sm">
              <Check size={14} aria-hidden="true" />
              {ctaToutMarquer.valeurMd} ({nbNonLues})
            </Button>
          </form>
        ) : null}
      </div>

      {notifs.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="profil.notifications_recues.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty notifs"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
          className="mt-8"
        >
          <TexteEditableAdmin
            cle="profil.notifications_recues.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty notifs"
            multilignes
            longueurMax={300}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {notifs.map((n) => (
            <li key={n.id}>
              <CarteNotification notif={n} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function CarteNotification({ notif }: { notif: Notification }) {
  const corps = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display font-bold text-text-1">{notif.titre}</h2>
        <span className="text-text-3 text-xs">{FORMATEUR.format(new Date(notif.createdAt))}</span>
      </div>
      {notif.message !== null && notif.message !== '' ? (
        <p className="mt-1 text-sm text-text-2">{notif.message}</p>
      ) : null}
    </>
  );

  return (
    <Card variant="ombre" className={notif.lue ? 'opacity-70' : 'border-brand border-l-4'}>
      <div className="flex items-start gap-3">
        {!notif.lue ? (
          <>
            <span className="sr-only">Non lue</span>
            <span
              aria-hidden="true"
              className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-brand"
            />
          </>
        ) : null}
        <div className="flex-1">
          {notif.href !== null && notif.href !== '' ? (
            <Link href={notif.href} className="block hover:text-brand">
              {corps}
            </Link>
          ) : (
            corps
          )}
        </div>
        {!notif.lue ? (
          <form
            action={async () => {
              'use server';
              await marquerNotificationLue(notif.id);
            }}
          >
            <button
              type="submit"
              className="text-text-3 text-xs hover:text-text-1"
              aria-label="Marquer comme lue"
            >
              <Check size={14} aria-hidden="true" />
            </button>
          </form>
        ) : null}
      </div>
    </Card>
  );
}
