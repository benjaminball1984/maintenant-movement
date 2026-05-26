'use client';

import { creerGroupeEntraide } from '@/app/actions/groupe-entraide-local';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { type FormEvent, useState } from 'react';

/**
 * Formulaire de création d'un groupe d'entraide local (cycle V2 V2.3.2).
 *
 * Champs minimum viables : nom, description courte, description complète,
 * zone géographique. Latitude/longitude optionnelles (saisies texte
 * libre, à enrichir avec MapLibre dans un chantier UX dédié).
 *
 * Image de couverture : à brancher sur `TeleverseurImage` (V2.0.3) dans le
 * chantier V2.3.4 (branchement TeleverseurImage sur formulaires).
 */
export function FormulaireCreationGroupeEntraide() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const surSoumission = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);

    const formData = new FormData(e.currentTarget);
    const latitudeBrut = formData.get('latitude');
    const longitudeBrut = formData.get('longitude');

    const donnees = {
      nom: String(formData.get('nom') ?? ''),
      description_courte: String(formData.get('description_courte') ?? ''),
      description: String(formData.get('description') ?? ''),
      zone_geographique: String(formData.get('zone_geographique') ?? ''),
      latitude:
        typeof latitudeBrut === 'string' && latitudeBrut !== ''
          ? Number.parseFloat(latitudeBrut)
          : null,
      longitude:
        typeof longitudeBrut === 'string' && longitudeBrut !== ''
          ? Number.parseFloat(longitudeBrut)
          : null,
    };

    try {
      const resultat = await creerGroupeEntraide(donnees);
      // `creerGroupeEntraide` redirige en cas de succès via `redirect()` ;
      // on n'arrive ici qu'en cas d'échec applicatif (Server Action retourne).
      if (resultat && !resultat.ok) {
        setErreur(resultat.message);
        setEnCours(false);
      }
    } catch (_e) {
      // Catch des erreurs réseau ou exceptions non gérées (la redirection
      // côté Next.js peut lever une erreur spéciale qui se propage).
      setEnCours(false);
    }
  };

  return (
    <form onSubmit={surSoumission} className="flex flex-col gap-5">
      {erreur !== null && (
        <Alert variant="danger" titre="Création impossible">
          {erreur}
        </Alert>
      )}

      <div>
        <Label htmlFor="nom">Nom du groupe</Label>
        <Input
          id="nom"
          name="nom"
          required
          minLength={3}
          maxLength={200}
          placeholder="Maraude solidaire Lyon 7, Voisinage rue X, AMAP du Plateau…"
        />
      </div>

      <div>
        <Label htmlFor="description_courte">Description courte (chapô)</Label>
        <Textarea
          id="description_courte"
          name="description_courte"
          required
          minLength={10}
          maxLength={500}
          rows={2}
          placeholder="Une à deux phrases qui apparaîtront sur la liste et en partage."
        />
      </div>

      <div>
        <Label htmlFor="description">Description complète</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder="Présente le groupe, son intention, ses activités envisagées."
        />
      </div>

      <div>
        <Label htmlFor="zone_geographique">Zone géographique</Label>
        <Input
          id="zone_geographique"
          name="zone_geographique"
          required
          minLength={2}
          maxLength={200}
          placeholder="Lyon 7e, immeuble 5 rue X, quartier de la Croix-Rousse…"
        />
        <p className="mt-1 text-text-3 text-xs">
          Texte libre. Un groupe peut couvrir un quartier, un immeuble, une AMAP, etc.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="latitude">Latitude (optionnelle)</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            placeholder="ex. 45.7484"
          />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude (optionnelle)</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            placeholder="ex. 4.8467"
          />
        </div>
      </div>
      <p className="-mt-2 text-text-3 text-xs">
        Si tu remplis l'une, l'autre est obligatoire. Le groupe apparaîtra alors sur la carte
        transversale.
      </p>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={enCours}>
          {enCours ? 'Création…' : 'Créer le groupe'}
        </Button>
        <p className="text-text-3 text-xs">Le groupe sera soumis à modération avant publication.</p>
      </div>
    </form>
  );
}
