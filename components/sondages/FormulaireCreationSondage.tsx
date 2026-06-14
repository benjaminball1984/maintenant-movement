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
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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

/** Une option du sondage en cours de saisie : libellé + image facultative. */
interface LigneOption {
  /** Identifiant stable de la ligne (clé React + remontage du téléverseur). */
  id: number;
  libelle: string;
  image: string | null;
}

/** Libelles surchargeables admin via CMS (V2.4.151). */
export interface LibellesCreationSondage {
  alertErreurTitre: string;
  erreurOptionsHorsLimites: string;
  labelTitre: string;
  labelQuestion: string;
  labelOptions: string;
  aideOptions: string;
  placeholderOption: string;
  ariaLibelleOption: string;
  ariaRetirerOption: string;
  ctaImageOption: string;
  ctaAjouterOption: string;
  maxAtteint: string;
  labelChoixMultiple: string;
  aideChoixMultiple: string;
  labelImage: string;
  aideCouverture: string;
  ctaSubmit: string;
  ctaEnCours: string;
  messageCaptchaEnAttente?: string;
}

const LIBELLES_DEFAUT: LibellesCreationSondage = {
  alertErreurTitre: 'Création impossible',
  erreurOptionsHorsLimites: 'Indique entre 2 et 20 options, chacune avec un nom.',
  labelTitre: 'Titre',
  labelQuestion: 'Question',
  labelOptions: 'Options (2 à 20)',
  aideOptions:
    'Ajoute une option, nomme-la, et téléverse une image si tu veux. Les images servent aussi à fabriquer la mosaïque de couverture.',
  placeholderOption: 'Option',
  ariaLibelleOption: 'Libellé de l’option',
  ariaRetirerOption: 'Retirer l’option',
  ctaImageOption: 'Téléverser une image',
  ctaAjouterOption: 'Ajouter une option',
  maxAtteint: 'Maximum 20 options atteint.',
  labelChoixMultiple: 'Autoriser plusieurs réponses (choix multiple)',
  aideChoixMultiple:
    'Les votant·es pourront cocher plusieurs options ; les résultats s’affichent en part des votant·es (le total peut dépasser 100 %).',
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
  // Éditeur d'options : une ligne = un libellé + une image facultative. L'image
  // vit DANS la ligne (objet), donc elle reste attachée à son option même quand
  // on en ajoute ou retire d'autres. On démarre avec 3 lignes vides.
  const idLigneRef = useRef(3);
  const [lignes, setLignes] = useState<LigneOption[]>(() => [
    { id: 0, libelle: '', image: null },
    { id: 1, libelle: '', image: null },
    { id: 2, libelle: '', image: null },
  ]);
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

  /** Ajoute une option vide (jusqu'à OPTIONS_MAX). */
  function ajouterLigne() {
    setLignes((courant) =>
      courant.length >= OPTIONS_MAX
        ? courant
        : [...courant, { id: idLigneRef.current++, libelle: '', image: null }],
    );
  }
  /** Retire une option (on garde toujours au moins OPTIONS_MIN lignes). */
  function retirerLigne(id: number) {
    setLignes((courant) =>
      courant.length <= OPTIONS_MIN ? courant : courant.filter((l) => l.id !== id),
    );
  }
  function majLibelle(id: number, libelle: string) {
    setLignes((courant) => courant.map((l) => (l.id === id ? { ...l, libelle } : l)));
  }
  function majImage(id: number, image: string | null) {
    setLignes((courant) => courant.map((l) => (l.id === id ? { ...l, image } : l)));
  }

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

    // On ne garde que les options réellement nommées ; l'image reste alignée
    // car elle est portée par la même ligne (objet).
    const lignesValides = lignes
      .map((l) => ({ libelle: l.libelle.trim(), image: l.image }))
      .filter((l) => l.libelle !== '');
    if (lignesValides.length < OPTIONS_MIN || lignesValides.length > OPTIONS_MAX) {
      setErreur(libelles.erreurOptionsHorsLimites);
      setEnvoiEnCours(false);
      return;
    }
    const options = lignesValides.map((l) => l.libelle);
    const optionsImages = lignesValides.map((l) => l.image);

    // Couverture systématique (demande Ben 2026-06-13) : sans image téléversée,
    // on fabrique la mosaïque automatiquement. Une image fournie par la personne
    // reste prioritaire (l'alternative voulue).
    let imageCouverture = (donnees.image_url ?? '').trim();
    if (imageCouverture === '') {
      imageCouverture = await genererEtTeleverserMosaique(donnees.titre, options, optionsImages);
    }

    const resultat = await creerSondage({
      ...donnees,
      options,
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
      <fieldset className="grid gap-3">
        <legend className="font-body text-sm font-medium text-text-1">
          {libelles.labelOptions} <span className="text-danger">*</span>
        </legend>
        <p className="-mt-1 text-xs text-text-3">{libelles.aideOptions}</p>
        <ul className="grid gap-3">
          {lignes.map((ligne, index) => (
            <li key={ligne.id} className="rounded-md border border-border bg-surface-2 p-3">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-sm font-bold text-text-2"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Input
                    value={ligne.libelle}
                    onChange={(e) => majLibelle(ligne.id, e.target.value)}
                    placeholder={`${libelles.placeholderOption} ${index + 1}`}
                    aria-label={`${libelles.ariaLibelleOption} ${index + 1}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => retirerLigne(ligne.id)}
                  disabled={lignes.length <= OPTIONS_MIN}
                  aria-label={`${libelles.ariaRetirerOption} ${index + 1}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-text-2 transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 pl-9">
                <TeleverseurImage
                  role={ROLE_IMAGE_OPTION}
                  prefixeChemin="sondages/options"
                  valeurInitiale={ligne.image}
                  libelle={libelles.ctaImageOption}
                  onChange={(url) => majImage(ligne.id, url)}
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            taille="sm"
            onClick={ajouterLigne}
            disabled={lignes.length >= OPTIONS_MAX}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            {libelles.ctaAjouterOption}
          </Button>
          {lignes.length >= OPTIONS_MAX ? (
            <span className="text-xs text-text-3">{libelles.maxAtteint}</span>
          ) : null}
        </div>
      </fieldset>

      <label
        htmlFor="sondage-choix-multiple"
        className="flex items-start gap-2 rounded-md border border-border bg-surface-2 p-3"
      >
        <input
          id="sondage-choix-multiple"
          type="checkbox"
          {...register('choix_multiple')}
          className="mt-0.5 h-4 w-4 accent-brand"
        />
        <span className="text-sm text-text-1">
          {libelles.labelChoixMultiple}
          <span className="mt-0.5 block text-xs text-text-3">{libelles.aideChoixMultiple}</span>
        </span>
      </label>

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
