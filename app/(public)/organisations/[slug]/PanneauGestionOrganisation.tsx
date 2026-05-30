'use client';

import {
  coopterGestionnaireAction,
  definirBadgeOfficielAction,
  mettreAJourOrganisationAction,
  retirerGestionnaireAction,
} from '@/app/actions/organisation';
import { Alert, Button, Card, Label } from '@/components/ui';
import type { GestionnaireAffiche } from '@/lib/organisations/gestion';
import {
  LIBELLE_TYPE_ORGANISATION,
  TYPES_ORGANISATION,
  type TypeOrganisation,
} from '@/lib/organisations/validation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CHAMP =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1 focus:border-brand focus:outline-none';

interface PanneauProps {
  org: {
    id: string;
    nom: string;
    typeOrganisation: TypeOrganisation;
    description: string | null;
    imageUrl: string | null;
    badgeOfficiel: boolean;
  };
  gestionnaires: GestionnaireAffiche[];
  /** Le lecteur courant est-il admin (pour accorder le badge officiel) ? */
  estAdmin: boolean;
}

/**
 * Panneau de gestion d'une organisation (épopée réseau V2, chantier B.2).
 * Affiché aux gestionnaires : éditer la page, gérer les co-gestionnaires
 * (cooptation par numéro réseau M+7, réservée aux organisations officielles),
 * retirer un·e gestionnaire. L'admin peut accorder/retirer le badge officiel.
 */
export function PanneauGestionOrganisation({ org, gestionnaires, estAdmin }: PanneauProps) {
  const router = useRouter();

  // --- Édition de la page ---
  const [nom, setNom] = useState(org.nom);
  const [type, setType] = useState<TypeOrganisation>(org.typeOrganisation);
  const [description, setDescription] = useState(org.description ?? '');
  const [imageUrl, setImageUrl] = useState(org.imageUrl ?? '');
  const [editMsg, setEditMsg] = useState<{ ok: boolean; texte: string } | null>(null);
  const [editEnCours, setEditEnCours] = useState(false);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEditEnCours(true);
    setEditMsg(null);
    const r = await mettreAJourOrganisationAction({
      id: org.id,
      nom,
      type_organisation: type,
      description,
      image_url: imageUrl,
    });
    setEditEnCours(false);
    setEditMsg({ ok: r.ok, texte: r.ok ? 'Page mise à jour.' : r.message });
    if (r.ok) router.refresh();
  }

  // --- Cooptation ---
  const [numero, setNumero] = useState('');
  const [coptMsg, setCoptMsg] = useState<{ ok: boolean; texte: string } | null>(null);
  const [coptEnCours, setCoptEnCours] = useState(false);

  async function coopter(e: React.FormEvent) {
    e.preventDefault();
    setCoptEnCours(true);
    setCoptMsg(null);
    const r = await coopterGestionnaireAction({ org_id: org.id, numero: numero.trim() });
    setCoptEnCours(false);
    setCoptMsg({ ok: r.ok, texte: r.ok ? 'Gestionnaire ajouté·e.' : r.message });
    if (r.ok) {
      setNumero('');
      router.refresh();
    }
  }

  async function retirer(gestionnaireId: string) {
    const r = await retirerGestionnaireAction({ gestionnaire_id: gestionnaireId });
    if (r.ok) router.refresh();
    else setCoptMsg({ ok: false, texte: r.message });
  }

  async function basculerBadge() {
    const r = await definirBadgeOfficielAction({ org_id: org.id, officiel: !org.badgeOfficiel });
    if (r.ok) router.refresh();
  }

  return (
    <Card variant="ombre" className="border-brand/30">
      <h2 className="mb-1 font-bold text-text-1">Gestion de la page</h2>
      <p className="mb-4 text-sm text-text-3">
        Tu gères cette organisation. Tu peux publier en son nom (ci-dessus), éditer sa page et gérer
        les co-gestionnaires.
      </p>

      {/* Édition */}
      <form onSubmit={enregistrer} className="grid gap-3">
        {editMsg !== null ? (
          <Alert variant={editMsg.ok ? 'success' : 'danger'}>{editMsg.texte}</Alert>
        ) : null}
        <div className="grid gap-1">
          <Label htmlFor="g-nom">Nom</Label>
          <input
            id="g-nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className={CHAMP}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="g-type">Type</Label>
          <select
            id="g-type"
            value={type}
            onChange={(e) => setType(e.target.value as TypeOrganisation)}
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
          <Label htmlFor="g-desc">Description</Label>
          <textarea
            id="g-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={CHAMP}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="g-img">Lien du logo / image</Label>
          <input
            id="g-img"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className={CHAMP}
          />
        </div>
        <Button type="submit" taille="sm" disabled={editEnCours}>
          {editEnCours ? 'Enregistrement...' : 'Enregistrer la page'}
        </Button>
      </form>

      {/* Co-gestionnaires */}
      <div className="mt-6 border-border border-t pt-4">
        <h3 className="mb-2 font-bold text-text-1 text-sm">
          Gestionnaires ({gestionnaires.length})
        </h3>
        <ul className="grid gap-1.5">
          {gestionnaires.map((g) => (
            <li key={g.gestionnaireId} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-text-2">
                {g.nom}
                {g.numero !== null ? (
                  <span className="ml-1 font-mono text-text-3 text-xs">{g.numero}</span>
                ) : null}
              </span>
              {gestionnaires.length > 1 ? (
                <button
                  type="button"
                  onClick={() => retirer(g.gestionnaireId)}
                  className="text-danger text-xs hover:underline"
                >
                  Retirer
                </button>
              ) : null}
            </li>
          ))}
        </ul>

        {/* Cooptation : ouverte seulement si l'organisation est officielle. */}
        {org.badgeOfficiel ? (
          <form onSubmit={coopter} className="mt-3 grid gap-2">
            {coptMsg !== null ? (
              <Alert variant={coptMsg.ok ? 'success' : 'danger'}>{coptMsg.texte}</Alert>
            ) : null}
            <Label htmlFor="g-coopt">Ajouter un·e gestionnaire (numéro réseau M+7)</Label>
            <div className="flex gap-2">
              <input
                id="g-coopt"
                value={numero}
                onChange={(e) => setNumero(e.target.value.toUpperCase())}
                placeholder="MABCDEFG"
                className={`${CHAMP} font-mono`}
              />
              <Button type="submit" variant="outline" taille="sm" disabled={coptEnCours}>
                Coopter
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-3 text-text-3 text-xs">
            La cooptation d’autres gestionnaires sera possible une fois l’organisation officialisée.
          </p>
        )}
      </div>

      {/* Admin : badge officiel */}
      {estAdmin ? (
        <div className="mt-6 border-border border-t pt-4">
          <h3 className="mb-2 font-bold text-text-1 text-sm">Administration</h3>
          <Button type="button" variant="outline" taille="sm" onClick={basculerBadge}>
            {org.badgeOfficiel ? 'Retirer le badge officiel' : 'Accorder le badge officiel'}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
