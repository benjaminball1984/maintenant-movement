'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_ADHESION_DEFAUT,
  type MessagesValidationAdhesion,
} from '@/lib/messages-validation';
import {
  type DonneesAdhererSansCompte,
  creerAdhererSansCompteSchema,
} from '@/lib/validations/adhesion';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libellés surchargeables admin via CMS (convention V2.4.144). */
export interface LibellesAdhesionSansCompte {
  labelPrenom: string;
  labelNom: string;
  labelEmail: string;
  hintEmail: string;
  labelCodePostal: string;
  hintCodePostal: string;
  labelTelephone: string;
  hintTelephone: string;
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

const LIBELLES_DEFAUT: LibellesAdhesionSansCompte = {
  labelPrenom: 'Prénom',
  labelNom: 'Nom',
  labelEmail: 'Adresse email',
  hintEmail: 'Elle sert à créer ton compte et à te prévenir avant l’échéance de ton adhésion.',
  labelCodePostal: 'Code postal',
  hintCodePostal: 'Il rattache ton adhésion à ton territoire.',
  labelTelephone: 'Téléphone',
  hintTelephone: 'Il permet au mouvement de te joindre directement.',
  placeholderTelephone: '0612345678',
  labelDateNaissance: 'Date de naissance',
  hintDateNaissance: 'Il faut avoir 15 ans révolus pour adhérer.',
  labelNewsletter: 'Je veux recevoir la newsletter Maintenant!',
  ctaSubmit: 'Adhérer',
  ctaEnCours: 'Adhésion en cours...',
  alertErreurTitre: 'Adhésion impossible',
  alertSuccesTitre: 'Bienvenue dans Maintenant!',
  alertSuccesMessage:
    'Ton adhésion gratuite est active pour 365 jours. Un compte vient d’être créé à ton nom : tu vas recevoir un email pour l’activer et choisir ton mot de passe.',
  alertLienTitre: 'Tu as déjà un compte',
  alertLienMessage: 'Souhaites-tu te connecter ? On te ramène ici pour adhérer juste après.',
  alertLienCta: 'Me connecter',
  amorceConnexion: 'Tu as déjà un compte ?',
  lienConnexion: 'Se connecter',
  messageCaptchaEnAttente:
    'Vérification anti-robot en cours… le bouton s’activera dès qu’elle est validée.',
};

interface ResultatSansCompte {
  ok: boolean;
  etat?: 'adheree' | 'deja_compte';
  message?: string;
}

interface FormulaireAdhesionSansCompteProps {
  adhererSansCompte: (donnees: unknown) => Promise<ResultatSansCompte>;
  libelles?: LibellesAdhesionSansCompte;
  messages?: MessagesValidationAdhesion;
}

/**
 * Formulaire d'adhésion pour une personne SANS COMPTE (V2.6.141).
 *
 * Décision Lilou/Ben du 08/09/2026 : on adhère d'un seul geste, le compte
 * se crée tout seul. Aucun mot de passe n'est demandé ici — la personne
 * prend possession de son compte par l'email qu'elle reçoit ensuite.
 *
 * Deux issues possibles au succès, cf. `IssueAdhesionSansCompte` côté
 * Server Action : l'adhésion est enregistrée, ou bien l'email avait déjà
 * un compte et un lien de connexion vient de partir.
 */
export function FormulaireAdhesionSansCompte({
  adhererSansCompte,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_ADHESION_DEFAUT,
}: FormulaireAdhesionSansCompteProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [issue, setIssue] = useState<'adheree' | 'deja_compte' | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [hydrate, setHydrate] = useState(false);
  useEffect(() => {
    setHydrate(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonneesAdhererSansCompte>({
    resolver: zodResolver(creerAdhererSansCompteSchema(messages)),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      code_postal: '',
      telephone: '',
      date_naissance: '',
      accepte_newsletter: true,
      token_turnstile: '',
    },
  });

  // Même garde-fou que sur les 29 autres formulaires (V2.6.80) : tant que
  // le jeton anti-robot n'est pas là, le bouton reste bloqué et un message
  // explique l'attente, au lieu d'un clic qui échoue en silence.
  const captchaValide = (watch('token_turnstile') ?? '') !== '';

  async function onSubmit(donnees: DonneesAdhererSansCompte) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await adhererSansCompte(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message ?? 'Adhésion impossible.');
      return;
    }
    setIssue(resultat.etat ?? 'adheree');
  }

  if (issue === 'adheree') {
    return (
      <Alert variant="success" titre={libelles.alertSuccesTitre}>
        {libelles.alertSuccesMessage}
      </Alert>
    );
  }

  // Adresse déjà rattachée à un compte : on n'adhère pas sous l'identité
  // de quelqu'un d'autre. On propose la connexion, avec `?prochaine=` qui
  // ramène ici une fois connecté·e (08/09/2026).
  if (issue === 'deja_compte') {
    return (
      <Alert variant="info" titre={libelles.alertLienTitre}>
        <p>{libelles.alertLienMessage}</p>
        <Link
          href={`/connexion?prochaine=${encodeURIComponent('/agir/adherer/gratuit')}`}
          className="mt-3 inline-flex h-11 items-center justify-center rounded-md bg-grad px-5 font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110"
        >
          {libelles.alertLienCta}
        </Link>
      </Alert>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="adh-prenom" obligatoire>
            {libelles.labelPrenom}
          </Label>
          <Input
            id="adh-prenom"
            autoComplete="given-name"
            aria-invalid={errors.prenom !== undefined ? true : undefined}
            aria-describedby={errors.prenom !== undefined ? 'adh-prenom-erreur' : undefined}
            {...register('prenom')}
          />
          {errors.prenom !== undefined ? (
            <p id="adh-prenom-erreur" className="mt-1 text-xs text-danger">
              {errors.prenom.message}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="adh-nom" obligatoire>
            {libelles.labelNom}
          </Label>
          <Input
            id="adh-nom"
            autoComplete="family-name"
            aria-invalid={errors.nom !== undefined ? true : undefined}
            aria-describedby={errors.nom !== undefined ? 'adh-nom-erreur' : undefined}
            {...register('nom')}
          />
          {errors.nom !== undefined ? (
            <p id="adh-nom-erreur" className="mt-1 text-xs text-danger">
              {errors.nom.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <Label htmlFor="adh-email" obligatoire>
          {libelles.labelEmail}
        </Label>
        <Input
          id="adh-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email !== undefined ? true : undefined}
          aria-describedby={errors.email !== undefined ? 'adh-email-erreur' : 'adh-email-aide'}
          {...register('email')}
        />
        {errors.email !== undefined ? (
          <p id="adh-email-erreur" className="mt-1 text-xs text-danger">
            {errors.email.message}
          </p>
        ) : (
          <p id="adh-email-aide" className="mt-1 text-xs text-text-3">
            {libelles.hintEmail}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="adh-code-postal" obligatoire>
            {libelles.labelCodePostal}
          </Label>
          <Input
            id="adh-code-postal"
            inputMode="numeric"
            autoComplete="postal-code"
            aria-invalid={errors.code_postal !== undefined ? true : undefined}
            aria-describedby={
              errors.code_postal !== undefined ? 'adh-code-postal-erreur' : 'adh-code-postal-aide'
            }
            {...register('code_postal')}
          />
          {errors.code_postal !== undefined ? (
            <p id="adh-code-postal-erreur" className="mt-1 text-xs text-danger">
              {errors.code_postal.message}
            </p>
          ) : (
            <p id="adh-code-postal-aide" className="mt-1 text-xs text-text-3">
              {libelles.hintCodePostal}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="adh-telephone" obligatoire>
            {libelles.labelTelephone}
          </Label>
          <Input
            id="adh-telephone"
            type="tel"
            autoComplete="tel"
            placeholder={libelles.placeholderTelephone}
            aria-invalid={errors.telephone !== undefined ? true : undefined}
            aria-describedby={
              errors.telephone !== undefined ? 'adh-telephone-erreur' : 'adh-telephone-aide'
            }
            {...register('telephone')}
          />
          {errors.telephone !== undefined ? (
            <p id="adh-telephone-erreur" className="mt-1 text-xs text-danger">
              {errors.telephone.message}
            </p>
          ) : (
            <p id="adh-telephone-aide" className="mt-1 text-xs text-text-3">
              {libelles.hintTelephone}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="adh-date-naissance" obligatoire>
          {libelles.labelDateNaissance}
        </Label>
        <Input
          id="adh-date-naissance"
          type="date"
          autoComplete="bday"
          aria-invalid={errors.date_naissance !== undefined ? true : undefined}
          aria-describedby={
            errors.date_naissance !== undefined
              ? 'adh-date-naissance-erreur'
              : 'adh-date-naissance-aide'
          }
          {...register('date_naissance')}
        />
        {errors.date_naissance !== undefined ? (
          <p id="adh-date-naissance-erreur" className="mt-1 text-xs text-danger">
            {errors.date_naissance.message}
          </p>
        ) : (
          <p id="adh-date-naissance-aide" className="mt-1 text-xs text-text-3">
            {libelles.hintDateNaissance}
          </p>
        )}
      </div>

      <label
        htmlFor="adh-newsletter"
        className="flex cursor-pointer items-start gap-2 text-sm text-text-2"
      >
        <input
          id="adh-newsletter"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded-xs accent-brand"
          {...register('accepte_newsletter')}
        />
        <span>{libelles.labelNewsletter}</span>
      </label>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      {hydrate && !captchaValide ? (
        <p className="text-xs text-text-3" aria-live="polite">
          {libelles.messageCaptchaEnAttente ?? LIBELLES_DEFAUT.messageCaptchaEnAttente}
        </p>
      ) : null}
      {errors.token_turnstile !== undefined ? (
        <p className="text-xs text-danger">{errors.token_turnstile.message}</p>
      ) : null}

      <Button type="submit" disabled={envoiEnCours || !hydrate || !captchaValide}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>

      <p className="text-sm text-text-2">
        {libelles.amorceConnexion}{' '}
        <Link
          href="/connexion?prochaine=/agir/adherer/gratuit"
          className="text-brand underline-offset-4 hover:underline"
        >
          {libelles.lienConnexion}
        </Link>
      </p>
    </form>
  );
}
