'use client';

import { Alert, Button } from '@/components/ui';
import {
  type PreferencesNotifications,
  preferencesNotificationsSchema,
} from '@/lib/validations/profil';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { mettreAJourPreferencesNotifications } from '../actions';

/** Libelles surchargeables admin via CMS (V2.4.143). */
export interface LibellesNotifications {
  alertErreurTitre: string;
  alertSuccesTitre: string;
  alertSuccesMessage: string;
  alertToujoursActifsTitre: string;
  alertToujoursActifsMessage: string;
  legendePush: string;
  libellePush: string;
  aidePush: string;
  libelleSon: string;
  aideSon: string;
  libelleVibration: string;
  aideVibration: string;
  legendeEmails: string;
  libelleMardi: string;
  aideMardi: string;
  libelleVendredi: string;
  aideVendredi: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesNotifications = {
  alertErreurTitre: 'Sauvegarde impossible',
  alertSuccesTitre: 'Préférences enregistrées',
  alertSuccesMessage: 'Tes choix de notifications sont à jour.',
  alertToujoursActifsTitre: 'Toujours actifs',
  alertToujoursActifsMessage:
    'La messagerie interne et la cloche restent toujours actives : c’est par là que les choses importantes (DM, désignations, modération te concernant) arrivent.',
  legendePush: 'Notifications push (navigateur)',
  libellePush: 'Activer les notifications push',
  aidePush: 'Affiche un badge discret sur la cloche. Aucune capture d’attention.',
  libelleSon: 'Son',
  aideSon: 'Désactivé par défaut. Tu peux l’activer si tu veux.',
  libelleVibration: 'Vibration',
  aideVibration: 'Mobile uniquement.',
  legendeEmails: 'Emails hebdomadaires',
  libelleMardi: 'Mardi : récap personnel',
  aideMardi: 'Regroupement style Facebook de ce qui s’est passé dans tes espaces.',
  libelleVendredi: 'Vendredi : newsletter du mouvement',
  aideVendredi: 'Édito de la semaine, taggée par origine et département.',
  ctaSubmit: 'Enregistrer mes préférences',
  ctaEnCours: 'Envoi en cours...',
};

interface FormulaireNotificationsProps {
  valeursInitiales: PreferencesNotifications;
  libelles?: LibellesNotifications;
}

/**
 * Préférences de notifications (5 canaux, cf. spec §10).
 * Messagerie interne et cloche sont toujours actives (non négociables).
 * Push, push son/vibration, mardi récap, vendredi newsletter : configurables.
 */
export function FormulaireNotifications({
  valeursInitiales,
  libelles = LIBELLES_DEFAUT,
}: FormulaireNotificationsProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const { register, handleSubmit, watch } = useForm<PreferencesNotifications>({
    resolver: zodResolver(preferencesNotificationsSchema),
    defaultValues: valeursInitiales,
  });

  const pushActif = watch('push');

  async function onSubmit(donnees: PreferencesNotifications) {
    setErreur(null);
    setSucces(false);
    setEnvoiEnCours(true);
    const resultat = await mettreAJourPreferencesNotifications(donnees);
    setEnvoiEnCours(false);

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(true);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-5"
      aria-label="Préférences de notifications"
    >
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre={libelles.alertSuccesTitre}>
          {libelles.alertSuccesMessage}
        </Alert>
      ) : null}

      <fieldset className="grid gap-3 rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-bold uppercase tracking-cap text-text-3">
          {libelles.legendePush}
        </legend>
        <Case
          id="prefs-push"
          {...register('push')}
          libelle={libelles.libellePush}
          aide={libelles.aidePush}
        />
        <Case
          id="prefs-push-son"
          {...register('push_son')}
          libelle={libelles.libelleSon}
          aide={libelles.aideSon}
          disabled={!pushActif}
        />
        <Case
          id="prefs-push-vibration"
          {...register('push_vibration')}
          libelle={libelles.libelleVibration}
          aide={libelles.aideVibration}
          disabled={!pushActif}
        />
      </fieldset>

      <fieldset className="grid gap-3 rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-bold uppercase tracking-cap text-text-3">
          {libelles.legendeEmails}
        </legend>
        <Case
          id="prefs-mardi"
          {...register('mardi_recap')}
          libelle={libelles.libelleMardi}
          aide={libelles.aideMardi}
        />
        <Case
          id="prefs-vendredi"
          {...register('vendredi_newsletter')}
          libelle={libelles.libelleVendredi}
          aide={libelles.aideVendredi}
        />
      </fieldset>

      <Alert variant="info" titre={libelles.alertToujoursActifsTitre}>
        {libelles.alertToujoursActifsMessage}
      </Alert>

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}

interface CaseProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  libelle: string;
  aide?: string;
}

function Case({ id, libelle, aide, ...inputProps }: CaseProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xs p-1 hover:bg-surface-2"
    >
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-4 w-4 rounded-xs accent-brand"
        {...inputProps}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-text-1">{libelle}</span>
        {aide !== undefined ? <span className="text-xs text-text-3">{aide}</span> : null}
      </span>
    </label>
  );
}
