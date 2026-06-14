'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button } from '@/components/ui';
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
  labelAge: string;
  ageMoins18: string;
  age18_24: string;
  age25_34: string;
  age35_49: string;
  age50_64: string;
  age65Plus: string;
  labelGenre: string;
  hintPondere: string;
  ctaSubmit: string;
  ctaEnCours: string;
  messageCaptchaEnAttente?: string;
}

const LIBELLES_DEFAUT: LibellesVote = {
  alertErreurTitre: 'Vote impossible',
  legendeVote: 'Ton vote',
  labelAge: "Tranche d'âge (optionnel)",
  ageMoins18: 'Moins de 18 ans',
  age18_24: '18-24 ans',
  age25_34: '25-34 ans',
  age35_49: '35-49 ans',
  age50_64: '50-64 ans',
  age65Plus: '65 ans et plus',
  labelGenre: 'Genre (optionnel)',
  hintPondere:
    'Ces deux réponses, comme le code postal déjà présent dans ton profil, servent uniquement à fiabiliser les résultats (méthode des quotas).',
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
  /** Choix multiple : cases à cocher plutôt que boutons radio. */
  choixMultiple?: boolean;
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
  choixMultiple = false,
  voterSondage,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_SONDAGES_DEFAUT,
}: FormulaireVoteProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
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
  } = useForm<DonneesVoterSondageEntree, unknown, DonneesVoterSondage>({
    resolver: zodResolver(creerVoterSondageSchema(messages)),
    // Pas de valeur par défaut pour `option_index` : aucune option n'est
    // précochée (un vote pour la première option « par accident » serait
    // inacceptable), la validation exige un choix explicite.
    defaultValues: {
      sondage_id: sondageId,
      genre_declare: '',
      token_turnstile: '',
    },
  });

  // La vérification anti-robot fournit son jeton de façon asynchrone. Tant
  // qu'il n'est pas là, le bouton reste bloqué (évite le clic « dans le vide »
  // qui échouait silencieusement) et un message explique l'attente.
  const captchaValide = (watch('token_turnstile') ?? '') !== '';

  function basculerChoix(index: number) {
    const suivant = choisies.includes(index)
      ? choisies.filter((i) => i !== index)
      : [...choisies, index];
    setChoisies(suivant);
    setValue('options_choisies', suivant, { shouldValidate: false });
  }

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
          {choixMultiple ? ' — plusieurs réponses possibles' : ''}
        </legend>
        <div className="grid gap-2">
          {options.map((opt, index) => {
            const image = optionsImages?.[index] ?? null;
            return (
              // biome-ignore lint/a11y/noLabelWithoutControl: l'input (radio ou case à cocher) est rendu dans la ternaire ci-dessous
              <label
                key={`${index}-${opt}`}
                className="flex cursor-pointer items-center gap-3 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2"
              >
                {/* Choix multiple : cases à cocher (état local → champ
                    `options_choisies`). Choix unique : boutons radio (pas de
                    `valueAsNumber`, qui renvoie NaN ; la conversion est faite
                    par le schéma Zod). */}
                {choixMultiple ? (
                  <input
                    type="checkbox"
                    checked={choisies.includes(index)}
                    onChange={() => basculerChoix(index)}
                    className="accent-brand"
                  />
                ) : (
                  <input
                    type="radio"
                    value={index}
                    {...register('option_index')}
                    className="accent-brand"
                  />
                )}
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
        {!choixMultiple && errors.option_index !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.option_index.message}</p>
        ) : null}
      </fieldset>

      {/* Genre et tranche d'âge ne sont plus demandés au vote (Ben
          2026-06-14) : ils sont posés dans la qualification de profil. L'âge
          se déduit de la date de naissance du profil ; sinon le panel le
          demande. */}
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
    </form>
  );
}
