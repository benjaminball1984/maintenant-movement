'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { type DonneesCreerProduitMarche, creerProduitMarcheSchema } from '@/lib/validations/marche';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormulaireCreationProduitProps {
  creerProduitMarche: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string } | { ok: false; message: string }>;
}

/**
 * Formulaire unique de création d'un produit du marché solidaire.
 *
 * Cf. spec §6F « toggle sur le même formulaire » : le radio `mode`
 * (vente / don) bascule l'affichage des champs de prix. En don, les
 * prix sont forcés à 0 avant envoi.
 */
export function FormulaireCreationProduit({ creerProduitMarche }: FormulaireCreationProduitProps) {
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
    resolver: zodResolver(creerProduitMarcheSchema),
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
        <Alert variant="danger" titre="Publication impossible">
          {erreur}
        </Alert>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">Mode</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input
              type="radio"
              value="vente"
              {...register('mode')}
              className="mt-0.5 accent-brand"
            />
            <div>
              <p className="font-bold text-text-1">Vente</p>
              <p className="text-xs text-text-3">Prix en euros et/ou en T99CP.</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input type="radio" value="don" {...register('mode')} className="mt-0.5 accent-brand" />
            <div>
              <p className="font-bold text-text-1">Don gratuit</p>
              <p className="text-xs text-text-3">Pas de prix, mise en relation directe.</p>
            </div>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="marche-titre" obligatoire>
          Titre
        </Label>
        <Input
          id="marche-titre"
          placeholder="Exemple : Vélo enfant 6-8 ans, bon état"
          {...register('titre')}
        />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="marche-description" obligatoire>
          Description
        </Label>
        <Textarea id="marche-description" rows={6} {...register('description')} />
        {errors.description !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        ) : null}
      </div>

      {mode === 'vente' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="marche-prix-eur">Prix en euros (centimes)</Label>
            <Input
              id="marche-prix-eur"
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              {...register('prix_euros_centimes', { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-text-3">
              Saisir en centimes : 1500 = 15 €. Frais plateforme 5 %.
            </p>
            {errors.prix_euros_centimes !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.prix_euros_centimes.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="marche-prix-t99cp">Prix en 99-coin (plus petites unités)</Label>
            <Input
              id="marche-prix-t99cp"
              type="text"
              inputMode="numeric"
              placeholder="0"
              {...register('prix_t99cp_unites')}
            />
            <p className="mt-1 text-xs text-text-3">
              Frais plateforme 0 %. Laisser à 0 si pas de prix en T99CP.
            </p>
            {errors.prix_t99cp_unites !== undefined ? (
              <p className="mt-1 text-xs text-danger">{errors.prix_t99cp_unites.message}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div>
        <Label htmlFor="marche-categorie">Catégorie (slug technique)</Label>
        <Input
          id="marche-categorie"
          placeholder="vetements / mobilier / livres / electromenager..."
          {...register('categorie_slug')}
        />
        <p className="mt-1 text-xs text-text-3">
          L'arborescence finale sera gérée en admin (chantier 9.2).
        </p>
      </div>

      <div>
        <Label htmlFor="marche-lieu" obligatoire>
          Lieu de retrait
        </Label>
        <Input id="marche-lieu" placeholder="Ville ou quartier" {...register('lieu')} />
        {errors.lieu !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.lieu.message}</p>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-2 font-body text-sm font-medium text-text-2">
          Modes de retrait acceptés
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input type="checkbox" {...register('remise_main_propre')} className="accent-brand" />
            <span>Main propre (rencontre physique)</span>
          </label>
          <label className="flex items-center gap-2 rounded-sm border border-border bg-surface p-3 text-sm hover:bg-surface-2">
            <input type="checkbox" {...register('envoi_postal')} className="accent-brand" />
            <span>Envoi postal (port à la charge acheteureuse)</span>
          </label>
        </div>
        {errors.remise_main_propre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.remise_main_propre.message}</p>
        ) : null}
      </fieldset>

      <div>
        <Label htmlFor="marche-image">URL d'image (optionnel)</Label>
        <Input id="marche-image" type="url" placeholder="https://..." {...register('image_url')} />
        {errors.image_url !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.image_url.message}</p>
        ) : null}
      </div>

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Publication...' : 'Publier le produit'}
      </Button>
    </form>
  );
}
