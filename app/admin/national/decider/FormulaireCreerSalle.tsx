'use client';

import { creerSalleDeciderAction } from '@/app/actions/decider';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { useState } from 'react';

const ESPACES = [
  { value: 'national', label: 'National' },
  { value: 'commune', label: 'Commune' },
  { value: 'federation', label: 'Fédération' },
  { value: 'confederation', label: 'Confédération' },
  { value: 'gt_thematique', label: 'GT thématique' },
  { value: 'campagne', label: 'Campagne' },
  { value: 'groupe_entraide_local', label: 'Groupe d’entraide local' },
] as const;

const VISIBILITES = [
  { value: 'membres', label: 'Membres uniquement' },
  { value: 'fedeere', label: 'Périmètre fédéré' },
  { value: 'public', label: 'Public (enregistré)' },
] as const;

/**
 * Formulaire client pour créer une salle Décider (V2.4.12).
 */
export function FormulaireCreerSalle() {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [espaceType, setEspaceType] = useState<(typeof ESPACES)[number]['value']>('national');
  const [espaceId, setEspaceId] = useState('');
  const [typeVisibilite, setTypeVisibilite] =
    useState<(typeof VISIBILITES)[number]['value']>('membres');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succesSlug, setSuccesSlug] = useState<string | null>(null);

  const surSoumettre = async () => {
    if (nom.trim().length === 0) return;
    setEnCours(true);
    setErreur(null);
    setSuccesSlug(null);
    const r = await creerSalleDeciderAction({
      nom: nom.trim(),
      description: description.trim() === '' ? undefined : description.trim(),
      espace_type: espaceType,
      espace_id: espaceId.trim() === '' ? undefined : espaceId.trim(),
      type_visibilite: typeVisibilite,
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setSuccesSlug(r.slug);
    setNom('');
    setDescription('');
    setEspaceId('');
  };

  return (
    <div className="grid gap-3 rounded-md border border-border bg-surface p-4">
      {succesSlug !== null ? (
        <Alert variant="success" titre="Salle créée">
          Slug : <code className="font-mono">{succesSlug}</code>. Tu peux en créer une autre ou
          aller la voir sur la page publique.
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="salle-nom" obligatoire>
          Nom
        </Label>
        <Input
          id="salle-nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex. Assemblée Confédérale — décembre"
          maxLength={200}
        />
      </div>

      <div>
        <Label htmlFor="salle-desc">Description (optionnelle)</Label>
        <Textarea
          id="salle-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="salle-espace">Type d’espace</Label>
          <select
            id="salle-espace"
            value={espaceType}
            onChange={(e) => setEspaceType(e.target.value as (typeof ESPACES)[number]['value'])}
            className="w-full rounded-md border border-border bg-surface p-2"
          >
            {ESPACES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="salle-visib">Visibilité</Label>
          <select
            id="salle-visib"
            value={typeVisibilite}
            onChange={(e) =>
              setTypeVisibilite(e.target.value as (typeof VISIBILITES)[number]['value'])
            }
            className="w-full rounded-md border border-border bg-surface p-2"
          >
            {VISIBILITES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {espaceType !== 'national' ? (
        <div>
          <Label htmlFor="salle-espace-id">UUID de l’espace</Label>
          <Input
            id="salle-espace-id"
            value={espaceId}
            onChange={(e) => setEspaceId(e.target.value)}
            placeholder="UUID de la commune / fédération / GT / etc."
          />
        </div>
      ) : null}

      <div>
        <Button onClick={surSoumettre} disabled={enCours || nom.trim().length === 0}>
          {enCours ? 'Création…' : 'Créer la salle'}
        </Button>
      </div>

      {erreur !== null && (
        <p role="alert" className="text-danger text-sm">
          {erreur}
        </p>
      )}
    </div>
  );
}
