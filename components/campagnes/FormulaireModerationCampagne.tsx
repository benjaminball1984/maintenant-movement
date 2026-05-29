'use client';

import { Alert, Button, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
  type MessagesValidationCampagne,
} from '@/lib/messages-validation';
import {
  type DonneesModererCampagne,
  creerModererCampagneSchema,
} from '@/lib/validations/campagne';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.152). */
export interface LibellesModerationCampagne {
  alertConfirmeTitre: string;
  alertConfirmePubliee: string;
  alertConfirmeRejetee: string;
  alertErreurTitre: string;
  ctaPublier: string;
  ctaPublierEnCours: string;
  ctaRejeterOuvrir: string;
  labelRaison: string;
  placeholderRaison: string;
  ctaRejeterSubmit: string;
  ctaRejeterEnCours: string;
  ctaAnnuler: string;
}

const LIBELLES_DEFAUT: LibellesModerationCampagne = {
  alertConfirmeTitre: 'Décision enregistrée',
  alertConfirmePubliee: 'La campagne est maintenant publiée.',
  alertConfirmeRejetee:
    'La campagne a été rejetée. La créateurice peut soumettre une nouvelle version.',
  alertErreurTitre: 'Action impossible',
  ctaPublier: 'Publier',
  ctaPublierEnCours: 'Envoi...',
  ctaRejeterOuvrir: 'Rejeter',
  labelRaison: 'Raison du rejet',
  placeholderRaison: 'Au moins 10 caractères, visibles par la créateurice.',
  ctaRejeterSubmit: 'Confirmer le rejet',
  ctaRejeterEnCours: 'Envoi...',
  ctaAnnuler: 'Annuler',
};

interface FormulaireModerationCampagneProps {
  campagneId: string;
  modererCampagne: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  libelles?: LibellesModerationCampagne;
  messages?: MessagesValidationCampagne;
  /**
   * Titre de la campagne concernée. Si fourni, il enrichit l'`aria-label`
   * des boutons « Publier » / « Rejeter ». Optionnel : sans lui,
   * comportement inchangé.
   */
  libelleObjet?: string;
}

/**
 * Formulaire de modération d'une campagne (Client Component).
 *
 * Identique en logique au formulaire de modération de pétition (3.1) :
 * publier (sans raison) ou rejeter (raison >= 10 chars). La raison de
 * rejet n'apparaît qu'au clic sur Rejeter, pour ne pas pousser à la
 * décision négative.
 */
export function FormulaireModerationCampagne({
  campagneId,
  modererCampagne,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
  libelleObjet,
}: FormulaireModerationCampagneProps) {
  const [modeRejet, setModeRejet] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirme, setConfirme] = useState<'publiee' | 'rejetee' | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DonneesModererCampagne>({
    resolver: zodResolver(creerModererCampagneSchema(messages)),
    defaultValues: {
      campagne_id: campagneId,
      decision: 'publiee',
      raison_rejet: '',
    },
  });

  async function publier() {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await modererCampagne({
      campagne_id: campagneId,
      decision: 'publiee',
    });
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setConfirme('publiee');
  }

  async function rejeter(donnees: DonneesModererCampagne) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await modererCampagne({
      campagne_id: campagneId,
      decision: 'rejetee',
      raison_rejet: donnees.raison_rejet,
    });
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setConfirme('rejetee');
  }

  if (confirme !== null) {
    return (
      <Alert
        variant={confirme === 'publiee' ? 'success' : 'info'}
        titre={libelles.alertConfirmeTitre}
      >
        {confirme === 'publiee' ? libelles.alertConfirmePubliee : libelles.alertConfirmeRejetee}
      </Alert>
    );
  }

  return (
    <div className="grid gap-3 border-t border-border pt-4">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <input type="hidden" {...register('campagne_id')} />

      {!modeRejet ? (
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={publier}
            disabled={envoiEnCours}
            aria-label={libelleObjet ? `${libelles.ctaPublier} : ${libelleObjet}` : undefined}
          >
            {envoiEnCours ? libelles.ctaPublierEnCours : libelles.ctaPublier}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setModeRejet(true)}
            disabled={envoiEnCours}
            aria-label={libelleObjet ? `${libelles.ctaRejeterOuvrir} : ${libelleObjet}` : undefined}
          >
            {libelles.ctaRejeterOuvrir}
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit(rejeter)} className="grid gap-3">
          <div>
            <Label htmlFor={`raison-camp-${campagneId}`} obligatoire>
              {libelles.labelRaison}
            </Label>
            <Textarea
              id={`raison-camp-${campagneId}`}
              rows={3}
              placeholder={libelles.placeholderRaison}
              aria-invalid={errors.raison_rejet !== undefined}
              aria-describedby={
                errors.raison_rejet !== undefined ? `raison-camp-erreur-${campagneId}` : undefined
              }
              {...register('raison_rejet')}
            />
            {errors.raison_rejet !== undefined ? (
              <p id={`raison-camp-erreur-${campagneId}`} className="mt-1 text-xs text-danger">
                {errors.raison_rejet.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={envoiEnCours}>
              {envoiEnCours ? libelles.ctaRejeterEnCours : libelles.ctaRejeterSubmit}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModeRejet(false)}
              disabled={envoiEnCours}
            >
              {libelles.ctaAnnuler}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
