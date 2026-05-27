'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_MARCHE_DEFAUT,
  type MessagesValidationMarche,
} from '@/lib/messages-validation';
import {
  type DonneesCreerProduitMarche,
  creerProduitMarcheFactory,
} from '@/lib/validations/marche';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.151). */
export interface LibellesCreationProduit {
  alertErreurTitre: string;
  legendeMode: string;
  modeVenteTitre: string;
  modeVenteAide: string;
  modeDonTitre: string;
  modeDonAide: string;
  labelTitre: string;
  placeholderTitre: string;
  labelDescription: string;
  labelPrixEur: string;
  hintPrixEur: string;
  labelPrixT99CP: string;
  placeholderPrixT99CP: string;
  hintPrixT99CP: string;
  labelCategorie: string;
  placeholderCategorie: string;
  hintCategorie: string;
  labelLieu: string;
  placeholderLieu: string;
  legendeRetrait: string;
  retraitMainPropre: string;
  retraitEnvoiPostal: string;
  labelImage: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationProduit = {
  alertErreurTitre: 'Publication impossible',
  legendeMode: 'Mode',
  modeVenteTitre: 'Vente',
  modeVenteAide: 'Prix en euros et/ou en T99CP.',
  modeDonTitre: 'Don gratuit',
  modeDonAide: 'Pas de prix, mise en relation directe.',
  labelTitre: 'Titre',
  placeholderTitre: 'Exemple : Vélo enfant 6-8 ans, bon état',
  labelDescription: 'Description',
  labelPrixEur: 'Prix en euros (centimes)',
  hintPrixEur: 'Saisir en centimes : 1500 = 15 €. Frais plateforme 5 %.',
  labelPrixT99CP: 'Prix en 99-coin (plus petites unités)',
  placeholderPrixT99CP: '0',
  hintPrixT99CP: 'Frais plateforme 0 %. Laisser à 0 si pas de prix en T99CP.',
  labelCategorie: 'Catégorie (slug technique)',
  placeholderCategorie: 'vetements / mobilier / livres / electromenager...',
  hintCategorie: "L'arborescence finale sera gérée en admin (chantier 9.2).",
  labelLieu: 'Lieu de retrait',
  placeholderLieu: 'Ville ou quartier',
  legendeRetrait: 'Modes de retrait acceptés',
  retraitMainPropre: 'Main propre (rencontre physique)',
  retraitEnvoiPostal: 'Envoi postal (port à la charge acheteureuse)',
  labelImage: 'Image illustrative (optionnelle)',
  ctaSubmit: 'Publier le produit',
  ctaEnCours: 'Publication...',
};

interface FormulaireCreationProduitProps {
  creerProduitMarche: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
  libelles?: LibellesCreationProduit;
  messages?: MessagesValidationMarche;
}

/**
 * Formulaire unique de création d'un produit du marché solidaire.
 *
 * Cf. spec §6F « toggle sur le même formulaire » : le radio `mode`
 * (vente / don) bascule l'affichage des champs de prix. En don, les
 * prix sont forcés à 0 avant envoi.
 */
export function FormulaireCreationProduit({
  creerProduitMarche,
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_MARCHE_DEFAUT,
}: FormulaireCreationProduitProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonneesCreerProduitMarche>({
    resolver: zodResolver(creerProduitMarcheFactory(messages)),
    defaultValues: {
      titre: '',
      description: '',
      mode: 'vente',
      prix_euros_centimes: 1000,
      prix_t99cp_unites: '0',
      categorie_slug: '',
      image_url: '',
      lieu: '',
      latitude: null,
      longitude: null,
      remise_main_propre: true,
      envoi_postal: false,
      token_turnstile: '',
    },
  });

  const mode = watch('mode');

  async function onSubmit(donnees: DonneesCreerProduitMarche) {
    setErreur(null);
    setEnvoiEnCours(true);
    // Si le mode est `don`, on s'assure que les prix sont à 0 avant
    // envoi (l'UI le force, mais une double sécurité ne coûte rien).
    const a_envoyer: DonneesCreerProduitMarche =
      donnees.mode === 'don'
        ? { ...donnees, prix_euros_centimes: 0, prix_t99cp_unites: '0' }
        : donnees;
    const resultat = await creerProduitMarche(a_envoyer);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    router.push(`/s-entraider/marche/produits/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          {libelles.legendeMode}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="vente"
              {...register('mode')}
              className="mt-0.5 accent-brand"
            />
            <div>
              <p className="font-bold text-text-1">{libelles.modeVenteTitre}</p>
              <p className="text-xs text-text-3">{libelles.modeVenteAide}</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input type="radio" value="don" {...register('mode')} className="mt-0.5 accent-brand" />
            <div>
              <p className="font-bold text-text-1">{libelles.modeDonTitre}</p>
              <p className="text-xs text-text-3">{libelles.modeDonAide}</p>
            </div>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="marche-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input id="marche-titre" placeholder={libelles.placeholderTitre} {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="marche-description" obligatoire>
          {libelles.labelDescription}
        </Label>
        <Textarea id="marche-description" rows={6} {...register('description')} />
        {errors.description !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        ) : null}
      </div>

      {mode === 'vente' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="marche-prix-eur">{libelles.labelPrixEur}</Label>
            <Input
              id="marche-prix-eur"
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              {...register('prix_euros_centimes', { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-text-3">{libelles.hintPrixEur}</p>
            {errors.prix_euros_centimes !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.prix_euros_centimes.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="marche-prix-t99cp">{libelles.labelPrixT99CP}</Label>
            <Input
              id="marche-prix-t99cp"
              type="text"
              inputMode="numeric"
              placeholder={libelles.placeholderPrixT99CP}
              {...register('prix_t99cp_unites')}
            />
            <p className="mt-1 text-xs text-text-3">{libelles.hintPrixT99CP}</p>
            {errors.prix_t99cp_unites !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.prix_t99cp_unites.message}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div>
        <Label htmlFor="marche-categorie">{libelles.labelCategorie}</Label>
        <Input
          id="marche-categorie"
          placeholder={libelles.placeholderCategorie}
          {...register('categorie_slug')}
        />
        <p className="mt-1 text-xs text-text-3">{libelles.hintCategorie}</p>
      </div>

      <div>
        <Label htmlFor="marche-lieu" obligatoire>
          {libelles.labelLieu}
        </Label>
        <Input id="marche-lieu" placeholder={libelles.placeholderLieu} {...register('lieu')} />
        {errors.lieu !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.lieu.message}</p>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          {libelles.legendeRetrait}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input type="checkbox" {...register('remise_main_propre')} className="accent-brand" />
            <span>{libelles.retraitMainPropre}</span>
          </label>
          <label className="flex items-center gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input type="checkbox" {...register('envoi_postal')} className="accent-brand" />
            <span>{libelles.retraitEnvoiPostal}</span>
          </label>
        </div>
        {errors.remise_main_propre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.remise_main_propre.message}</p>
        ) : null}
      </fieldset>

      <ChampImageObjet
        name="image_url"
        libelle={libelles.labelImage}
        onChange={(url) => setValue('image_url', url ?? '')}
      />
      {errors.image_url !== undefined ? (
        <p className="-mt-2 text-xs text-danger">{errors.image_url.message}</p>
      ) : null}

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
      </Button>
    </form>
  );
}
