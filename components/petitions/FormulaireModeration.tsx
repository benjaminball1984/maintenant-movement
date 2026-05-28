'use client';

import { Alert, Button, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_PETITION_DEFAUT,
  type MessagesValidationPetition,
} from '@/lib/messages-validation';
import {
  type DonneesModererPetition,
  creerModererPetitionSchema,
} from '@/lib/validations/petition';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.152). */
export interface LibellesModerationPetition {
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

const LIBELLES_DEFAUT: LibellesModerationPetition = {
  alertConfirmeTitre: 'Décision enregistrée',
  alertConfirmePubliee: 'La pétition est maintenant publiée.',
  alertConfirmeRejetee:
    'La pétition a été rejetée. La créatrice peut soumettre une nouvelle version.',
  alertErreurTitre: 'Action impossible',
  ctaPublier: 'Publier',
  ctaPublierEnCours: 'Envoi...',
  ctaRejeterOuvrir: 'Rejeter',
  labelRaison: 'Raison du rejet',
  placeholderRaison: 'Au moins 10 caractères, visibles par la créatrice.',
  ctaRejeterSubmit: 'Confirmer le rejet',
  ctaRejeterEnCours: 'Envoi...',
  ctaAnnuler: 'Annuler',
};

interface FormulaireModerationProps {
  petitionId: string;
  modererPetition: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  libelles?: LibellesModerationPetition;
  messages?: MessagesValidationPetition;
}

/**
 * Formulaire de modération d'une pétition (composant client).
 *
 * Deux actions distinctes :
 *   - « Publier » : décision = `publiee`, aucune raison nécessaire.
 *   - « Rejeter » : décision = `rejetee`, raison obligatoire (>= 10 chars).
 *
 * La raison de rejet est masquée par défaut ; elle apparaît au clic sur
 * le bouton « Rejeter », pour ne pas pousser à la décision négative.
 */
export function FormulaireModeration({
  petitionId,
  modererPetition,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_PETITION_DEFAUT,
}: FormulaireModerationProps) {
  const [modeRejet, setModeRejet] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirme, setConfirme] = useState<'publiee' | 'rejetee' | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
  } = useForm<DonneesModererPetition>({
    resolver: zodResolver(creerModererPetitionSchema(messages)),
    defaultValues: {
      petition_id: petitionId,
      decision: 'publiee',
      raison_rejet: '',
    },
  });

  async function publier() {
    setValue('decision', 'publiee');
    setErreur(null);
    setEnvoiEnCours(true);
    const valide = await trigger();
    if (!valide) {
      setEnvoiEnCours(false);
      return;
    }
    const resultat = await modererPetition({
      petition_id: petitionId,
      decision: 'publiee',
    });
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setConfirme('publiee');
  }

  async function rejeter(donnees: DonneesModererPetition) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await modererPetition({
      petition_id: petitionId,
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

      <input type="hidden" {...register('petition_id')} />

      {!modeRejet ? (
        <div className="flex flex-wrap gap-3">
          <Button onClick={publier} disabled={envoiEnCours}>
            {envoiEnCours ? libelles.ctaPublierEnCours : libelles.ctaPublier}
          </Button>
          <Button variant="ghost" onClick={() => setModeRejet(true)} disabled={envoiEnCours}>
            {libelles.ctaRejeterOuvrir}
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit(rejeter)} className="grid gap-3">
          <div>
            <Label htmlFor={`raison-${petitionId}`} obligatoire>
              {libelles.labelRaison}
            </Label>
            <Textarea
              id={`raison-${petitionId}`}
              rows={3}
              placeholder={libelles.placeholderRaison}
              {...register('raison_rejet')}
            />
            {errors.raison_rejet !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.raison_rejet.message}</p>
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
