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

interface FormulaireModerationCampagneProps {
  campagneId: string;
  modererCampagne: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  messages?: MessagesValidationCampagne;
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
  messages = MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
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
      <Alert variant={confirme === 'publiee' ? 'success' : 'info'} titre="Décision enregistrée">
        {confirme === 'publiee'
          ? 'La campagne est maintenant publiée.'
          : 'La campagne a été rejetée. La créateurice peut soumettre une nouvelle version.'}
      </Alert>
    );
  }

  return (
    <div className="grid gap-3 border-t border-border pt-4">
      {erreur !== null ? (
        <Alert variant="danger" titre="Action impossible">
          {erreur}
        </Alert>
      ) : null}

      <input type="hidden" {...register('campagne_id')} />

      {!modeRejet ? (
        <div className="flex flex-wrap gap-3">
          <Button onClick={publier} disabled={envoiEnCours}>
            {envoiEnCours ? 'Envoi...' : 'Publier'}
          </Button>
          <Button variant="ghost" onClick={() => setModeRejet(true)} disabled={envoiEnCours}>
            Rejeter
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit(rejeter)} className="grid gap-3">
          <div>
            <Label htmlFor={`raison-camp-${campagneId}`} obligatoire>
              Raison du rejet
            </Label>
            <Textarea
              id={`raison-camp-${campagneId}`}
              rows={3}
              placeholder="Au moins 10 caractères, visibles par la créateurice."
              {...register('raison_rejet')}
            />
            {errors.raison_rejet !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.raison_rejet.message}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={envoiEnCours}>
              {envoiEnCours ? 'Envoi...' : 'Confirmer le rejet'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModeRejet(false)}
              disabled={envoiEnCours}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
