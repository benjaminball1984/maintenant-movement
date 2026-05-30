'use client';

import { Label } from '@/components/ui';
import type { OrganisationGeree } from '@/lib/organisations/liaisons';
import {
  LIBELLE_TYPE_ORGANISATION,
  TYPES_ORGANISATION,
  type TypeOrganisation,
} from '@/lib/organisations/validation';

/** État de la déclaration d'organisation initiatrice (champ contrôlé). */
export interface DeclarationOrgInitiatrice {
  mode: 'aucune' | 'existante' | 'nouvelle';
  orgId: string;
  nom: string;
  typeOrganisation: TypeOrganisation;
}

export const DECLARATION_ORG_DEFAUT: DeclarationOrgInitiatrice = {
  mode: 'aucune',
  orgId: '',
  nom: '',
  typeOrganisation: 'collectif',
};

const CHAMP =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1 focus:border-brand focus:outline-none';

interface Props {
  /** Organisations déjà gérées par la personne (pour le mode « existante »). */
  mesOrganisations: OrganisationGeree[];
  value: DeclarationOrgInitiatrice;
  onChange: (v: DeclarationOrgInitiatrice) => void;
}

/**
 * Champ « Au nom de quelle organisation ? » pour les formulaires de création de
 * contenu (épopée réseau V2, chantier B.4, refinement §7.3).
 *
 * Choix unique : à titre personnel, une organisation déjà gérée, ou une
 * nouvelle organisation (créée à la volée, dont on devient gestionnaire).
 * Composant contrôlé : le formulaire parent détient l'état et le transmet à
 * `declarerOrganisationInitiatriceAction` après création du contenu.
 */
export function ChampOrganisationInitiatrice({ mesOrganisations, value, onChange }: Props) {
  // La valeur du <select> encode le mode : 'aucune', 'nouvelle', ou 'existante:<id>'.
  const valeurSelect =
    value.mode === 'existante' && value.orgId !== '' ? `existante:${value.orgId}` : value.mode;

  function changerMode(v: string) {
    if (v === 'aucune') {
      onChange({ ...value, mode: 'aucune', orgId: '' });
    } else if (v === 'nouvelle') {
      onChange({ ...value, mode: 'nouvelle', orgId: '' });
    } else if (v.startsWith('existante:')) {
      onChange({ ...value, mode: 'existante', orgId: v.slice('existante:'.length) });
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="org-initiatrice">Au nom d’une organisation ? (optionnel)</Label>
      <select
        id="org-initiatrice"
        value={valeurSelect}
        onChange={(e) => changerMode(e.target.value)}
        className={CHAMP}
      >
        <option value="aucune">À titre personnel (aucune organisation)</option>
        {mesOrganisations.map((o) => (
          <option key={o.id} value={`existante:${o.id}`}>
            {o.nom}
          </option>
        ))}
        <option value="nouvelle">Créer une nouvelle organisation…</option>
      </select>

      {value.mode === 'nouvelle' ? (
        <div className="grid gap-2 rounded-lg border border-border border-dashed p-3">
          <div className="grid gap-1">
            <Label htmlFor="org-init-nom">Nom de l’organisation</Label>
            <input
              id="org-init-nom"
              value={value.nom}
              onChange={(e) => onChange({ ...value, nom: e.target.value })}
              maxLength={120}
              placeholder="Exemple : Collectif des Trains de Nuit"
              className={CHAMP}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="org-init-type">Type</Label>
            <select
              id="org-init-type"
              value={value.typeOrganisation}
              onChange={(e) =>
                onChange({ ...value, typeOrganisation: e.target.value as TypeOrganisation })
              }
              className={CHAMP}
            >
              {TYPES_ORGANISATION.map((t) => (
                <option key={t} value={t}>
                  {LIBELLE_TYPE_ORGANISATION[t]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-text-3 text-xs">
            Tu en deviendras gestionnaire. Le badge « officiel » est accordé séparément par
            l’équipe.
          </p>
        </div>
      ) : null}
    </div>
  );
}
