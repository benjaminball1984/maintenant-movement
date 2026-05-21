'use client';

import { Alert, Button, Label, Textarea } from '@/components/ui';
import { type DonneesSuspendreCagnotte, suspendreCagnotteSchema } from '@/lib/validations/cagnotte';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireModerationCagnotteProps {
  cagnotteId: string;
  estSuspendue: boolean;
  suspendreCagnotte: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  retablirCagnotte: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
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
    resolver: zodResolver(suspendreCagnotteSchema),
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
      <Alert variant="info" titre="Décision enregistrée">
        {confirme === 'suspendue'
          ? 'La cagnotte est suspendue ; les dons sont bloqués.'
          : 'La cagnotte est rétablie ; les dons sont à nouveau possibles.'}
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

      {estSuspendue ? (
        <Button onClick={onRetablir} disabled={envoiEnCours}>
          {envoiEnCours ? 'Envoi...' : 'Rétablir la cagnotte'}
        </Button>
      ) : !ouvert ? (
        <Button variant="ghost" onClick={() => setOuvert(true)}>
          Suspendre cette cagnotte
        </Button>
      ) : (
        <form noValidate onSubmit={handleSubmit(onSuspendre)} className="grid gap-3">
          <div>
            <Label htmlFor={`raison-cag-${cagnotteId}`} obligatoire>
              Raison de la suspension
            </Label>
            <Textarea
              id={`raison-cag-${cagnotteId}`}
              rows={3}
              placeholder="Au moins 10 caractères, visibles publiquement."
              {...register('raison_suspension')}
            />
            {errors.raison_suspension !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.raison_suspension.message}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={envoiEnCours}>
              {envoiEnCours ? 'Envoi...' : 'Confirmer la suspension'}
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
