'use client';

import { declarerOrganisationInitiatriceAction } from '@/app/actions/organisation';
import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import {
  ChampOrganisationInitiatrice,
  DECLARATION_ORG_DEFAUT,
  type DeclarationOrgInitiatrice,
} from '@/components/organisations/ChampOrganisationInitiatrice';
import { EditeurRicheAvecToolbar } from '@/components/rich-text/EditeurRicheAvecToolbar';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
  type MessagesValidationCampagne,
} from '@/lib/messages-validation';
import type { OrganisationGeree } from '@/lib/organisations/liaisons';
import { markdownLegerEnHtml } from '@/lib/rich-text/markdown-vers-html';
import { type DonneesCreerCampagne, creerCampagneFactory } from '@/lib/validations/campagne';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.149). */
export interface LibellesCreationCampagne {
  alertErreurTitre: string;
  labelTitre: string;
  placeholderTitre: string;
  labelTexte: string;
  placeholderTexte: string;
  hintTexte: string;
  labelImage: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationCampagne = {
  alertErreurTitre: 'Création impossible',
  labelTitre: 'Titre',
  placeholderTitre: "Exemple : Stop à l'autoroute A69",
  labelTexte: 'Présentation de la campagne',
  placeholderTexte:
    'Décris le combat, le contexte, ce que tu veux assembler comme modules. 100 à 5000 caractères.',
  hintTexte:
    'Tu pourras attacher des modules (pétition, mobilisation, ...) une fois la campagne validée.',
  labelImage: 'Image illustrative (optionnelle)',
  ctaSubmit: 'Soumettre pour modération',
  ctaEnCours: 'Envoi...',
};

interface FormulaireCreationCampagneProps {
  creerCampagne: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string; campagne_id: string } | { ok: false; message: string }>;
  /** Organisations gérées par la personne (B.4 : déclarer une orga porteuse). */
  mesOrganisations?: OrganisationGeree[];
  libelles?: LibellesCreationCampagne;
  messages?: MessagesValidationCampagne;
}

/**
 * Formulaire de création d'une campagne (Client Component).
 *
 * Une fois la campagne créée (statut en_moderation), la créateurice
 * peut commencer à y attacher des modules depuis la fiche détail. Pour
 * 3.2 v1, l'attachement de modules est exposé uniquement via la console
 * admin / l'API (Server Action `attacherModule`) — une UI dédiée
 * d'édition des modules viendra dans un chantier polish.
 */
export function FormulaireCreationCampagne({
  creerCampagne,
  mesOrganisations = [],
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_CAMPAGNE_DEFAUT,
}: FormulaireCreationCampagneProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [declarationOrg, setDeclarationOrg] =
    useState<DeclarationOrgInitiatrice>(DECLARATION_ORG_DEFAUT);
  // V2.5.51 — switch Riche/Markdown pour la presentation.
  const [texteHtml, setTexteHtml] = useState('');
  const [modeTexte, setModeTexte] = useState<'markdown' | 'riche'>('markdown');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonneesCreerCampagne>({
    resolver: zodResolver(creerCampagneFactory(messages)),
    defaultValues: {
      titre: '',
      texte: '',
      texte_html: '',
      image_url: '',
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerCampagne) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerCampagne(donnees);

    if (!resultat.ok) {
      setEnvoiEnCours(false);
      setErreur(resultat.message);
      return;
    }
    if (declarationOrg.mode !== 'aucune') {
      await declarerOrganisationInitiatriceAction({
        objet_type: 'campagne',
        objet_id: resultat.campagne_id,
        mode: declarationOrg.mode,
        org_id: declarationOrg.orgId === '' ? undefined : declarationOrg.orgId,
        nom: declarationOrg.nom === '' ? undefined : declarationOrg.nom,
        type_organisation: declarationOrg.typeOrganisation,
      });
    }
    setEnvoiEnCours(false);
    router.push(`/mobiliser/campagnes/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="camp-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input id="camp-titre" placeholder={libelles.placeholderTitre} {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Label htmlFor="camp-texte" obligatoire>
            {libelles.labelTexte}
          </Label>
          <div className="inline-flex overflow-hidden rounded-md border border-border text-xs">
            <button
              type="button"
              onClick={() => {
                // V2.5.51 — bascule vers Riche pre-remplit avec la
                // conversion du Markdown courant si HTML vide.
                const texteCourant = watch('texte') ?? '';
                if (texteHtml === '' && texteCourant.trim() !== '') {
                  const html = markdownLegerEnHtml(texteCourant);
                  setTexteHtml(html);
                  setValue('texte_html', html, { shouldDirty: true });
                }
                setModeTexte('riche');
              }}
              className={`inline-flex items-center gap-1 px-3 py-1 ${
                modeTexte === 'riche' ? 'bg-brand text-white' : 'bg-surface text-text-2'
              }`}
              aria-pressed={modeTexte === 'riche'}
            >
              <Sparkles size={11} aria-hidden="true" />
              Riche
            </button>
            <button
              type="button"
              onClick={() => setModeTexte('markdown')}
              className={`inline-flex items-center gap-1 border-border border-l px-3 py-1 ${
                modeTexte === 'markdown' ? 'bg-brand text-white' : 'bg-surface text-text-2'
              }`}
              aria-pressed={modeTexte === 'markdown'}
            >
              <FileText size={11} aria-hidden="true" />
              Markdown
            </button>
          </div>
        </div>
        {modeTexte === 'riche' ? (
          <>
            <EditeurRicheAvecToolbar
              contenuInitialHtml={texteHtml}
              onChange={(html) => {
                setTexteHtml(html);
                setValue('texte_html', html, { shouldDirty: true });
              }}
              placeholder={libelles.placeholderTexte}
              hauteurMin={280}
              labelA11y="Présentation de la campagne (éditeur de texte riche)"
            />
            <p className="mt-1 text-text-3 text-xs">{libelles.hintTexte}</p>
            <input type="hidden" {...register('texte_html')} />
            {/* Le champ texte reste obligatoire (validation Zod min 100 chars).
                Quand on est en mode Riche, on continue de saisir un texte plat
                qui servira de fallback et de SEO. */}
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-text-3 hover:text-text-1">
                Version texte plat (obligatoire, 100 chars min) — résumé/fallback
              </summary>
              <Textarea
                id="camp-texte"
                rows={4}
                placeholder="Résumé en texte plat (sert de fallback et pour le SEO)"
                {...register('texte')}
                className="mt-2"
              />
              {errors.texte !== undefined ? (
                <p className="mt-1 text-danger text-xs">{errors.texte.message}</p>
              ) : null}
            </details>
          </>
        ) : (
          <>
            <Textarea
              id="camp-texte"
              rows={10}
              placeholder={libelles.placeholderTexte}
              {...register('texte')}
            />
            <p className="mt-1 text-text-3 text-xs">{libelles.hintTexte}</p>
            {errors.texte !== undefined ? (
              <p className="mt-1 text-danger text-xs">{errors.texte.message}</p>
            ) : null}
          </>
        )}
      </div>

      <ChampImageObjet
        name="image_url"
        libelle={libelles.labelImage}
        onChange={(url) => setValue('image_url', url ?? '')}
      />
      {errors.image_url !== undefined ? (
        <p className="-mt-2 text-xs text-danger">{errors.image_url.message}</p>
      ) : null}

      <ChampOrganisationInitiatrice
        mesOrganisations={mesOrganisations}
        value={declarationOrg}
        onChange={setDeclarationOrg}
      />

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <div className="flex gap-3">
        <Button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
        </Button>
      </div>
    </form>
  );
}
