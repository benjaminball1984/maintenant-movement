'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, IconButton, Input, Label } from '@/components/ui';
import { type DonneesSignerPetition, signerPetitionSchema } from '@/lib/validations/petition';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ModaleSignaturePetitionProps {
  /** ID UUID de la pétition à signer. */
  petitionId: string;
  /** Titre de la pétition (affiché dans le header de la modale). */
  petitionTitre: string;
  /** Nom de la personne qui a créé la pétition (pour la case d'autorisation). */
  createuricePrenom: string;
  /** Server Action à appeler pour la signature. */
  signerPetition: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Élément déclencheur du dialog (par défaut un Button gradient). */
  declencheur?: React.ReactNode;
}

/**
 * Modale de signature de pétition (spec §3 « Parcours pétition »).
 *
 * Utilise l'élément HTML5 natif `<dialog>` : accessible par défaut
 * (focus trap, Échap pour fermer, backdrop), léger, pas de dépendance
 * Radix nécessaire (cf. ADR-003). Cohérent avec la doctrine « pas de
 * captation d'attention » : modale légère, sobre.
 *
 * Champs (spec) : nom, prénom, code postal, email, téléphone optionnel.
 * Cases : newsletter + autorisation contact créateurice.
 * Remerciement sans demande de partage.
 */
export function ModaleSignaturePetition({
  petitionId,
  petitionTitre,
  createuricePrenom,
  signerPetition,
  declencheur,
}: ModaleSignaturePetitionProps) {
  const refDialog = useRef<HTMLDialogElement>(null);
  const [merci, setMerci] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DonneesSignerPetition>({
    resolver: zodResolver(signerPetitionSchema),
    defaultValues: {
      petition_id: petitionId,
      accepte_newsletter: false,
      accepte_contact_createurice: false,
      token_turnstile: '',
    },
  });

  function ouvrir() {
    setMerci(false);
    setErreur(null);
    reset({
      petition_id: petitionId,
      accepte_newsletter: false,
      accepte_contact_createurice: false,
      token_turnstile: '',
    });
    refDialog.current?.showModal();
  }

  function fermer() {
    refDialog.current?.close();
  }

  // Restaurer le scroll quand la modale se ferme.
  useEffect(() => {
    const dialog = refDialog.current;
    if (dialog === null) return;
    function bloquerScroll() {
      document.body.style.overflow = 'hidden';
    }
    function rendreScroll() {
      document.body.style.overflow = '';
    }
    dialog.addEventListener('show', bloquerScroll);
    dialog.addEventListener('close', rendreScroll);
    return () => {
      dialog.removeEventListener('show', bloquerScroll);
      dialog.removeEventListener('close', rendreScroll);
      rendreScroll();
    };
  }, []);

  async function onSubmit(donnees: DonneesSignerPetition) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await signerPetition(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setMerci(true);
  }

  return (
    <>
      {declencheur !== undefined ? (
        <button
          type="button"
          onClick={ouvrir}
          className="contents text-left"
          aria-label={`Ouvrir la modale de signature de : ${petitionTitre}`}
        >
          {declencheur}
        </button>
      ) : (
        <Button onClick={ouvrir}>Signer la pétition</Button>
      )}

      <dialog
        ref={refDialog}
        className="m-auto w-full max-w-lg rounded-lg border border-border bg-surface p-0 shadow-lg backdrop:bg-black/40"
        aria-label={`Signer la pétition : ${petitionTitre}`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-cap text-text-3">
              Signer la pétition
            </p>
            <p className="mt-1 font-bold text-text-1">{petitionTitre}</p>
          </div>
          <IconButton aria-label="Fermer la modale" onClick={fermer} taille="sm">
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </header>

        {merci ? (
          <div className="grid gap-4 p-6 text-center">
            <p className="font-display text-2xl font-bold text-text-1">Merci pour ta signature.</p>
            <p className="text-text-2">
              Ton signal est enregistré. Pas de partage à demander : c'est déjà fort.
            </p>
            <Button onClick={fermer} variant="ghost">
              Fermer
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-3 p-6">
            {erreur !== null ? (
              <Alert variant="danger" titre="Signature impossible">
                {erreur}
              </Alert>
            ) : null}

            <input type="hidden" {...register('petition_id')} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="sig-prenom" obligatoire>
                  Prénom
                </Label>
                <Input id="sig-prenom" autoComplete="given-name" {...register('prenom')} />
                {errors.prenom !== undefined ? (
                  <p className="mt-1 text-xs text-danger">{errors.prenom.message}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="sig-nom" obligatoire>
                  Nom
                </Label>
                <Input id="sig-nom" autoComplete="family-name" {...register('nom')} />
                {errors.nom !== undefined ? (
                  <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>
                ) : null}
              </div>
            </div>

            <div>
              <Label htmlFor="sig-email" obligatoire>
                Email
              </Label>
              <Input id="sig-email" type="email" autoComplete="email" {...register('email')} />
              {errors.email !== undefined ? (
                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="sig-cp" obligatoire>
                  Code postal
                </Label>
                <Input
                  id="sig-cp"
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="postal-code"
                  {...register('code_postal')}
                />
                {errors.code_postal !== undefined ? (
                  <p className="mt-1 text-xs text-danger">{errors.code_postal.message}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="sig-tel">Téléphone (optionnel)</Label>
                <Input id="sig-tel" type="tel" autoComplete="tel" {...register('telephone')} />
                {errors.telephone !== undefined ? (
                  <p className="mt-1 text-xs text-danger">{errors.telephone.message}</p>
                ) : null}
              </div>
            </div>

            <label
              htmlFor="sig-newsletter"
              className="flex cursor-pointer items-start gap-2 text-sm text-text-2"
            >
              <input
                id="sig-newsletter"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded-xs accent-brand"
                {...register('accepte_newsletter')}
              />
              <span>
                Je veux recevoir la newsletter Maintenant! (mardi récap + vendredi édito).
              </span>
            </label>

            <label
              htmlFor="sig-createurice"
              className="flex cursor-pointer items-start gap-2 text-sm text-text-2"
            >
              <input
                id="sig-createurice"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded-xs accent-brand"
                {...register('accepte_contact_createurice')}
              />
              <span>
                J'autorise <strong>{createuricePrenom}</strong> (qui a créé cette pétition) à me
                contacter par email pour des actualités liées.
              </span>
            </label>

            <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

            <div className="mt-2 flex gap-3">
              <Button type="submit" disabled={envoiEnCours}>
                {envoiEnCours ? 'Envoi en cours...' : 'Signer maintenant'}
              </Button>
              <Button type="button" variant="ghost" onClick={fermer}>
                Annuler
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
