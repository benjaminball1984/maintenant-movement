'use client';

import { revendiquerOrganisationAction } from '@/app/actions/organisation';
import { Alert, Button } from '@/components/ui';
import type { StatutRevendicationCourante } from '@/lib/organisations/revendications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Bouton « Revendiquer la gestion » d'une organisation (épopée réseau V2,
 * chantier B.3). Affiché à une personne connectée qui n'est PAS gestionnaire.
 * Ouvre un petit formulaire (justification optionnelle) ; la demande part en
 * file d'attente, arbitrée par l'admin.
 */
export function BoutonRevendiquer({
  orgId,
  statut,
}: {
  orgId: string;
  statut: StatutRevendicationCourante;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  if (statut === 'gestionnaire') return null;

  if (statut === 'en_attente' || envoye) {
    return (
      <Alert variant="info" titre="Demande de gestion en attente">
        Ta demande pour gérer cette organisation a été transmise. L’équipe va l’examiner.
      </Alert>
    );
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    const r = await revendiquerOrganisationAction({ org_id: orgId, message });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setEnvoye(true);
    router.refresh();
  }

  if (!ouvert) {
    return (
      <Button type="button" variant="outline" taille="sm" onClick={() => setOuvert(true)}>
        Revendiquer la gestion de cette organisation
      </Button>
    );
  }

  return (
    <form onSubmit={envoyer} className="grid gap-2 rounded-lg border border-border p-3">
      {erreur !== null ? <Alert variant="danger">{erreur}</Alert> : null}
      <label htmlFor="rev-msg" className="font-bold text-sm text-text-2">
        Pourquoi es-tu habilité·e à gérer cette organisation ? (optionnel)
      </label>
      <textarea
        id="rev-msg"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Ton rôle dans l’organisation, un lien officiel…"
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1"
      />
      <div className="flex gap-2">
        <Button type="submit" taille="sm" disabled={enCours}>
          {enCours ? 'Envoi...' : 'Envoyer la demande'}
        </Button>
        <Button type="button" variant="ghost" taille="sm" onClick={() => setOuvert(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
