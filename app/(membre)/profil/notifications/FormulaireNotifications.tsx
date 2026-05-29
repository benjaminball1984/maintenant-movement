'use client';

import { Alert, Button } from '@/components/ui';
import {
  type ModeNotifReseau,
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
  // V2.5.38 — section reseau social
  legendeReseau: string;
  libelleReseauMessage: string;
  aideReseauMessage: string;
  libelleReseauCommentaire: string;
  aideReseauCommentaire: string;
  libelleReseauSoutien: string;
  aideReseauSoutien: string;
  optionCloche: string;
  optionMailImmediat: string;
  optionDigestQuotidien: string;
  optionDigestHebdo: string;
  optionAucune: string;
  hintDigestPasEncore: string;
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
  legendeReseau: 'Notifications du réseau social',
  libelleReseauMessage: 'Quand je reçois un message direct',
  aideReseauMessage: "Quelqu'un t'écrit en privé via la messagerie du réseau.",
  libelleReseauCommentaire: 'Quand on commente ma publication',
  aideReseauCommentaire: 'Une personne réagit à un de tes posts.',
  libelleReseauSoutien: 'Quand on soutient ma publication',
  aideReseauSoutien: 'Une personne pose un cœur sur un de tes posts.',
  optionCloche: 'Cloche uniquement (défaut)',
  optionMailImmediat: 'Cloche + email immédiat',
  optionDigestQuotidien: 'Cloche + digest quotidien (à venir)',
  optionDigestHebdo: 'Cloche + digest hebdomadaire (à venir)',
  optionAucune: 'Silence total (ni cloche ni email)',
  hintDigestPasEncore:
    'Les digests sont préparés mais pas encore actifs : ils tombent en « cloche uniquement » en attendant le cron de regroupement.',
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

      {/* V2.5.38 — préférences notifs réseau social (3 types × 5 modes) */}
      <fieldset className="grid gap-4 rounded-md border border-border p-4">
        <legend className="px-1 font-bold text-text-3 text-sm uppercase tracking-cap">
          {libelles.legendeReseau}
        </legend>
        <SelecteurMode
          id="prefs-reseau-message"
          libelle={libelles.libelleReseauMessage}
          aide={libelles.aideReseauMessage}
          {...register('reseau_message_recu')}
          libelles={libelles}
        />
        <SelecteurMode
          id="prefs-reseau-comment"
          libelle={libelles.libelleReseauCommentaire}
          aide={libelles.aideReseauCommentaire}
          {...register('reseau_post_commente')}
          libelles={libelles}
        />
        <SelecteurMode
          id="prefs-reseau-soutien"
          libelle={libelles.libelleReseauSoutien}
          aide={libelles.aideReseauSoutien}
          {...register('reseau_post_soutenu')}
          libelles={libelles}
        />
        <p className="text-text-3 text-xs italic">{libelles.hintDigestPasEncore}</p>
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

/**
 * V2.5.38 — sélecteur de mode pour une préf de notif réseau.
 * Présente 5 modes en select. Les digests sont visibles mais
 * étiquetés « à venir » (cf. hintDigestPasEncore).
 */
interface SelecteurModeProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  libelle: string;
  aide?: string;
  libelles: LibellesNotifications;
}

const MODES_ORDONNES: ModeNotifReseau[] = [
  'cloche',
  'mail_immediat',
  'digest_quotidien',
  'digest_hebdo',
  'aucune',
];

function SelecteurMode({ id, libelle, aide, libelles, ...selectProps }: SelecteurModeProps) {
  const labelMode: Record<ModeNotifReseau, string> = {
    cloche: libelles.optionCloche,
    mail_immediat: libelles.optionMailImmediat,
    digest_quotidien: libelles.optionDigestQuotidien,
    digest_hebdo: libelles.optionDigestHebdo,
    aucune: libelles.optionAucune,
  };
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-medium text-sm text-text-1">
        {libelle}
      </label>
      {aide !== undefined ? <span className="text-text-3 text-xs">{aide}</span> : null}
      <select
        id={id}
        className="w-full rounded-md border border-border bg-surface p-2 text-sm"
        {...selectProps}
      >
        {MODES_ORDONNES.map((m) => (
          <option key={m} value={m}>
            {labelMode[m]}
          </option>
        ))}
      </select>
    </div>
  );
}
