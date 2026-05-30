'use client';

import {
  declarerContenuOrganisationAction,
  retirerContenuOrganisationAction,
} from '@/app/actions/organisation';
import { Alert, Button } from '@/components/ui';
import type { OrganisationGeree } from '@/lib/organisations/liaisons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  objetType: string;
  objetId: string;
  mesOrganisations: OrganisationGeree[];
  /** Id de l'organisation porteuse actuelle (si déjà rattaché), sinon null. */
  organisationActuelleId: string | null;
}

/**
 * Contrôle de rattachement d'un contenu à une organisation que je gère
 * (épopée réseau V2, chantier B.4). Affiché aux gestionnaires : choisir une de
 * ses organisations et la déclarer porteuse, ou retirer le rattachement.
 */
export function RattacherContenuOrganisation({
  objetType,
  objetId,
  mesOrganisations,
  organisationActuelleId,
}: Props) {
  const router = useRouter();
  const [choix, setChoix] = useState(mesOrganisations[0]?.id ?? '');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Le contenu est-il porté par une de MES organisations (donc je peux retirer) ?
  const gereLOrgaPorteuse =
    organisationActuelleId !== null &&
    mesOrganisations.some((o) => o.id === organisationActuelleId);

  async function rattacher() {
    setEnCours(true);
    setErreur(null);
    const r = await declarerContenuOrganisationAction({
      objet_type: objetType,
      objet_id: objetId,
      org_id: choix,
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    router.refresh();
  }

  async function retirer() {
    setEnCours(true);
    setErreur(null);
    const r = await retirerContenuOrganisationAction({ objet_type: objetType, objet_id: objetId });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2 grid gap-2 rounded-lg border border-border border-dashed p-3">
      <p className="font-bold text-sm text-text-2">Porter ce contenu au nom d’une organisation</p>
      {erreur !== null ? <Alert variant="danger">{erreur}</Alert> : null}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={choix}
          onChange={(e) => setChoix(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1"
          aria-label="Choisir une organisation à porter ce contenu"
        >
          {mesOrganisations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nom}
            </option>
          ))}
        </select>
        <Button type="button" taille="sm" disabled={enCours || choix === ''} onClick={rattacher}>
          Rattacher
        </Button>
        {gereLOrgaPorteuse ? (
          <Button type="button" variant="ghost" taille="sm" disabled={enCours} onClick={retirer}>
            Retirer le rattachement
          </Button>
        ) : null}
      </div>
    </div>
  );
}
