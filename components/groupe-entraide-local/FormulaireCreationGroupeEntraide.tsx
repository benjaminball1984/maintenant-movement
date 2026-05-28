'use client';

import { creerGroupeEntraide } from '@/app/actions/groupe-entraide-local';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { type FormEvent, useState } from 'react';

/** Libelles surchargeables admin via CMS (V2.4.154). */
export interface LibellesCreationGroupeEntraide {
  alertErreurTitre: string;
  labelNom: string;
  placeholderNom: string;
  labelDescriptionCourte: string;
  placeholderDescriptionCourte: string;
  labelDescription: string;
  placeholderDescription: string;
  labelZone: string;
  placeholderZone: string;
  hintZone: string;
  labelLatitude: string;
  placeholderLatitude: string;
  labelLongitude: string;
  placeholderLongitude: string;
  hintGeo: string;
  ctaSubmit: string;
  ctaEnCours: string;
  hintModeration: string;
}

const LIBELLES_DEFAUT: LibellesCreationGroupeEntraide = {
  alertErreurTitre: 'Création impossible',
  labelNom: 'Nom du groupe',
  placeholderNom: 'Maraude solidaire Lyon 7, Voisinage rue X, AMAP du Plateau…',
  labelDescriptionCourte: 'Description courte (chapô)',
  placeholderDescriptionCourte: 'Une à deux phrases qui apparaîtront sur la liste et en partage.',
  labelDescription: 'Description complète',
  placeholderDescription: 'Présente le groupe, son intention, ses activités envisagées.',
  labelZone: 'Zone géographique',
  placeholderZone: 'Lyon 7e, immeuble 5 rue X, quartier de la Croix-Rousse…',
  hintZone: 'Texte libre. Un groupe peut couvrir un quartier, un immeuble, une AMAP, etc.',
  labelLatitude: 'Latitude (optionnelle)',
  placeholderLatitude: 'ex. 45.7484',
  labelLongitude: 'Longitude (optionnelle)',
  placeholderLongitude: 'ex. 4.8467',
  hintGeo:
    "Si tu remplis l'une, l'autre est obligatoire. Le groupe apparaîtra alors sur la carte transversale.",
  ctaSubmit: 'Créer le groupe',
  ctaEnCours: 'Création…',
  hintModeration: 'Le groupe sera soumis à modération avant publication.',
};

interface FormulaireCreationGroupeEntraideProps {
  libelles?: LibellesCreationGroupeEntraide;
}

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
export function FormulaireCreationGroupeEntraide({
  libelles = LIBELLES_DEFAUT,
}: FormulaireCreationGroupeEntraideProps = {}) {
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
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      )}

      <div>
        <Label htmlFor="nom">{libelles.labelNom}</Label>
        <Input
          id="nom"
          name="nom"
          required
          minLength={3}
          maxLength={200}
          placeholder={libelles.placeholderNom}
        />
      </div>

      <div>
        <Label htmlFor="description_courte">{libelles.labelDescriptionCourte}</Label>
        <Textarea
          id="description_courte"
          name="description_courte"
          required
          minLength={10}
          maxLength={500}
          rows={2}
          placeholder={libelles.placeholderDescriptionCourte}
        />
      </div>

      <div>
        <Label htmlFor="description">{libelles.labelDescription}</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder={libelles.placeholderDescription}
        />
      </div>

      <div>
        <Label htmlFor="zone_geographique">{libelles.labelZone}</Label>
        <Input
          id="zone_geographique"
          name="zone_geographique"
          required
          minLength={2}
          maxLength={200}
          placeholder={libelles.placeholderZone}
        />
        <p className="mt-1 text-text-3 text-xs">{libelles.hintZone}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="latitude">{libelles.labelLatitude}</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            placeholder={libelles.placeholderLatitude}
          />
        </div>
        <div>
          <Label htmlFor="longitude">{libelles.labelLongitude}</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            placeholder={libelles.placeholderLongitude}
          />
        </div>
      </div>
      <p className="-mt-2 text-text-3 text-xs">{libelles.hintGeo}</p>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={enCours}>
          {enCours ? libelles.ctaEnCours : libelles.ctaSubmit}
        </Button>
        <p className="text-text-3 text-xs">{libelles.hintModeration}</p>
      </div>
    </form>
  );
}
