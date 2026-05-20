import { Heading } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import {
  PREFERENCES_NOTIFICATIONS_DEFAUT,
  type PreferencesNotifications,
  preferencesNotificationsSchema,
} from '@/lib/validations/profil';
import type { Metadata } from 'next';
import { FormulaireNotifications } from './FormulaireNotifications';

export const metadata: Metadata = {
  title: 'Notifications',
};

export default async function PageNotifications() {
  const { personne } = await getPersonneOuRediriger('/profil/notifications');

  // Les préférences notif sont stockées dans preferences_visibilite (jsonb)
  // sous la clé `notifications`. Si absentes ou invalides, on retombe sur
  // les valeurs par défaut (cf. spec §10 : opt-in pour push, opt-out pour mails).
  const prefsBrutes =
    typeof personne.preferences_visibilite === 'object' && personne.preferences_visibilite !== null
      ? (personne.preferences_visibilite as Record<string, unknown>).notifications
      : null;

  const parse = preferencesNotificationsSchema.safeParse(prefsBrutes);
  const valeursInitiales: PreferencesNotifications = parse.success
    ? parse.data
    : PREFERENCES_NOTIFICATIONS_DEFAUT;

  return (
    <article className="grid gap-6">
      <header>
        <Heading niveau={1}>Notifications</Heading>
        <p className="mt-2 text-text-2">
          On ne capte pas l’attention, on la respecte. Deux mails par semaine maximum (mardi récap +
          vendredi newsletter).
        </p>
      </header>

      <FormulaireNotifications valeursInitiales={valeursInitiales} />
    </article>
  );
}
