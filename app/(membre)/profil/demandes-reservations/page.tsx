import { BoutonsProprietaireReservation } from '@/components/reservation/BoutonsProprietaireReservation';
import { HistoriqueTransitions } from '@/components/reservation/HistoriqueTransitions';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import {
  type IdentiteAffichee,
  chargerIdentitesAffichables,
  nomAffichageRespectantVisibilite,
} from '@/lib/reseau/identite';
import {
  type EntreeJournalReservation,
  listerJournauxReservations,
  listerReservationsRecuesParProprietaire,
} from '@/lib/reservation';
import { chargerTitresOffres } from '@/lib/reservation-titres';
import { CalendarRange, MessageSquare, User } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Demandes de réservation reçues',
  description: 'Demandes envoyées par d’autres membres sur les offres dont je suis créateur.',
};

/**
 * Page « Demandes de réservation reçues » (cycle V2 V2.3.13).
 *
 * Symétrique de `/profil/reservations` (V2.3.9) : liste les
 * réservations dont la personne connectée est propriétaire de l'offre
 * (pas demandeuse). Permet d'accepter / refuser / marquer réalisée
 * selon la machine à états D8.
 */
export default async function PageDemandesReservations() {
  const session = await getSessionOuRediriger('/profil/demandes-reservations');
  const reservations = await listerReservationsRecuesParProprietaire(session.userId);
  const [titresParId, journauxParId] = await Promise.all([
    chargerTitresOffres(reservations),
    listerJournauxReservations(reservations.map((r) => r.id)),
  ]);

  const idsAResoudre = new Set<string>();
  for (const r of reservations) idsAResoudre.add(r.demandeurPersonneId);
  for (const lignes of journauxParId.values()) {
    for (const l of lignes) {
      if (l.auteurId !== null) idsAResoudre.add(l.auteurId);
    }
  }
  const identitesParId = await chargerIdentitesAffichables([...idsAResoudre]);

  return (
    <Container taille="md" className="py-12">
      <Heading niveau={1}>Demandes de réservation reçues</Heading>
      <p className="mt-2 text-text-2">
        Les demandes envoyées par d’autres membres sur tes offres (covoit, hébergement, prêt, SEL,
        location mutualisée). Tu peux accepter, refuser, ou marquer une demande comme réalisée après
        la rencontre.
      </p>

      {reservations.length === 0 ? (
        <Card variant="ombre" className="mt-8">
          <p className="text-text-2">
            Aucune demande pour le moment. Quand quelqu’un demandera à réserver l’une de tes offres,
            sa demande apparaîtra ici.
          </p>
        </Card>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              <CarteDemande
                reservation={reservation}
                titreOffre={titresParId.get(reservation.offreId) ?? null}
                journal={journauxParId.get(reservation.id) ?? []}
                identites={identitesParId}
              />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

const VARIANT_STATUT = {
  proposee: 'warning',
  acceptee: 'success',
  refusee: 'danger',
  realisee: 'info',
  confirmee: 'success',
  annulee: 'default',
  litige: 'danger',
} as const;

const LIBELLE_STATUT = {
  proposee: 'En attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  realisee: 'Réalisée',
  confirmee: 'Confirmée',
  annulee: 'Annulée par le demandeur',
  litige: 'Litige',
} as const;

const LIBELLE_TYPE_OFFRE = {
  transport_covoiturage: 'Covoiturage',
  hebergement: 'Hébergement',
  pret: 'Prêt',
  service_sel: 'Service SEL',
  location_mutualisee: 'Location mutualisée',
  autre: 'Offre',
} as const;

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function CarteDemande({
  reservation,
  titreOffre,
  journal,
  identites,
}: {
  reservation: import('@/lib/reservation').Reservation;
  titreOffre: { titre: string; cheminPage: string | null } | null;
  journal: EntreeJournalReservation[];
  identites: Map<string, IdentiteAffichee>;
}) {
  const identiteDemandeur = identites.get(reservation.demandeurPersonneId);
  const numeroDemandeur = identiteDemandeur?.numero ?? null;
  const nomDemandeur = nomAffichageRespectantVisibilite(identiteDemandeur);
  const titreAffiche = titreOffre?.titre ?? '(offre supprimée)';

  return (
    <Card variant="ombre" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">{LIBELLE_TYPE_OFFRE[reservation.offreType]}</Badge>
          <Badge variant={VARIANT_STATUT[reservation.statut]}>
            {LIBELLE_STATUT[reservation.statut]}
          </Badge>
        </div>
        <span className="text-text-3 text-xs">
          Reçue le {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}
        </span>
      </div>

      <h2 className="font-display font-bold text-lg text-text-1">
        {titreOffre?.cheminPage !== null && titreOffre?.cheminPage !== undefined ? (
          <Link href={titreOffre.cheminPage} className="hover:text-brand">
            {titreAffiche}
          </Link>
        ) : (
          titreAffiche
        )}
      </h2>

      <div className="flex items-start gap-2 text-sm text-text-2">
        <CalendarRange size={16} className="mt-0.5 text-text-3" aria-hidden="true" />
        <span>
          {FORMATEUR.format(new Date(reservation.creneauDebut))}
          {reservation.creneauFin !== null
            ? ` → ${FORMATEUR.format(new Date(reservation.creneauFin))}`
            : ''}
          {reservation.quantite > 1 ? ` · ${reservation.quantite} parts` : ''}
        </span>
      </div>

      <div className="flex items-start gap-2 text-sm text-text-3">
        <User size={14} className="mt-0.5" aria-hidden="true" />
        <span>
          Demandeur·euse :{' '}
          {numeroDemandeur !== null ? (
            <Link
              href={`/s-informer/reseau/${numeroDemandeur}`}
              className="text-brand hover:underline"
              title="Voir le profil réseau"
            >
              {nomDemandeur}
            </Link>
          ) : (
            <span className="text-text-2">{nomDemandeur}</span>
          )}
        </span>
      </div>

      {reservation.motifDecision !== null ? (
        <p className="text-sm text-text-3">
          <strong>Motif :</strong> {reservation.motifDecision}
        </p>
      ) : null}

      <details className="rounded-md border border-border bg-surface-2 p-3 text-sm">
        <summary className="cursor-pointer text-text-2">
          <MessageSquare size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          Voir le message du demandeur
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-text-1">{reservation.messageAmorce}</p>
      </details>

      <HistoriqueTransitions entrees={journal} identites={identites} />

      <BoutonsProprietaireReservation
        reservationId={reservation.id}
        statut={reservation.statut}
        cheminRevalidation="/profil/demandes-reservations"
      />
    </Card>
  );
}
