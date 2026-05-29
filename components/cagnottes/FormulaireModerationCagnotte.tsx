'use client';

import { Alert, Button, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
  type MessagesValidationCagnotte,
} from '@/lib/messages-validation';
import {
  type DonneesSuspendreCagnotte,
  creerSuspendreCagnotteSchema,
} from '@/lib/validations/cagnotte';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.145). */
export interface LibellesModerationCagnotte {
  alertConfirmeTitre: string;
  alertConfirmeSuspendue: string;
  alertConfirmeRetablie: string;
  alertErreurTitre: string;
  ctaRetablir: string;
  ctaRetablirEnCours: string;
  ctaOuvrirSuspendre: string;
  labelRaison: string;
  placeholderRaison: string;
  ctaSubmit: string;
  ctaEnCours: string;
  ctaAnnuler: string;
}

const LIBELLES_DEFAUT: LibellesModerationCagnotte = {
  alertConfirmeTitre: 'Décision enregistrée',
  alertConfirmeSuspendue: 'La cagnotte est suspendue ; les dons sont bloqués.',
  alertConfirmeRetablie: 'La cagnotte est rétablie ; les dons sont à nouveau possibles.',
  alertErreurTitre: 'Action impossible',
  ctaRetablir: 'Rétablir la cagnotte',
  ctaRetablirEnCours: 'Envoi...',
  ctaOuvrirSuspendre: 'Suspendre cette cagnotte',
  labelRaison: 'Raison de la suspension',
  placeholderRaison: 'Au moins 10 caractères, visibles publiquement.',
  ctaSubmit: 'Confirmer la suspension',
  ctaEnCours: 'Envoi...',
  ctaAnnuler: 'Annuler',
};

interface FormulaireModerationCagnotteProps {
  cagnotteId: string;
  estSuspendue: boolean;
  suspendreCagnotte: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  retablirCagnotte: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  libelles?: LibellesModerationCagnotte;
  messages?: MessagesValidationCagnotte;
  /**
   * Titre de la cagnotte concernée. Si fourni, il enrichit l'`aria-label`
   * des boutons « Suspendre » / « Rétablir ». Optionnel : sans lui,
   * comportement inchangé.
   */
  libelleObjet?: string;
}

/**
 * Formulaire de modération a posteriori d'une cagnotte.
 *
 * Deux états :
 *   - cagnotte publiée → bouton « Suspendre » + raison.
 *   - cagnotte suspendue → bouton « Rétablir » sans condition.
 */
export function FormulaireModerationCagnotte({
  cagnotteId,
  estSuspendue,
  suspendreCagnotte,
  retablirCagnotte,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_CAGNOTTE_DEFAUT,
  libelleObjet,
}: FormulaireModerationCagnotteProps) {
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirme, setConfirme] = useState<'suspendue' | 'retablie' | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DonneesSuspendreCagnotte>({
    resolver: zodResolver(creerSuspendreCagnotteSchema(messages)),
    defaultValues: { cagnotte_id: cagnotteId, raison_suspension: '' },
  });

  async function onSuspendre(donnees: DonneesSuspendreCagnotte) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await suspendreCagnotte({
      cagnotte_id: cagnotteId,
      raison_suspension: donnees.raison_suspension,
    });
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setConfirme('suspendue');
  }

  async function onRetablir() {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await retablirCagnotte({ cagnotte_id: cagnotteId });
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setConfirme('retablie');
  }

  if (confirme !== null) {
    return (
      <Alert variant="info" titre={libelles.alertConfirmeTitre}>
        {confirme === 'suspendue'
          ? libelles.alertConfirmeSuspendue
          : libelles.alertConfirmeRetablie}
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

      {estSuspendue ? (
        <Button
          onClick={onRetablir}
          disabled={envoiEnCours}
          aria-label={libelleObjet ? `${libelles.ctaRetablir} : ${libelleObjet}` : undefined}
        >
          {envoiEnCours ? libelles.ctaRetablirEnCours : libelles.ctaRetablir}
        </Button>
      ) : !ouvert ? (
        <Button
          variant="ghost"
          onClick={() => setOuvert(true)}
          aria-label={libelleObjet ? `${libelles.ctaOuvrirSuspendre} : ${libelleObjet}` : undefined}
        >
          {libelles.ctaOuvrirSuspendre}
        </Button>
      ) : (
        <form noValidate onSubmit={handleSubmit(onSuspendre)} className="grid gap-3">
          <div>
            <Label htmlFor={`raison-cag-${cagnotteId}`} obligatoire>
              {libelles.labelRaison}
            </Label>
            <Textarea
              id={`raison-cag-${cagnotteId}`}
              rows={3}
              placeholder={libelles.placeholderRaison}
              aria-invalid={errors.raison_suspension !== undefined}
              aria-describedby={
                errors.raison_suspension !== undefined
                  ? `raison-cag-erreur-${cagnotteId}`
                  : undefined
              }
              {...register('raison_suspension')}
            />
            {errors.raison_suspension !== undefined ? (
              <p id={`raison-cag-erreur-${cagnotteId}`} className="mt-1 text-xs text-danger">
                {errors.raison_suspension.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={envoiEnCours}>
              {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOuvert(false)}
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
