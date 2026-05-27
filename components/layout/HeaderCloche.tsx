import { compterNotificationsNonLues } from '@/lib/notification';
import { Bell } from 'lucide-react';
import Link from 'next/link';

/**
 * Cloche de notifications (V2.3.25) — canal 1 du CDC V2 §7.
 *
 * Server Component : compte les notifs non lues à chaque rendu de
 * header. Badge rouge avec compteur si > 0. Pas d'overlay déroulant
 * (philosophie « on respecte l'attention, on ne la capte pas ») : un
 * clic dirige vers la page complète `/profil/notifications`.
 */
export async function HeaderCloche({ personneId }: { personneId: string }) {
  const compteur = await compterNotificationsNonLues(personneId);

  return (
    <Link
      href="/profil/notifications-recues"
      aria-label={
        compteur === 0
          ? 'Notifications (aucune nouvelle)'
          : `Notifications (${compteur} non lue${compteur > 1 ? 's' : ''})`
      }
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-text-2 hover:bg-surface-2 hover:text-text-1"
    >
      <Bell size={18} aria-hidden="true" />
      {compteur > 0 ? (
        <span
          aria-hidden="true"
          className="-top-1 -right-1 absolute inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1 font-bold text-bg text-xs"
        >
          {compteur > 99 ? '99+' : compteur}
        </span>
      ) : null}
    </Link>
  );
}
