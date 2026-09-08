'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { ChoixOptionsSondage } from '@/components/sondages/ChoixOptionsSondage';
import { Alert, Button, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_SONDAGES_DEFAUT,
  type MessagesValidationSondages,
} from '@/lib/messages-validation';
import {
  type DonneesVoterSondageSansCompte,
  type DonneesVoterSondageSansCompteEntree,
  creerVoterSondageSansCompteSchema,
} from '@/lib/validations/sondages';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libellés surchargeables admin via CMS (convention V2.4.150). */
export interface LibellesVoteSansCompte {
  legendeVote: string;
  legendeIdentite: string;
  hintIdentite: string;
  labelPrenom: string;
  labelNom: string;
  labelEmail: string;
  labelCodePostal: string;
  hintCodePostal: string;
  labelTelephone: string;
  placeholderTelephone: string;
  labelDateNaissance: string;
  hintDateNaissance: string;
  labelNewsletter: string;
  ctaSubmit: string;
  ctaEnCours: string;
  alertErreurTitre: string;
  alertSuccesTitre: string;
  alertSuccesMessage: string;
  alertLienTitre: string;
  alertLienMessage: string;
  alertLienCta: string;
  amorceConnexion: string;
  lienConnexion: string;
  messageCaptchaEnAttente?: string;
}

const LIBELLES_DEFAUT: LibellesVoteSansCompte = {
  legendeVote: 'Ton vote',
  legendeIdentite: 'Qui vote ?',
  hintIdentite:
    'Un sondage n’a de valeur que si chaque personne ne vote qu’une fois. Ces informations créent ton compte au passage : rien d’autre à faire, aucun mot de passe à inventer.',
  labelPrenom: 'Prénom',
  labelNom: 'Nom',
  labelEmail: 'Adresse email',
  labelCodePostal: 'Code postal',
  hintCodePostal: 'Il sert à redresser les résultats par territoire.',
  labelTelephone: 'Téléphone (facultatif)',
  placeholderTelephone: '0612345678',
  labelDateNaissance: 'Date de naissance',
  hintDateNaissance: 'Elle donne ta tranche d’âge, et il faut 15 ans révolus pour voter.',
  labelNewsletter: 'Je veux recevoir la newsletter Maintenant!',
  ctaSubmit: 'Voter',
  ctaEnCours: 'Vote en cours...',
  alertErreurTitre: 'Vote impossible',
  alertSuccesTitre: 'Ton vote est enregistré',
  alertSuccesMessage:
    'Un compte vient d’être créé à ton nom : tu vas recevoir un email pour l’activer et choisir ton mot de passe. Recharge la page pour voir les résultats.',
  alertLienTitre: 'Tu as déjà un compte',
  alertLienMessage: 'Souhaites-tu te connecter ? On te ramène ici pour voter juste après.',
  alertLienCta: 'Me connecter',
  amorceConnexion: 'Tu as déjà un compte ?',
  lienConnexion: 'Se connecter',
  messageCaptchaEnAttente:
    'Vérification anti-robot en cours… le bouton s’activera dès qu’elle est validée.',
};

interface ResultatVoteSansCompte {
  ok: boolean;
  etat?: 'vote' | 'deja_compte';
  message?: string;
}

interface FormulaireVoteSansCompteProps {
  sondageId: string;
  slug: string;
  options: string[];
  optionsImages?: (string | null)[] | null;
  choixMultiple?: boolean;
  voterSondageSansCompte: (donnees: unknown) => Promise<ResultatVoteSansCompte>;
  libelles?: LibellesVoteSansCompte;
  messages?: MessagesValidationSondages;
}

/**
 * Vote d'une personne sans compte (V2.6.141).
 *
 * Décision Lilou/Ben du 08/09/2026 : « il faut de plus permettre le vote
 * aux sondages sans compte ». Le mur de connexion (1 seul vote en deux
 * mois pour 10 680 destinataires) est remplacé par le bulletin ET
 * l'identité sur la même page : on vote, le compte se crée tout seul.
 *
 * L'urne est le composant partagé `ChoixOptionsSondage`, identique au
 * formulaire connecté : mêmes options, aucune présélection.
 */
export function FormulaireVoteSansCompte({
  sondageId,
  slug,
  options,
  optionsImages = null,
  choixMultiple = false,
  voterSondageSansCompte,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_SONDAGES_DEFAUT,
}: FormulaireVoteSansCompteProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [issue, setIssue] = useState<'vote' | 'deja_compte' | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [hydrate, setHydrate] = useState(false);
  const [choisies, setChoisies] = useState<number[]>([]);
  useEffect(() => {
    setHydrate(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonneesVoterSondageSansCompteEntree, unknown, DonneesVoterSondageSansCompte>({
    resolver: zodResolver(creerVoterSondageSansCompteSchema(messages)),
    // Aucune option précochée : un vote « par accident » pour la première
    // option serait inacceptable.
    defaultValues: {
      sondage_id: sondageId,
      prenom: '',
      nom: '',
      email: '',
      code_postal: '',
      telephone: '',
      date_naissance: '',
      genre_declare: '',
      accepte_newsletter: true,
      token_turnstile: '',
    },
  });

  const captchaValide = (watch('token_turnstile') ?? '') !== '';

  function basculerChoix(index: number) {
    const suivant = choisies.includes(index)
      ? choisies.filter((i) => i !== index)
      : [...choisies, index];
    setChoisies(suivant);
    setValue('options_choisies', suivant, { shouldValidate: false });
  }

  async function onSubmit(donnees: DonneesVoterSondageSansCompte) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await voterSondageSansCompte(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message ?? 'Vote impossible.');
      return;
    }
    setIssue(resultat.etat ?? 'vote');
  }

  if (issue === 'vote') {
    return (
      <Alert variant="success" titre={libelles.alertSuccesTitre}>
        {libelles.alertSuccesMessage}
      </Alert>
    );
  }

  // Adresse déjà rattachée à un compte : on ne vote pas sous l'identité de
  // quelqu'un d'autre. On propose la connexion, avec `?prochaine=` qui
  // ramène sur ce sondage une fois connecté·e — pas d'aller-retour par la
  // boîte mail (08/09/2026, Ben : « euh, personne ne va faire ça »).
  if (issue === 'deja_compte') {
    return (
      <Alert variant="info" titre={libelles.alertLienTitre}>
        <p>{libelles.alertLienMessage}</p>
        <Link
          href={`/connexion?prochaine=${encodeURIComponent(`/s-informer/sondages/${slug}`)}`}
          className="mt-3 inline-flex h-11 items-center justify-center rounded-md bg-grad px-5 font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110"
        >
          {libelles.alertLienCta}
        </Link>
      </Alert>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <input type="hidden" {...register('sondage_id')} />
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <ChoixOptionsSondage
        options={options}
        optionsImages={optionsImages}
        choixMultiple={choixMultiple}
        legende={libelles.legendeVote}
        radioProps={register('option_index')}
        choisies={choisies}
        onBasculer={basculerChoix}
        messageErreur={errors.option_index?.message}
      />

      <fieldset className="grid gap-4 rounded-md border border-border bg-surface-2 p-4">
        <legend className="px-1 font-body text-sm font-medium text-text-2">
          {libelles.legendeIdentite}
        </legend>
        <p className="text-xs text-text-3">{libelles.hintIdentite}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="vote-prenom" obligatoire>
              {libelles.labelPrenom}
            </Label>
            <Input
              id="vote-prenom"
              autoComplete="given-name"
              aria-invalid={errors.prenom !== undefined ? true : undefined}
              aria-describedby={errors.prenom !== undefined ? 'vote-prenom-erreur' : undefined}
              {...register('prenom')}
            />
            {errors.prenom !== undefined ? (
              <p id="vote-prenom-erreur" className="mt-1 text-xs text-danger">
                {errors.prenom.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="vote-nom" obligatoire>
              {libelles.labelNom}
            </Label>
            <Input
              id="vote-nom"
              autoComplete="family-name"
              aria-invalid={errors.nom !== undefined ? true : undefined}
              aria-describedby={errors.nom !== undefined ? 'vote-nom-erreur' : undefined}
              {...register('nom')}
            />
            {errors.nom !== undefined ? (
              <p id="vote-nom-erreur" className="mt-1 text-xs text-danger">
                {errors.nom.message}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <Label htmlFor="vote-email" obligatoire>
            {libelles.labelEmail}
          </Label>
          <Input
            id="vote-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email !== undefined ? true : undefined}
            aria-describedby={errors.email !== undefined ? 'vote-email-erreur' : undefined}
            {...register('email')}
          />
          {errors.email !== undefined ? (
            <p id="vote-email-erreur" className="mt-1 text-xs text-danger">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="vote-code-postal" obligatoire>
              {libelles.labelCodePostal}
            </Label>
            <Input
              id="vote-code-postal"
              inputMode="numeric"
              autoComplete="postal-code"
              aria-invalid={errors.code_postal !== undefined ? true : undefined}
              aria-describedby={
                errors.code_postal !== undefined
                  ? 'vote-code-postal-erreur'
                  : 'vote-code-postal-aide'
              }
              {...register('code_postal')}
            />
            {errors.code_postal !== undefined ? (
              <p id="vote-code-postal-erreur" className="mt-1 text-xs text-danger">
                {errors.code_postal.message}
              </p>
            ) : (
              <p id="vote-code-postal-aide" className="mt-1 text-xs text-text-3">
                {libelles.hintCodePostal}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="vote-telephone">{libelles.labelTelephone}</Label>
            <Input
              id="vote-telephone"
              type="tel"
              autoComplete="tel"
              placeholder={libelles.placeholderTelephone}
              aria-invalid={errors.telephone !== undefined ? true : undefined}
              aria-describedby={
                errors.telephone !== undefined ? 'vote-telephone-erreur' : undefined
              }
              {...register('telephone')}
            />
            {errors.telephone !== undefined ? (
              <p id="vote-telephone-erreur" className="mt-1 text-xs text-danger">
                {errors.telephone.message}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <Label htmlFor="vote-date-naissance" obligatoire>
            {libelles.labelDateNaissance}
          </Label>
          <Input
            id="vote-date-naissance"
            type="date"
            autoComplete="bday"
            aria-invalid={errors.date_naissance !== undefined ? true : undefined}
            aria-describedby={
              errors.date_naissance !== undefined
                ? 'vote-date-naissance-erreur'
                : 'vote-date-naissance-aide'
            }
            {...register('date_naissance')}
          />
          {errors.date_naissance !== undefined ? (
            <p id="vote-date-naissance-erreur" className="mt-1 text-xs text-danger">
              {errors.date_naissance.message}
            </p>
          ) : (
            <p id="vote-date-naissance-aide" className="mt-1 text-xs text-text-3">
              {libelles.hintDateNaissance}
            </p>
          )}
        </div>

        <label
          htmlFor="vote-newsletter"
          className="flex cursor-pointer items-start gap-2 text-sm text-text-2"
        >
          <input
            id="vote-newsletter"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded-xs accent-brand"
            {...register('accepte_newsletter')}
          />
          <span>{libelles.labelNewsletter}</span>
        </label>
      </fieldset>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      {hydrate && !captchaValide ? (
        <p className="text-xs text-text-3" aria-live="polite">
          {libelles.messageCaptchaEnAttente ?? LIBELLES_DEFAUT.messageCaptchaEnAttente}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={
          envoiEnCours || !hydrate || !captchaValide || (choixMultiple && choisies.length === 0)
        }
      >
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>

      <p className="text-sm text-text-2">
        {libelles.amorceConnexion}{' '}
        <Link
          href={`/connexion?prochaine=/s-informer/sondages/${slug}`}
          className="text-brand underline-offset-4 hover:underline"
        >
          {libelles.lienConnexion}
        </Link>
      </p>
    </form>
  );
}
