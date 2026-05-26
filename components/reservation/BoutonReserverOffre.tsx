'use client';

import { creerReservationAction } from '@/app/actions/reservation';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import type { OffreTypeReservation } from '@/lib/reservation';
import { CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

/**
 * Bouton de demande de réservation pour une offre (cycle V2 D8 + §14,
 * chantier V2.3.5).
 *
 * Pattern minimal façon « modale inline » : un bouton primaire qui
 * révèle un formulaire de réservation avec date de début (et fin
 * optionnelle), quantité, note libre. La Server Action génère le
 * message d'amorce pré-rempli à partir du contexte (cf.
 * `lib/reservation-amorce.ts`).
 *
 * Branché sur :
 * - `/s-entraider/offre/[slug]` (transport, hébergement, prêt)
 * - `/s-entraider/sel/[slug]` (service SEL)
 * - `/s-entraider/location-mutualisee/[slug]` (V2 ultérieur)
 *
 * UX volontairement sobre : pas de calendrier graphique (date picker
 * natif HTML), composable plus tard si besoin.
 */

export interface BoutonReserverOffreProps {
  offreType: OffreTypeReservation;
  offreId: string;
  /** Si l'utilisateurice n'est pas connectée, on lui propose de se connecter. */
  estConnecte: boolean;
  /** Si l'utilisateurice est le créateur de l'offre, on désactive le bouton. */
  estCreateur: boolean;
  /** Chemin à revalider après réservation. */
  cheminRevalidation?: string;
}

export function BoutonReserverOffre({
  offreType,
  offreId,
  estConnecte,
  estCreateur,
  cheminRevalidation,
}: BoutonReserverOffreProps) {
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  if (estCreateur) {
    return (
      <p className="text-sm text-text-3">
        C’est ton offre. Les demandes de réservation s’afficheront ici quand quelqu’un te
        contactera.
      </p>
    );
  }

  if (!estConnecte) {
    return (
      <Link
        href="/connexion"
        className="inline-flex h-11 items-center rounded-md bg-grad px-4 font-bold text-sm text-white shadow-brand transition hover:brightness-110"
      >
        Se connecter pour réserver
      </Link>
    );
  }

  if (succes) {
    return (
      <Alert variant="success" titre="Demande envoyée">
        Ta demande de réservation a été envoyée. Le propriétaire de l’offre va te répondre dans la
        messagerie interne.
      </Alert>
    );
  }

  if (!ouvert) {
    return (
      <Button variant="primary" onClick={() => setOuvert(true)}>
        <CalendarPlus size={16} aria-hidden="true" />
        Demander une réservation
      </Button>
    );
  }

  const surSoumission = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);

    const formData = new FormData(e.currentTarget);
    const creneauDebut = String(formData.get('creneau_debut') ?? '');
    const creneauFinBrut = formData.get('creneau_fin');
    const creneauFin =
      typeof creneauFinBrut === 'string' && creneauFinBrut !== ''
        ? new Date(creneauFinBrut).toISOString()
        : null;
    const quantite = Number.parseInt(String(formData.get('quantite') ?? '1'), 10);
    const noteLibre = String(formData.get('note_libre') ?? '').trim();

    const resultat = await creerReservationAction({
      offreType,
      offreId,
      creneauDebut: new Date(creneauDebut).toISOString(),
      creneauFin,
      quantite: Number.isNaN(quantite) ? 1 : quantite,
      noteLibre: noteLibre === '' ? undefined : noteLibre,
      cheminRevalidation,
    });

    setEnCours(false);
    if (resultat.ok) {
      setSucces(true);
      setOuvert(false);
    } else {
      setErreur(resultat.message);
    }
  };

  return (
    <form
      onSubmit={surSoumission}
      className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4"
    >
      <h3 className="font-display font-bold text-text-1">Demander une réservation</h3>

      {erreur !== null && (
        <Alert variant="danger" titre="Demande impossible">
          {erreur}
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="reserv-debut">Date et heure de début</Label>
          <Input id="reserv-debut" name="creneau_debut" type="datetime-local" required />
        </div>
        <div>
          <Label htmlFor="reserv-fin">Date et heure de fin (optionnel)</Label>
          <Input id="reserv-fin" name="creneau_fin" type="datetime-local" />
        </div>
      </div>

      <div>
        <Label htmlFor="reserv-quantite">Quantité (personnes / parts / unités)</Label>
        <Input
          id="reserv-quantite"
          name="quantite"
          type="number"
          min={1}
          max={100}
          defaultValue={1}
        />
      </div>

      <div>
        <Label htmlFor="reserv-note">Note libre (facultatif)</Label>
        <Textarea
          id="reserv-note"
          name="note_libre"
          rows={3}
          maxLength={1000}
          placeholder="Précisions sur ta demande, contexte, contraintes…"
        />
        <p className="mt-1 text-text-3 text-xs">
          Le message envoyé au propriétaire de l’offre sera pré-rempli pour toi (titre, créneau,
          quantité). Cette note est ajoutée à la fin.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={enCours}>
          {enCours ? 'Envoi…' : 'Envoyer la demande'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOuvert(false)} disabled={enCours}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
