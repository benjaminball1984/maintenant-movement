import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
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
  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('profil.preferences_notifications.titre', {
      valeurMd: 'Notifications',
    }),
    lireContenuEditorial('profil.preferences_notifications.intro', {
      valeurMd:
        'On ne capte pas l’attention, on la respecte. Deux mails par semaine maximum (mardi récap + vendredi newsletter).',
    }),
  ]);

  // Les préférences notif sont stockées dans preferences_visibilite (jsonb)
  // sous la clé `notifications`. Si absentes ou invalides, on retombe sur
  // les valeurs par défaut (cf. spec §10 : opt-in pour push, opt-out pour mails).
  // V2.5.38 : merge avec DEFAUT pour les champs qui n'existaient pas dans
  // les vieilles entrées (ex. reseau_*), au lieu d'écraser toutes les prefs.
  const prefsBrutes =
    typeof personne.preferences_visibilite === 'object' && personne.preferences_visibilite !== null
      ? (personne.preferences_visibilite as Record<string, unknown>).notifications
      : null;

  const prefsObjet =
    typeof prefsBrutes === 'object' && prefsBrutes !== null
      ? (prefsBrutes as Record<string, unknown>)
      : {};
  const prefsMergees = { ...PREFERENCES_NOTIFICATIONS_DEFAUT, ...prefsObjet };
  const parse = preferencesNotificationsSchema.safeParse(prefsMergees);
  const valeursInitiales: PreferencesNotifications = parse.success
    ? parse.data
    : PREFERENCES_NOTIFICATIONS_DEFAUT;

  return (
    <article className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="profil.preferences_notifications.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre page preferences notifs"
          longueurMax={40}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="profil.preferences_notifications.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro page preferences notifs"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <FormulaireNotifications valeursInitiales={valeursInitiales} />
    </article>
  );
}
