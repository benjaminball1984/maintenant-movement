'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, IconButton, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_PETITION_DEFAUT,
  type MessagesValidationPetition,
} from '@/lib/messages-validation';
import { cn } from '@/lib/utils';
import {
  CATEGORIES_ORGANISATION,
  type DonneesSignerPetition,
  LIBELLES_CATEGORIE_ORGANISATION,
  creerSignerPetitionSchema,
} from '@/lib/validations/petition';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  messageCaptchaEnAttente?: string;
  /** V2.6.134 : variantes de libelles quand le texte signe est un appel. */
  surtitreAppel: string;
  ctaDeclencheurAppel: string;
  ariaOuvrirAppel: string;
  ariaModaleAppel: string;
  /** V2.6.134 : signature au nom d'une organisation. */
  choixTypeLegende: string;
  choixTypeIndividu: string;
  choixTypeOrganisation: string;
  introOrganisation: string;
  labelOrganisationNom: string;
  labelOrganisationCategorie: string;
  optionCategorieVide: string;
  labelOrganisationTerritoire: string;
  labelSignataireFonction: string;
  labelOrganisationAffichagePublic: string;
  ctaSubmitOrganisation: string;
  merciTitreOrganisation: string;
  merciMessageOrganisation: string;
  /** V2.5.6 Phase E : tunnel post-signature. */
  tunnelTitre: string;
  tunnelIntro: string;
  tunnelCtaAdherer: string;
  tunnelCtaCommune: string;
  /** V2.5.19 Phase E.bis : bouton unique vers la page intermédiaire de bienvenue. */
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
  labelNewsletter: 'Je veux recevoir la newsletter Maintenant!',
  // Demande Ben du 16/08/2026 : ne plus nommer la personne qui a créé la
  // pétition. Le prénom seul (« J'autorise Benjamin ») ne dit rien à qui
  // signe — il peut même inquiéter : qui est ce Benjamin, et pourquoi
  // aurait-il mon adresse ? La fonction est plus claire que le prénom.
  labelContactCreatricePrefixe: "J'autorise",
  labelContactCreatriceSuffixe:
    'le créateur ou la créatrice de la pétition à me contacter par email pour des actualités liées.',
  ctaSubmit: 'Signer maintenant',
  ctaEnCours: 'Envoi en cours...',
  ctaAnnuler: 'Annuler',
  messageCaptchaEnAttente:
    'Vérification anti-robot en cours… le bouton s’activera dès qu’elle est validée.',
  surtitreAppel: 'Signer l’appel',
  ctaDeclencheurAppel: 'Signer l’appel',
  ariaOuvrirAppel: 'Ouvrir la fenêtre de signature de l’appel :',
  ariaModaleAppel: 'Signer l’appel :',
  choixTypeLegende: 'Je signe',
  choixTypeIndividu: 'En mon nom',
  choixTypeOrganisation: 'Au nom d’une organisation',
  introOrganisation:
    'Assemblée, collectif, syndicat ou organisation : indique son nom. Tes coordonnées restent celles de la personne qui signe pour elle — elles ne sont jamais affichées.',
  labelOrganisationNom: 'Nom de l’organisation',
  labelOrganisationCategorie: 'Type',
  optionCategorieVide: 'Choisir…',
  labelOrganisationTerritoire: 'Territoire (ville, département, national…) — optionnel',
  labelSignataireFonction: 'Ta fonction dans l’organisation (optionnel)',
  labelOrganisationAffichagePublic:
    'J’accepte que le nom de l’organisation figure dans la liste publique des signataires.',
  ctaSubmitOrganisation: 'Signer au nom de l’organisation',
  merciTitreOrganisation: 'Merci, la signature de l’organisation est enregistrée.',
  merciMessageOrganisation:
    'Son nom rejoint la liste des organisations signataires. Tu vas recevoir un email de confirmation.',
  tunnelTitre: 'Aller plus loin',
  tunnelIntro:
    "Tu viens de t'engager. Pour peser davantage, tu peux adhérer au mouvement — gratuitement, ou en le soutenant.",
  tunnelCtaAdherer: 'Adhérer au mouvement',
  tunnelCtaCommune: 'Rejoindre une commune libre',
  tunnelCtaDecouvrir: 'Découvrir les prochaines étapes',
};

/**
 * Valeurs neutres des champs « organisation ». Extraites ici pour que
 * `defaultValues` et le `reset()` d'ouverture partent exactement du même
 * état : une modale rouverte ne doit jamais garder le nom d'organisation
 * saisi lors d'un essai précédent.
 */
const VALEURS_ORGANISATION_VIDES = {
  type_signataire: 'individu',
  organisation_nom: '',
  organisation_categorie: '',
  organisation_territoire: '',
  signataire_fonction: '',
  organisation_affichage_public: true,
} as const;

/**
 * Préremplissage des champs identité pour les personnes connectées : le
 * site connaît déjà leur prénom/nom/email, inutile de les faire retaper
 * (revue bêta 2026-06-11). Tous les champs restent éditables.
 */
export interface PrefilSignature {
  prenom?: string;
  nom?: string;
  email?: string;
  code_postal?: string;
}

interface ModaleSignaturePetitionProps {
  /** ID UUID de la pétition à signer. */
  petitionId: string;
  /** Titre de la pétition (affiché dans le header de la modale). */
  petitionTitre: string;
  /**
   * @deprecated Depuis le 16/08/2026, la case d'autorisation ne nomme plus
   * personne : elle parle du « créateur ou de la créatrice de la pétition »
   * (demande Ben). Ce prop n'est plus affiché. Il reste accepté pour ne pas
   * casser les appelants, et pourra disparaître quand ils seront nettoyés.
   */
  createuricePrenom?: string;
  /** Server Action à appeler pour la signature. */
  signerPetition: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Élément déclencheur du dialog (par défaut un Button gradient). */
  declencheur?: React.ReactNode;
  /** Libelles surchargeables admin via CMS. */
  libelles?: LibellesSignaturePetition;
  /** Messages de validation Zod surchargeables admin via CMS. */
  messages?: MessagesValidationPetition;
  /** Préremplissage des champs pour les personnes connectées (optionnel). */
  prefil?: PrefilSignature;
  /**
   * V2.6.134 — propose le choix « en mon nom / au nom d'une organisation ».
   * Vrai par défaut : une assemblée, un collectif, un syndicat peuvent
   * co-signer n'importe quel texte du site. Passer `false` referme la
   * signature aux seules personnes physiques.
   */
  autoriseOrganisation?: boolean;
  /**
   * V2.6.134 — le texte signe est un appel : le surtitre et le bouton par
   * defaut disent « Signer l'appel » plutot que « Signer la petition ».
   */
  estAppel?: boolean;
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
  signerPetition,
  declencheur,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_PETITION_DEFAUT,
  prefil,
  autoriseOrganisation = true,
  estAppel = false,
}: ModaleSignaturePetitionProps) {
  // Un appel se signe, il ne s'adresse pas : les deux libelles visibles
  // hors modale changent de mot.
  const surtitreAffiche = estAppel ? libelles.surtitreAppel : libelles.surtitre;
  const ctaDeclencheurAffiche = estAppel ? libelles.ctaDeclencheurAppel : libelles.ctaDeclencheur;
  const ariaOuvrirAffiche = estAppel ? libelles.ariaOuvrirAppel : libelles.ariaOuvrir;
  const ariaModaleAffiche = estAppel ? libelles.ariaModaleAppel : libelles.ariaModale;
  const refDialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [merci, setMerci] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [hydrate, setHydrate] = useState(false);
  useEffect(() => {
    setHydrate(true);
  }, []);

  // Dernier jeton Turnstile reçu du widget. Le widget vit dans le DOM dès le
  // chargement de la page (le <dialog> existe avant son ouverture) : il se
  // valide donc souvent AVANT le premier `ouvrir()`. Sans cette ref, le
  // `reset()` d'ouverture effaçait le jeton déjà livré, et comme le widget ne
  // rappelle pas son callback, le bouton restait bloqué pour toujours
  // (bug bloquant constaté en prod le 2026-06-11 : signature impossible).
  const tokenTurnstileRef = useRef('');

  // Valeurs par défaut des champs identité : préremplies depuis la session
  // quand la personne est connectée, vides sinon.
  const valeursIdentite = {
    prenom: prefil?.prenom ?? '',
    nom: prefil?.nom ?? '',
    email: prefil?.email ?? '',
    code_postal: prefil?.code_postal ?? '',
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DonneesSignerPetition>({
    resolver: zodResolver(creerSignerPetitionSchema(messages)),
    defaultValues: {
      petition_id: petitionId,
      ...valeursIdentite,
      accepte_newsletter: false,
      accepte_contact_createurice: false,
      ...VALEURS_ORGANISATION_VIDES,
      token_turnstile: '',
    },
  });

  // Le formulaire change de visage selon ce choix : on l'observe pour
  // n'afficher les champs d'organisation que quand ils servent.
  const typeSignataire = watch('type_signataire');
  const signeAuNomDUneOrganisation = autoriseOrganisation && typeSignataire === 'organisation';

  // La vérification anti-robot fournit son jeton de façon asynchrone. Tant
  // qu'il n'est pas là, le bouton reste bloqué (évite le clic « dans le vide »
  // qui échouait silencieusement) et un message explique l'attente.
  const captchaValide = (watch('token_turnstile') ?? '') !== '';

  function ouvrir() {
    setMerci(false);
    setErreur(null);
    reset({
      petition_id: petitionId,
      ...valeursIdentite,
      accepte_newsletter: false,
      accepte_contact_createurice: false,
      ...VALEURS_ORGANISATION_VIDES,
      // On PRÉSERVE le jeton anti-robot courant : le widget ne re-émet pas
      // son callback après coup, l'effacer ici condamnerait le bouton.
      // S'il expire, le widget se relance et nous renvoie un jeton frais
      // (cf. CaptchaTurnstile, expired-callback).
      token_turnstile: tokenTurnstileRef.current,
    });
    refDialog.current?.showModal();
    // Bloquer le scroll de fond DÈS l'ouverture. `<dialog>` n'émet pas
    // d'événement `show` (seulement `close`/`cancel`), donc on le fait ici
    // directement plutôt que via un listener qui ne se déclencherait jamais.
    document.body.style.overflow = 'hidden';
  }

  function fermer() {
    refDialog.current?.close();
    // Le compteur de signatures est rafraîchi ICI, et non dans la Server
    // Action (cf. le commentaire dans `signerPetition`) : rafraîchir la
    // route pendant que la fenêtre est ouverte la referme aussitôt, et le
    // tunnel d'adhésion disparaissait avant d'avoir été lu. On ne rafraîchit
    // qu'après une signature réussie — inutile si la personne renonce.
    if (merci) {
      router.refresh();
    }
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
          aria-label={`${ariaOuvrirAffiche} ${petitionTitre}`}
        >
          {declencheur}
        </button>
      ) : (
        <Button onClick={ouvrir}>{ctaDeclencheurAffiche}</Button>
      )}

      <dialog
        ref={refDialog}
        className="m-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface p-0 shadow-lg backdrop:bg-black/40"
        aria-label={`${ariaModaleAffiche} ${petitionTitre}`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-cap text-text-3">
              {surtitreAffiche}
            </p>
            <p className="mt-1 font-bold text-text-1">{petitionTitre}</p>
          </div>
          <IconButton aria-label={libelles.ariaFermer} onClick={fermer} taille="sm">
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </header>

        {merci ? (
          <div className="grid gap-5 p-6 text-center" aria-live="polite" aria-atomic="true">
            <p className="font-display text-2xl font-bold text-text-1">
              {signeAuNomDUneOrganisation ? libelles.merciTitreOrganisation : libelles.merciTitre}
            </p>
            <p className="text-text-2">
              {signeAuNomDUneOrganisation
                ? libelles.merciMessageOrganisation
                : libelles.merciMessage}
            </p>

            {/* Tunnel d'engagement après signature.
                01/08/2026 — le CTA pointait vers `/agir/depuis-petition`,
                une page intermédiaire qui proposait deux portes (adhérer
                + rejoindre une commune libre). Les communes libres étant
                en sommeil, cette page l'est aussi : on envoie désormais
                droit sur l'adhésion, comme décidé par Lilou/Ben (« merci
                + adhésion seulement »). */}
            <div className="mt-2 grid gap-3 rounded-md border border-border bg-surface-2 p-4 text-left">
              <p className="font-display text-base font-bold text-text-1">{libelles.tunnelTitre}</p>
              <p className="text-sm text-text-2">{libelles.tunnelIntro}</p>
              <a
                href="/agir/adherer"
                className="inline-flex h-11 items-center justify-center rounded-md bg-grad px-5 font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110"
              >
                {libelles.tunnelCtaAdherer}
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

            {/* V2.6.134 — « je signe en mon nom » ou « au nom d'une
                organisation ». Deux boutons radio stylés en onglets : le
                choix doit être visible d'emblée, pas caché dans un menu. */}
            {autoriseOrganisation ? (
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-xs font-bold uppercase tracking-cap text-text-3">
                  {libelles.choixTypeLegende}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['individu', libelles.choixTypeIndividu],
                      ['organisation', libelles.choixTypeOrganisation],
                    ] as const
                  ).map(([valeur, libelle]) => (
                    <label
                      key={valeur}
                      htmlFor={`sig-type-${valeur}`}
                      className={cn(
                        'flex cursor-pointer items-center justify-center rounded-md border px-3 py-2.5',
                        'text-center text-sm font-bold transition',
                        typeSignataire === valeur
                          ? 'border-brand bg-surface-2 text-text-1'
                          : 'border-border text-text-3 hover:text-text-2',
                      )}
                    >
                      <input
                        id={`sig-type-${valeur}`}
                        type="radio"
                        value={valeur}
                        className="sr-only"
                        {...register('type_signataire')}
                      />
                      {libelle}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {signeAuNomDUneOrganisation ? (
              <div className="grid gap-3 rounded-md border border-border bg-surface-2 p-4">
                <p className="text-sm text-text-2">{libelles.introOrganisation}</p>

                <div>
                  <Label htmlFor="sig-org-nom" obligatoire>
                    {libelles.labelOrganisationNom}
                  </Label>
                  <Input
                    id="sig-org-nom"
                    autoComplete="organization"
                    aria-invalid={errors.organisation_nom !== undefined ? true : undefined}
                    aria-describedby={
                      errors.organisation_nom !== undefined ? 'sig-org-nom-erreur' : undefined
                    }
                    {...register('organisation_nom')}
                  />
                  {errors.organisation_nom !== undefined ? (
                    <p id="sig-org-nom-erreur" className="mt-1 text-xs text-danger">
                      {errors.organisation_nom.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="sig-org-categorie" obligatoire>
                      {libelles.labelOrganisationCategorie}
                    </Label>
                    <select
                      id="sig-org-categorie"
                      className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-1"
                      aria-invalid={errors.organisation_categorie !== undefined ? true : undefined}
                      aria-describedby={
                        errors.organisation_categorie !== undefined
                          ? 'sig-org-categorie-erreur'
                          : undefined
                      }
                      {...register('organisation_categorie')}
                    >
                      <option value="">{libelles.optionCategorieVide}</option>
                      {CATEGORIES_ORGANISATION.map((categorie) => (
                        <option key={categorie} value={categorie}>
                          {LIBELLES_CATEGORIE_ORGANISATION[categorie]}
                        </option>
                      ))}
                    </select>
                    {errors.organisation_categorie !== undefined ? (
                      <p id="sig-org-categorie-erreur" className="mt-1 text-xs text-danger">
                        {errors.organisation_categorie.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="sig-org-territoire">
                      {libelles.labelOrganisationTerritoire}
                    </Label>
                    <Input id="sig-org-territoire" {...register('organisation_territoire')} />
                    {errors.organisation_territoire !== undefined ? (
                      <p className="mt-1 text-xs text-danger">
                        {errors.organisation_territoire.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <Label htmlFor="sig-org-fonction">{libelles.labelSignataireFonction}</Label>
                  <Input id="sig-org-fonction" {...register('signataire_fonction')} />
                  {errors.signataire_fonction !== undefined ? (
                    <p className="mt-1 text-xs text-danger">{errors.signataire_fonction.message}</p>
                  ) : null}
                </div>

                <label
                  htmlFor="sig-org-public"
                  className="flex cursor-pointer items-start gap-2 text-sm text-text-2"
                >
                  <input
                    id="sig-org-public"
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded-xs accent-brand"
                    {...register('organisation_affichage_public')}
                  />
                  <span>{libelles.labelOrganisationAffichagePublic}</span>
                </label>
              </div>
            ) : null}

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
                {libelles.labelContactCreatricePrefixe}{' '}
                <strong>{libelles.labelContactCreatriceSuffixe}</strong>
              </span>
            </label>

            <CaptchaTurnstile
              onChange={(token) => {
                tokenTurnstileRef.current = token;
                setValue('token_turnstile', token, { shouldValidate: true });
              }}
              onExpire={() => {
                tokenTurnstileRef.current = '';
                setValue('token_turnstile', '', { shouldValidate: true });
              }}
            />

            {hydrate && !captchaValide ? (
              <p className="text-xs text-text-3" aria-live="polite">
                {libelles.messageCaptchaEnAttente ?? LIBELLES_DEFAUT.messageCaptchaEnAttente}
              </p>
            ) : null}

            <div className="mt-2 flex gap-3">
              <Button type="submit" disabled={envoiEnCours || !hydrate || !captchaValide}>
                {envoiEnCours
                  ? libelles.ctaEnCours
                  : signeAuNomDUneOrganisation
                    ? libelles.ctaSubmitOrganisation
                    : libelles.ctaSubmit}
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
