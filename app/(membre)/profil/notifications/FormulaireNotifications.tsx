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

interface FormulaireNotificationsProps {
  valeursInitiales: PreferencesNotifications;
}

/**
 * Préférences de notifications (5 canaux, cf. spec §10).
 * Messagerie interne et cloche sont toujours actives (non négociables).
 * Push, push son/vibration, mardi récap, vendredi newsletter : configurables.
 */
export function FormulaireNotifications({ valeursInitiales }: FormulaireNotificationsProps) {
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
        <Alert variant="danger" titre="Sauvegarde impossible">
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre="Préférences enregistrées">
          Tes choix de notifications sont à jour.
        </Alert>
      ) : null}

      <fieldset className="grid gap-3 rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-bold uppercase tracking-cap text-text-3">
          Notifications push (navigateur)
        </legend>
        <Case
          id="prefs-push"
          {...register('push')}
          libelle="Activer les notifications push"
          aide="Affiche un badge discret sur la cloche. Aucune capture d’attention."
        />
        <Case
          id="prefs-push-son"
          {...register('push_son')}
          libelle="Son"
          aide="Désactivé par défaut. Tu peux l’activer si tu veux."
          disabled={!pushActif}
        />
        <Case
          id="prefs-push-vibration"
          {...register('push_vibration')}
          libelle="Vibration"
          aide="Mobile uniquement."
          disabled={!pushActif}
        />
      </fieldset>

      <fieldset className="grid gap-3 rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-bold uppercase tracking-cap text-text-3">
          Emails hebdomadaires
        </legend>
        <Case
          id="prefs-mardi"
          {...register('mardi_recap')}
          libelle="Mardi : récap personnel"
          aide="Regroupement style Facebook de ce qui s’est passé dans tes espaces."
        />
        <Case
          id="prefs-vendredi"
          {...register('vendredi_newsletter')}
          libelle="Vendredi : newsletter du mouvement"
          aide="Édito de la semaine, taggée par origine et département."
        />
      </fieldset>

      <Alert variant="info" titre="Toujours actifs">
        La messagerie interne et la cloche restent toujours actives : c’est par là que les choses
        importantes (DM, désignations, modération te concernant) arrivent.
      </Alert>

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Envoi en cours...' : 'Enregistrer mes préférences'}
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
