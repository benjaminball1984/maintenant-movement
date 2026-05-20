import { CompteurStretch } from '@/components/petitions/CompteurStretch';
import { Card } from '@/components/ui';
import type { PetitionAvecCompteur } from '@/lib/petitions/requetes';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CartePetitionProps {
  petition: PetitionAvecCompteur;
  /** Si true, la carte occupe toute la largeur (mise en avant). */
  enAvant?: boolean;
}

/**
 * Carte « pétition » utilisée dans la liste `/mobiliser/petitions` (chantier 3.1).
 *
 * Affiche :
 *   - le titre cliquable,
 *   - la créatrice,
 *   - une accroche tirée des 200 premiers caractères du texte,
 *   - le `<CompteurStretch>` (×1,5 à 90 %),
 *   - le destinataire en pied.
 *
 * Le clic complet sur la carte mène à la fiche détail ; la modale de
 * signature reste accessible depuis cette fiche (et depuis la Une de la
 * home pour la pétition mise en avant).
 */
export function CartePetition({ petition, enAvant = false }: CartePetitionProps) {
  const accroche = extraireAccroche(petition.texte, 220);
  const nomCreaturice = formerNomCreaturice(petition.createurice_prenom, petition.createurice_nom);

  return (
    <Card
      variant={enAvant ? 'eleve' : 'ombre'}
      className={cn('flex flex-col gap-4', enAvant && 'border-brand/40')}
    >
      <header className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">
          Pétition à {petition.destinataire}
        </p>
        <h3 className="text-xl font-bold leading-tight text-text-1">
          <Link
            href={`/mobiliser/petitions/${petition.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {petition.titre}
          </Link>
        </h3>
      </header>

      <p className="text-sm text-text-2">{accroche}</p>

      <CompteurStretch
        signatures={petition.nombre_signatures}
        objectif={petition.objectif}
        taille="sm"
      />

      {nomCreaturice !== null ? (
        <p className="text-xs text-text-3">Lancée par {nomCreaturice}</p>
      ) : null}
    </Card>
  );
}

/**
 * Tronque proprement un texte à la limite donnée en évitant de couper un mot.
 * Ajoute un « ... » si troncature effectuée.
 */
function extraireAccroche(texte: string, limite: number): string {
  if (texte.length <= limite) return texte;
  const tronque = texte.slice(0, limite);
  const dernierEspace = tronque.lastIndexOf(' ');
  const coupe = dernierEspace > limite * 0.6 ? tronque.slice(0, dernierEspace) : tronque;
  return `${coupe.trimEnd()}...`;
}

/**
 * Forme « Prénom N. » à partir des deux champs séparés. Retourne null
 * si on n'a aucun des deux (créatrice anonymisée).
 */
function formerNomCreaturice(prenom: string | null, nom: string | null): string | null {
  const prenomNet = prenom?.trim() ?? '';
  const nomNet = nom?.trim() ?? '';
  if (prenomNet === '' && nomNet === '') return null;
  const initiale = nomNet === '' ? '' : ` ${nomNet.charAt(0).toUpperCase()}.`;
  return `${prenomNet}${initiale}`.trim();
}
