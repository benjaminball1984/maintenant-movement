'use client';

import { televerserImage } from '@/app/actions/storage';
import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import {
  Alert,
  Button,
  ChampImageObjet,
  Input,
  Label,
  TeleverseurImage,
  Textarea,
} from '@/components/ui';
import {
  MESSAGES_VALIDATION_SONDAGES_DEFAUT,
  type MessagesValidationSondages,
} from '@/lib/messages-validation';
import { genererMosaiqueSondage } from '@/lib/sondages/mosaique-canvas';
import { type DonneesCreerSondage, creerSondageFactory } from '@/lib/validations/sondages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

/** Bornes du nombre d'options (alignées sur le CHECK SQL et le schéma Zod). */
const OPTIONS_MIN = 2;
const OPTIONS_MAX = 20;

/**
 * Rôle de rangement des images d'options dans le bucket (prop `role` de
 * TeleverseurImage, qui n'est PAS un rôle ARIA : passé via constante pour
 * que le lint a11y ne le confonde pas avec l'attribut HTML `role`).
 */
const ROLE_IMAGE_OPTION = 'vignette' as const;

/** Libelles surchargeables admin via CMS (V2.4.151). */
export interface LibellesCreationSondage {
  alertErreurTitre: string;
  erreurOptionsHorsLimites: string;
  labelTitre: string;
  labelQuestion: string;
  labelOptions: string;
  placeholderOptions: string;
  titreImagesOptions: string;
  aideImagesOptions: string;
  labelImage: string;
  aideCouverture: string;
  ctaSubmit: string;
  ctaEnCours: string;
  messageCaptchaEnAttente?: string;
}

const LIBELLES_DEFAUT: LibellesCreationSondage = {
  alertErreurTitre: 'Création impossible',
  erreurOptionsHorsLimites: 'Indique entre 2 et 20 options, une par ligne.',
  labelTitre: 'Titre',
  labelQuestion: 'Question',
  labelOptions: 'Options (une par ligne, 2 à 20)',
  placeholderOptions: 'Option 1\nOption 2\nOption 3',
  titreImagesOptions: 'Illustrer les options (optionnel)',
  aideImagesOptions:
    'Chaque option peut recevoir une image. Stabilise d’abord ta liste d’options ci-dessus : les images suivent l’ordre des lignes.',
  labelImage: 'Image de couverture (optionnelle) — sinon une mosaïque est créée automatiquement',
  aideCouverture:
    'Laisse vide : une mosaïque (titre + tuiles des options) est générée automatiquement et sert de couverture, de miniature et d’aperçu de partage. Téléverse une image seulement si tu veux la remplacer.',
  ctaSubmit: 'Publier le sondage',
  ctaEnCours: 'Publication...',
  messageCaptchaEnAttente:
    'Vérification anti-robot en cours… le bouton s’activera dès qu’elle est validée.',
};

interface FormulaireCreationSondageProps {
  creerSondage: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  libelles?: LibellesCreationSondage;
  messages?: MessagesValidationSondages;
}

/**
 * Formulaire de création de sondage. Revue 2026-06-12 :
 *   - jusqu'à 20 options, chacune illustrable par une image téléversée ;
 *   - plus de choix de mode : l'affichage bascule automatiquement en
 *     pondéré dès 300 répondant·es (le visiteur garde une bascule de vue).
 */
export function FormulaireCreationSondage({
  creerSondage,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_SONDAGES_DEFAUT,
}: FormulaireCreationSondageProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [optionsTexte, setOptionsTexte] = useState('');
  // Images d'options, indexées sur la POSITION de la ligne (null = sans image).
  const [imagesOptions, setImagesOptions] = useState<Record<number, string>>({});
  const [hydrate, setHydrate] = useState(false);
  // Message d'avancement pendant la génération automatique de la mosaïque.
  const [statutGeneration, setStatutGeneration] = useState<string | null>(null);
  useEffect(() => {
    setHydrate(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonneesCreerSondage>({
    resolver: zodResolver(creerSondageFactory(messages)),
    defaultValues: {
      titre: '',
      question: '',
      options: [],
      image_url: '',
      commune_id: '',
      latitude: null,
      longitude: null,
      token_turnstile: '',
    },
  });

  // La vérification anti-robot fournit son jeton de façon asynchrone. Tant
  // qu'il n'est pas là, le bouton reste bloqué (évite le clic « dans le vide »
  // qui échouait silencieusement) et un message explique l'attente.
  const captchaValide = (watch('token_turnstile') ?? '') !== '';

  // Options parsées en continu : alimentent la liste des téléverseurs d'images.
  const optionsParsees = optionsTexte
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');

  /**
   * Génère la mosaïque de couverture dans le navigateur (canvas) puis la
   * téléverse via le même canal que les autres images. Renvoie l'URL
   * téléversée, ou '' en cas d'échec (la création retombera sur l'image par
   * défaut du sondage). Ne lève jamais : la création ne doit pas échouer
   * parce qu'une couverture n'a pas pu être fabriquée.
   */
  async function genererEtTeleverserMosaique(
    titre: string,
    options: string[],
    optionsImages: (string | null)[],
  ): Promise<string> {
    try {
      setStatutGeneration('Création de la couverture (mosaïque)…');
      const blob = await genererMosaiqueSondage({ titre, options, optionsImages });
      if (blob === null) return '';
      const fichier = new File([blob], 'mosaique-sondage.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('fichier', fichier);
      formData.append('role', 'couverture');
      formData.append('prefixeChemin', 'sondages/couvertures');
      const resultat = await televerserImage(formData);
      return resultat.ok ? resultat.url : '';
    } catch {
      return '';
    }
  }

  async function onSubmit(donnees: DonneesCreerSondage) {
    setErreur(null);
    setEnvoiEnCours(true);
    if (optionsParsees.length < OPTIONS_MIN || optionsParsees.length > OPTIONS_MAX) {
      setErreur(libelles.erreurOptionsHorsLimites);
      setEnvoiEnCours(false);
      return;
    }
    // Tableau d'images PARALLÈLE aux options (null = option sans image).
    const optionsImages = optionsParsees.map((_, index) => imagesOptions[index] ?? null);

    // Couverture systématique (demande Ben 2026-06-13) : sans image
    // téléversée, on fabrique la mosaïque automatiquement. Une image fournie
    // par la personne reste prioritaire (l'alternative voulue).
    let imageCouverture = (donnees.image_url ?? '').trim();
    if (imageCouverture === '') {
      imageCouverture = await genererEtTeleverserMosaique(
        donnees.titre,
        optionsParsees,
        optionsImages,
      );
    }

    const resultat = await creerSondage({
      ...donnees,
      options: optionsParsees,
      options_images: optionsImages,
      image_url: imageCouverture,
    });
    setEnvoiEnCours(false);
    setStatutGeneration(null);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/s-informer/sondages/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}
      <div>
        <Label htmlFor="sondage-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input id="sondage-titre" {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="sondage-question" obligatoire>
          {libelles.labelQuestion}
        </Label>
        <Textarea id="sondage-question" rows={3} {...register('question')} />
        {errors.question !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.question.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="sondage-options" obligatoire>
          {libelles.labelOptions}
        </Label>
        <Textarea
          id="sondage-options"
          rows={6}
          value={optionsTexte}
          onChange={(e) => setOptionsTexte(e.target.value)}
          placeholder={libelles.placeholderOptions}
        />
      </div>

      {optionsParsees.length >= OPTIONS_MIN ? (
        <fieldset className="rounded-md border border-border bg-surface-2 p-3">
          <legend className="px-1 font-body text-sm font-medium text-text-2">
            {libelles.titreImagesOptions}
          </legend>
          <p className="mb-3 text-xs text-text-3">{libelles.aideImagesOptions}</p>
          <ul className="grid gap-3">
            {optionsParsees.map((option, index) => (
              <li
                key={`option-image-${index}-${option}`}
                className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-surface p-2"
              >
                <span className="min-w-0 flex-1 break-words text-sm font-bold text-text-1">
                  {index + 1}. {option}
                </span>
                <TeleverseurImage
                  role={ROLE_IMAGE_OPTION}
                  prefixeChemin="sondages/options"
                  valeurInitiale={imagesOptions[index] ?? null}
                  onChange={(url) =>
                    setImagesOptions((courant) => {
                      const suivant = { ...courant };
                      if (url === null) delete suivant[index];
                      else suivant[index] = url;
                      return suivant;
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      <div className="grid gap-2">
        <p className="text-xs text-text-3">{libelles.aideCouverture}</p>
        <ChampImageObjet
          name="image_url"
          libelle={libelles.labelImage}
          prefixeChemin="sondages/couvertures"
          onChange={(url) => setValue('image_url', url ?? '')}
        />
      </div>
      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      {hydrate && !captchaValide ? (
        <p className="text-xs text-text-3" aria-live="polite">
          {libelles.messageCaptchaEnAttente ?? LIBELLES_DEFAUT.messageCaptchaEnAttente}
        </p>
      ) : null}
      {statutGeneration !== null ? (
        <p className="text-xs text-text-3" aria-live="polite">
          {statutGeneration}
        </p>
      ) : null}
      <Button type="submit" disabled={envoiEnCours || !hydrate || !captchaValide}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}
