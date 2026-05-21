'use client';

import { Alert, Button, Label, Textarea } from '@/components/ui';
import {
  type DonneesRetirerMobilisation,
  retirerMobilisationSchema,
} from '@/lib/validations/mobilisation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireRetraitProps {
  mobilisationId: string;
  retirerMobilisation: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
}

/**
 * Formulaire de retrait a posteriori d'une mobilisation (Client Component).
 *
 * Modération a posteriori : la mobilisation est déjà publiée, l'action
 * est destructive (la rend invisible). On masque le formulaire derrière
 * un bouton « Retirer », demande une raison >= 10 chars, puis confirme.
 */
export function FormulaireRetrait({ mobilisationId, retirerMobilisation }: FormulaireRetraitProps) {
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirme, setConfirme] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DonneesRetirerMobilisation>({
    resolver: zodResolver(retirerMobilisationSchema),
    defaultValues: {
      mobilisation_id: mobilisationId,
      raison_retrait: '',
    },
  });

  async function onSubmit(donnees: DonneesRetirerMobilisation) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await retirerMobilisation({
      mobilisation_id: mobilisationId,
      raison_retrait: donnees.raison_retrait,
    });
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setConfirme(true);
  }

  if (confirme) {
    return (
      <Alert variant="info" titre="Mobilisation retirée">
        La mobilisation n'est plus visible publiquement. La créateurice peut republier une version
        corrigée.
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

      {!ouvert ? (
        <Button variant="ghost" onClick={() => setOuvert(true)}>
          Retirer cette mobilisation
        </Button>
      ) : (
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
          <div>
            <Label htmlFor={`raison-mob-${mobilisationId}`} obligatoire>
              Raison du retrait
            </Label>
            <Textarea
              id={`raison-mob-${mobilisationId}`}
              rows={3}
              placeholder="Au moins 10 caractères, visibles par la créateurice."
              {...register('raison_retrait')}
            />
            {errors.raison_retrait !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.raison_retrait.message}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={envoiEnCours}>
              {envoiEnCours ? 'Envoi...' : 'Confirmer le retrait'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOuvert(false)}
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
