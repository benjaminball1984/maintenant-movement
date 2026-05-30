'use client';

import { creerOrganisationAction } from '@/app/actions/organisation';
import { Alert, Button, Label } from '@/components/ui';
import {
  LIBELLE_TYPE_ORGANISATION,
  TYPES_ORGANISATION,
  type TypeOrganisation,
} from '@/lib/organisations/validation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CHAMP =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1 focus:border-brand focus:outline-none';

/**
 * Formulaire de création d'une organisation (épopée réseau V2, chantier B.1).
 *
 * Attestation sur l'honneur obligatoire (anti-usurpation : le badge officiel
 * reste accordé par l'admin). Redirige vers la page de l'organisation créée.
 */
export function FormulaireCreationOrganisation() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [typeOrganisation, setTypeOrganisation] = useState<TypeOrganisation>('collectif');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attestation, setAttestation] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function onSubmit(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerOrganisationAction({
      nom,
      type_organisation: typeOrganisation,
      description,
      image_url: imageUrl,
      attestation,
    });
    if (!resultat.ok) {
      setEnvoiEnCours(false);
      setErreur(resultat.message);
      return;
    }
    router.push(`/organisations/${resultat.slug}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" aria-label="Création d’une organisation">
      {erreur !== null ? (
        <Alert variant="danger" titre="Création impossible">
          {erreur}
        </Alert>
      ) : null}

      <div className="grid gap-1">
        <Label htmlFor="org-nom">Nom de l’organisation</Label>
        <input
          id="org-nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          maxLength={120}
          className={CHAMP}
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="org-type">Type</Label>
        <select
          id="org-type"
          value={typeOrganisation}
          onChange={(e) => setTypeOrganisation(e.target.value as TypeOrganisation)}
          className={CHAMP}
        >
          {TYPES_ORGANISATION.map((t) => (
            <option key={t} value={t}>
              {LIBELLE_TYPE_ORGANISATION[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <Label htmlFor="org-description">Description (optionnelle)</Label>
        <textarea
          id="org-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={2000}
          className={CHAMP}
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="org-image">Lien du logo / image (optionnel)</Label>
        <input
          id="org-image"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          className={CHAMP}
        />
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={attestation}
          onChange={(e) => setAttestation(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-brand"
        />
        <span className="text-sm text-text-2">
          J’atteste être habilité·e à représenter cette organisation. Le badge « officiel » sera
          accordé après vérification par l’équipe.
        </span>
      </label>

      <Button type="submit" disabled={envoiEnCours}>
        {envoiEnCours ? 'Création en cours...' : 'Créer l’organisation'}
      </Button>
    </form>
  );
}
