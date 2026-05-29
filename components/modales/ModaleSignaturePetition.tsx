'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, IconButton, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_PETITION_DEFAUT,
  type MessagesValidationPetition,
} from '@/lib/messages-validation';
import { type DonneesSignerPetition, creerSignerPetitionSchema } from '@/lib/validations/petition';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.141). */
export interface LibellesSignaturePetition {
  ariaOuvrir: string;
  ctaDeclencheur: string;
  ariaFermer: string;
  ariaModale: string;
  surtitre: string;
  alertErreurTitre: string;
  merciTitre: string;
  merciMessage: string;
  merciFermer: string;
  labelPrenom: string;
  labelNom: string;
  labelEmail: string;
  labelCodePostal: string;
  labelTelephone: string;
  labelNewsletter: string;
  labelContactCreatricePrefixe: string;
  labelContactCreatriceSuffixe: string;
  ctaSubmit: string;
  ctaEnCours: string;
  ctaAnnuler: string;
  /** V2.5.6 Phase E — tunnel post-signature. */
  tunnelTitre: string;
  tunnelIntro: string;
  tunnelCtaAdherer: string;
  tunnelCtaCommune: string;
  /** V2.5.19 Phase E.bis — bouton unique vers la page intermédiaire de bienvenue. */
  tunnelCtaDecouvrir: string;
}

const LIBELLES_DEFAUT: LibellesSignaturePetition = {
  ariaOuvrir: 'Ouvrir la modale de signature de :',
  ctaDeclencheur: 'Signer la pétition',
  ariaFermer: 'Fermer la modale',
  ariaModale: 'Signer la pétition :',
  surtitre: 'Signer la pétition',
  alertErreurTitre: 'Signature impossible',
  merciTitre: 'Merci pour ta signature.',
  merciMessage: 'Ton signal est enregistré. Tu vas recevoir un email pour confirmer.',
  merciFermer: 'Fermer',
  labelPrenom: 'Prénom',
  labelNom: 'Nom',
  labelEmail: 'Email',
  labelCodePostal: 'Code postal',
  labelTelephone: 'Téléphone (optionnel)',
  labelNewsletter: 'Je veux recevoir la newsletter Maintenant! (mardi récap + vendredi édito).',
  labelContactCreatricePrefixe: "J'autorise",
  labelContactCreatriceSuffixe:
    '(qui a créé cette pétition) à me contacter par email pour des actualités liées.',
  ctaSubmit: 'Signer maintenant',
  ctaEnCours: 'Envoi en cours...',
  ctaAnnuler: 'Annuler',
  tunnelTitre: 'Aller plus loin avec Maintenant!',
  tunnelIntro:
    "Tu viens de t'engager. Si tu veux peser davantage, deux portes simples s'ouvrent à toi :",
  tunnelCtaAdherer: 'Devenir adhérent·e',
  tunnelCtaCommune: 'Rejoindre une commune libre',
  tunnelCtaDecouvrir: 'Découvrir les prochaines étapes',
};

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
  /** Libelles surchargeables admin via CMS. */
  libelles?: LibellesSignaturePetition;
  /** Messages de validation Zod surchargeables admin via CMS. */
  messages?: MessagesValidationPetition;
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
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_PETITION_DEFAUT,
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
    resolver: zodResolver(creerSignerPetitionSchema(messages)),
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
    // Bloquer le scroll de fond DÈS l'ouverture. `<dialog>` n'émet pas
    // d'événement `show` (seulement `close`/`cancel`), donc on le fait ici
    // directement plutôt que via un listener qui ne se déclencherait jamais.
    document.body.style.overflow = 'hidden';
  }

  function fermer() {
    refDialog.current?.close();
  }

  // Restaurer le scroll quand la modale se ferme (clic backdrop, Escape,
  // bouton fermer : tous déclenchent l'événement natif `close`).
  useEffect(() => {
    const dialog = refDialog.current;
    if (dialog === null) return;
    function rendreScroll() {
      document.body.style.overflow = '';
    }
    dialog.addEventListener('close', rendreScroll);
    return () => {
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
          aria-label={`${libelles.ariaOuvrir} ${petitionTitre}`}
        >
          {declencheur}
        </button>
      ) : (
        <Button onClick={ouvrir}>{libelles.ctaDeclencheur}</Button>
      )}

      <dialog
        ref={refDialog}
        className="m-auto w-full max-w-lg rounded-lg border border-border bg-surface p-0 shadow-lg backdrop:bg-black/40"
        aria-label={`${libelles.ariaModale} ${petitionTitre}`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-cap text-text-3">
              {libelles.surtitre}
            </p>
            <p className="mt-1 font-bold text-text-1">{petitionTitre}</p>
          </div>
          <IconButton aria-label={libelles.ariaFermer} onClick={fermer} taille="sm">
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </header>

        {merci ? (
          <div className="grid gap-5 p-6 text-center" aria-live="polite" aria-atomic="true">
            <p className="font-display text-2xl font-bold text-text-1">{libelles.merciTitre}</p>
            <p className="text-text-2">{libelles.merciMessage}</p>

            {/* V2.5.6 Phase E : tunnel d'engagement après signature.
                V2.5.19 — un seul CTA vers la page intermédiaire de bienvenue
                qui contextualise « tu viens de signer » et propose les 2
                portes (adhérer + commune). Mieux qu'un choix forcé au
                milieu de la modale. */}
            <div className="mt-2 grid gap-3 rounded-md border border-border bg-surface-2 p-4 text-left">
              <p className="font-display text-base font-bold text-text-1">{libelles.tunnelTitre}</p>
              <p className="text-sm text-text-2">{libelles.tunnelIntro}</p>
              <a
                href="/agir/depuis-petition"
                className="inline-flex h-11 items-center justify-center rounded-md bg-grad px-5 font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110"
              >
                {libelles.tunnelCtaDecouvrir} <span aria-hidden="true">→</span>
              </a>
            </div>

            <Button onClick={fermer} variant="ghost">
              {libelles.merciFermer}
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-3 p-6">
            {erreur !== null ? (
              <Alert variant="danger" titre={libelles.alertErreurTitre}>
                {erreur}
              </Alert>
            ) : null}

            <input type="hidden" {...register('petition_id')} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="sig-prenom" obligatoire>
                  {libelles.labelPrenom}
                </Label>
                <Input
                  id="sig-prenom"
                  autoComplete="given-name"
                  aria-invalid={errors.prenom !== undefined ? true : undefined}
                  aria-describedby={errors.prenom !== undefined ? 'sig-prenom-erreur' : undefined}
                  {...register('prenom')}
                />
                {errors.prenom !== undefined ? (
                  <p id="sig-prenom-erreur" className="mt-1 text-xs text-danger">
                    {errors.prenom.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="sig-nom" obligatoire>
                  {libelles.labelNom}
                </Label>
                <Input
                  id="sig-nom"
                  autoComplete="family-name"
                  aria-invalid={errors.nom !== undefined ? true : undefined}
                  aria-describedby={errors.nom !== undefined ? 'sig-nom-erreur' : undefined}
                  {...register('nom')}
                />
                {errors.nom !== undefined ? (
                  <p id="sig-nom-erreur" className="mt-1 text-xs text-danger">
                    {errors.nom.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <Label htmlFor="sig-email" obligatoire>
                {libelles.labelEmail}
              </Label>
              <Input
                id="sig-email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email !== undefined ? true : undefined}
                aria-describedby={errors.email !== undefined ? 'sig-email-erreur' : undefined}
                {...register('email')}
              />
              {errors.email !== undefined ? (
                <p id="sig-email-erreur" className="mt-1 text-xs text-danger">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="sig-cp" obligatoire>
                  {libelles.labelCodePostal}
                </Label>
                <Input
                  id="sig-cp"
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="postal-code"
                  aria-invalid={errors.code_postal !== undefined ? true : undefined}
                  aria-describedby={errors.code_postal !== undefined ? 'sig-cp-erreur' : undefined}
                  {...register('code_postal')}
                />
                {errors.code_postal !== undefined ? (
                  <p id="sig-cp-erreur" className="mt-1 text-xs text-danger">
                    {errors.code_postal.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="sig-tel">{libelles.labelTelephone}</Label>
                <Input
                  id="sig-tel"
                  type="tel"
                  autoComplete="tel"
                  aria-invalid={errors.telephone !== undefined ? true : undefined}
                  aria-describedby={errors.telephone !== undefined ? 'sig-tel-erreur' : undefined}
                  {...register('telephone')}
                />
                {errors.telephone !== undefined ? (
                  <p id="sig-tel-erreur" className="mt-1 text-xs text-danger">
                    {errors.telephone.message}
                  </p>
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
              <span>{libelles.labelNewsletter}</span>
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
                {libelles.labelContactCreatricePrefixe} <strong>{createuricePrenom}</strong>{' '}
                {libelles.labelContactCreatriceSuffixe}
              </span>
            </label>

            <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

            <div className="mt-2 flex gap-3">
              <Button type="submit" disabled={envoiEnCours}>
                {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
              </Button>
              <Button type="button" variant="ghost" onClick={fermer}>
                {libelles.ctaAnnuler}
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
