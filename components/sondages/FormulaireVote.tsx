'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import {
  MESSAGES_VALIDATION_SONDAGES_DEFAUT,
  type MessagesValidationSondages,
} from '@/lib/messages-validation';
import {
  type DonneesVoterSondage,
  type DonneesVoterSondageEntree,
  creerVoterSondageSchema,
} from '@/lib/validations/sondages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.150). */
export interface LibellesVote {
  alertErreurTitre: string;
  legendeVote: string;
  detailsTitre: string;
  labelCodePostal: string;
  placeholderCodePostal: string;
  labelAge: string;
  ageMoins18: string;
  age18_24: string;
  age25_34: string;
  age35_49: string;
  age50_64: string;
  age65Plus: string;
  labelPronom: string;
  placeholderPronom: string;
  labelGenre: string;
  hintPondere: string;
  ctaSubmit: string;
  ctaEnCours: string;
  messageCaptchaEnAttente?: string;
}

const LIBELLES_DEFAUT: LibellesVote = {
  alertErreurTitre: 'Vote impossible',
  legendeVote: 'Ton vote',
  detailsTitre: 'Variables sociodémo (optionnel — méthode des quotas)',
  labelCodePostal: 'Code postal',
  placeholderCodePostal: '75020',
  labelAge: "Tranche d'âge",
  ageMoins18: 'Moins de 18 ans',
  age18_24: '18-24 ans',
  age25_34: '25-34 ans',
  age35_49: '35-49 ans',
  age50_64: '50-64 ans',
  age65Plus: '65 ans et plus',
  labelPronom: 'Pronom',
  placeholderPronom: 'iel / il / elle / ...',
  labelGenre: 'Genre déclaré',
  hintPondere:
    'Toutes ces variables sont optionnelles. Elles permettent la pondération par quotas (méthode redressement) dès 300 répondant·es.',
  ctaSubmit: 'Voter',
  ctaEnCours: 'Vote en cours...',
  messageCaptchaEnAttente:
    'Vérification anti-robot en cours… le bouton s’activera dès qu’elle est validée.',
};

interface FormulaireVoteProps {
  sondageId: string;
  options: string[];
  /** Images des options (tableau parallèle, null = pas d'image), ou null. */
  optionsImages?: (string | null)[] | null;
  voterSondage: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  libelles?: LibellesVote;
  messages?: MessagesValidationSondages;
}

/**
 * Formulaire de vote. Les champs sociodémo optionnels sont toujours
 * proposés (revue 2026-06-12 : la pondération s'applique automatiquement
 * dès 300 répondant·es, ce n'est plus un mode choisi à la création).
 */
export function FormulaireVote({
  sondageId,
  options,
  optionsImages = null,
  voterSondage,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_SONDAGES_DEFAUT,
}: FormulaireVoteProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
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
  } = useForm<DonneesVoterSondageEntree, unknown, DonneesVoterSondage>({
    resolver: zodResolver(creerVoterSondageSchema(messages)),
    // Pas de valeur par défaut pour `option_index` : aucune option n'est
    // précochée (un vote pour la première option « par accident » serait
    // inacceptable), la validation exige un choix explicite.
    defaultValues: {
      sondage_id: sondageId,
      code_postal: '',
      pronom: '',
      genre_declare: '',
      token_turnstile: '',
    },
  });

  // La vérification anti-robot fournit son jeton de façon asynchrone. Tant
  // qu'il n'est pas là, le bouton reste bloqué (évite le clic « dans le vide »
  // qui échouait silencieusement) et un message explique l'attente.
  const captchaValide = (watch('token_turnstile') ?? '') !== '';

  async function onSubmit(donnees: DonneesVoterSondage) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await voterSondage(donnees);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <input type="hidden" {...register('sondage_id')} />
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          {libelles.legendeVote}
        </legend>
        <div className="grid gap-2">
          {options.map((opt, index) => {
            const image = optionsImages?.[index] ?? null;
            return (
              <label
                key={`${index}-${opt}`}
                className="flex cursor-pointer items-center gap-3 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2"
              >
                {/* Pas de `valueAsNumber` : sur des radios il renvoie NaN
                    (vote bloqué, vu en prod le 2026-06-12). La conversion
                    chaîne -> nombre est faite par le schéma Zod. */}
                <input
                  type="radio"
                  value={index}
                  {...register('option_index')}
                  className="accent-brand"
                />
                {image !== null ? (
                  <img
                    src={image}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                    className="h-12 w-12 shrink-0 rounded-sm border border-border object-cover"
                  />
                ) : null}
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
        {errors.option_index !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.option_index.message}</p>
        ) : null}
      </fieldset>

      <details className="rounded-md border border-border bg-surface-2 p-3">
        <summary className="cursor-pointer text-sm font-bold text-text-1">
          {libelles.detailsTitre}
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="vote-cp">{libelles.labelCodePostal}</Label>
            <Input
              id="vote-cp"
              placeholder={libelles.placeholderCodePostal}
              {...register('code_postal')}
            />
          </div>
          <div>
            <Label htmlFor="vote-age">{libelles.labelAge}</Label>
            <select
              id="vote-age"
              {...register('tranche_age')}
              className="w-full rounded-sm border border-border bg-surface p-2 text-sm"
            >
              <option value="">—</option>
              <option value="moins_18">{libelles.ageMoins18}</option>
              <option value="18_24">{libelles.age18_24}</option>
              <option value="25_34">{libelles.age25_34}</option>
              <option value="35_49">{libelles.age35_49}</option>
              <option value="50_64">{libelles.age50_64}</option>
              <option value="65_plus">{libelles.age65Plus}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="vote-pronom">{libelles.labelPronom}</Label>
            <Input
              id="vote-pronom"
              placeholder={libelles.placeholderPronom}
              {...register('pronom')}
            />
          </div>
          <div>
            <Label htmlFor="vote-genre">{libelles.labelGenre}</Label>
            <Input id="vote-genre" {...register('genre_declare')} />
          </div>
        </div>
        <p className="mt-2 text-xs text-text-3">{libelles.hintPondere}</p>
      </details>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      {hydrate && !captchaValide ? (
        <p className="text-xs text-text-3" aria-live="polite">
          {libelles.messageCaptchaEnAttente ?? LIBELLES_DEFAUT.messageCaptchaEnAttente}
        </p>
      ) : null}

      <Button type="submit" disabled={envoiEnCours || !hydrate || !captchaValide}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}
