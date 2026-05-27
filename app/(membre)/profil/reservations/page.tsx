import { BoutonAnnulerReservation } from '@/components/reservation/BoutonAnnulerReservation';
import { BoutonConfirmerReservation } from '@/components/reservation/BoutonConfirmerReservation';
import { BoutonSignalerLitigeReservation } from '@/components/reservation/BoutonSignalerLitigeReservation';
import { HistoriqueTransitions } from '@/components/reservation/HistoriqueTransitions';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import { type IdentiteAffichee, chargerIdentitesAffichables } from '@/lib/reseau/identite';
import {
  type EntreeJournalReservation,
  type StatutReservation,
  listerJournauxReservations,
  listerReservationsDuDemandeur,
  transitionAutorisee,
} from '@/lib/reservation';
import { STATUTS_FILTRES_RESERVATION, estFiltreStatutValide } from '@/lib/reservation-filtres';
import { chargerTitresOffres } from '@/lib/reservation-titres';
import { CalendarRange, MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mes réservations',
  description:
    'Liste des réservations que j’ai demandées (covoiturage, hébergement, prêt, SEL, location mutualisée).',
};

/**
 * Page « Mes réservations » (cycle V2 V2.3.9).
 *
 * Liste les réservations dont la personne connectée est demandeuse.
 * S'appuie sur `listerReservationsDuDemandeur` (V2.2.2) et
 * `chargerTitresOffres` (jointure polymorphe manuelle V2.3.9).
 *
 * UI volontairement compacte : statut sous forme de Badge coloré, lien
 * vers l'offre si disponible, message d'amorce en aperçu replié.
 *
 * Le dashboard symétrique « En tant que propriétaire d'offre » (lister
 * les réservations qu'on reçoit) sera un chantier dédié — demande aussi
 * la jointure côté offre, donc soit on filtre par `offre_id IN (mes
 * offres)`, soit on agrège différemment.
 */
export default async function PageMesReservations({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const session = await getSessionOuRediriger('/profil/reservations');
  const { statut: statutBrut } = await searchParams;
  const filtreActif: StatutReservation | null = estFiltreStatutValide(statutBrut)
    ? statutBrut
    : null;

  const toutes = await listerReservationsDuDemandeur(session.userId);
  const reservations =
    filtreActif === null ? toutes : toutes.filter((r) => r.statut === filtreActif);

  const [titresParId, journauxParId] = await Promise.all([
    chargerTitresOffres(reservations),
    listerJournauxReservations(reservations.map((r) => r.id)),
  ]);

  const idsAuteurs = new Set<string>();
  for (const lignes of journauxParId.values()) {
    for (const l of lignes) {
      if (l.auteurId !== null) idsAuteurs.add(l.auteurId);
    }
  }
  const identitesParId = await chargerIdentitesAffichables([...idsAuteurs]);

  const compteurs = new Map<StatutReservation, number>();
  for (const r of toutes) compteurs.set(r.statut, (compteurs.get(r.statut) ?? 0) + 1);

  return (
    <Container taille="md" className="py-12">
      <Heading niveau={1}>Mes réservations</Heading>
      <p className="mt-2 text-text-2">
        Les demandes que tu as envoyées pour du covoiturage, hébergement, prêt, service SEL ou
        location mutualisée. Les propriétaires d’offres voient leurs demandes reçues depuis leur
        propre tableau de bord.
      </p>

      {toutes.length > 0 ? (
        <nav
          aria-label="Filtrer par statut"
          className="mt-6 flex flex-wrap gap-2 border-border border-b pb-3"
        >
          {STATUTS_FILTRES_RESERVATION.map((f) => {
            const n =
              f.slug === 'tous' ? toutes.length : (compteurs.get(f.slug as StatutReservation) ?? 0);
            const estActif = (filtreActif === null && f.slug === 'tous') || filtreActif === f.slug;
            return (
              <Link
                key={f.slug}
                href={
                  f.slug === 'tous'
                    ? '/profil/reservations'
                    : `/profil/reservations?statut=${f.slug}`
                }
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  estActif
                    ? 'border-brand bg-brand text-bg'
                    : 'border-border bg-surface text-text-2 hover:bg-surface-2'
                }`}
                aria-current={estActif ? 'page' : undefined}
              >
                {f.libelle} ({n})
              </Link>
            );
          })}
        </nav>
      ) : null}

      {reservations.length === 0 ? (
        <Card variant="ombre" className="mt-8">
          <p className="text-text-2">
            {toutes.length === 0
              ? 'Aucune réservation pour le moment. Quand tu demanderas une offre d’entraide, elle apparaîtra ici avec son statut et le message envoyé.'
              : 'Aucune réservation pour ce filtre. Choisis « Tous » pour voir l’ensemble.'}
          </p>
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              <CarteReservation
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
  proposee: 'Proposée',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  realisee: 'Réalisée',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
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

function CarteReservation({
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
  const variantStatut = VARIANT_STATUT[reservation.statut];
  const titreAffiche = titreOffre?.titre ?? '(offre non trouvée)';

  return (
    <Card variant="ombre" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">{LIBELLE_TYPE_OFFRE[reservation.offreType]}</Badge>
          <Badge variant={variantStatut}>{LIBELLE_STATUT[reservation.statut]}</Badge>
        </div>
        <span className="text-text-3 text-xs">
          Demandée le {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}
        </span>
      </div>

      <h2 className="font-display font-bold text-lg text-text-1">
        {titreOffre?.cheminPage !== undefined && titreOffre?.cheminPage !== null ? (
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

      {reservation.motifDecision !== null ? (
        <p className="text-sm text-text-3">
          <strong>Motif :</strong> {reservation.motifDecision}
        </p>
      ) : null}

      <details className="rounded-md border border-border bg-surface-2 p-3 text-sm">
        <summary className="cursor-pointer text-text-2">
          <MessageSquare size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          Voir le message envoyé
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-text-1">{reservation.messageAmorce}</p>
      </details>

      <HistoriqueTransitions entrees={journal} identites={identites} />

      {transitionAutorisee(reservation.statut, 'confirmee') ? (
        <BoutonConfirmerReservation
          reservationId={reservation.id}
          cheminRevalidation="/profil/reservations"
        />
      ) : null}
      {reservation.statut === 'realisee' && transitionAutorisee(reservation.statut, 'litige') ? (
        <BoutonSignalerLitigeReservation
          reservationId={reservation.id}
          cheminRevalidation="/profil/reservations"
        />
      ) : null}
      {transitionAutorisee(reservation.statut, 'annulee') ? (
        <BoutonAnnulerReservation
          reservationId={reservation.id}
          cheminRevalidation="/profil/reservations"
        />
      ) : null}
    </Card>
  );
}
