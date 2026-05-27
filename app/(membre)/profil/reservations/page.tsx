import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { BoutonAnnulerReservation } from '@/components/reservation/BoutonAnnulerReservation';
import { BoutonConfirmerReservation } from '@/components/reservation/BoutonConfirmerReservation';
import { BoutonSignalerLitigeReservation } from '@/components/reservation/BoutonSignalerLitigeReservation';
import { HistoriqueTransitions } from '@/components/reservation/HistoriqueTransitions';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSessionOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { type IdentiteAffichee, chargerIdentitesAffichables } from '@/lib/reseau/identite';
import {
  type EntreeJournalReservation,
  type OffreTypeReservation,
  type StatutReservation,
  listerJournauxReservations,
  listerReservationsDuDemandeur,
  transitionAutorisee,
} from '@/lib/reservation';
import {
  STATUTS_FILTRES_RESERVATION,
  TYPES_FILTRES_OFFRE,
  estFiltreStatutValide,
  estFiltreTypeValide,
} from '@/lib/reservation-filtres';
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
  searchParams: Promise<{ statut?: string; type?: string }>;
}) {
  const session = await getSessionOuRediriger('/profil/reservations');
  const { statut: statutBrut, type: typeBrut } = await searchParams;
  const filtreActif: StatutReservation | null = estFiltreStatutValide(statutBrut)
    ? statutBrut
    : null;
  const filtreTypeActif: OffreTypeReservation | null = estFiltreTypeValide(typeBrut)
    ? typeBrut
    : null;

  const toutes = await listerReservationsDuDemandeur(session.userId);
  const reservations = toutes.filter(
    (r) =>
      (filtreActif === null || r.statut === filtreActif) &&
      (filtreTypeActif === null || r.offreType === filtreTypeActif),
  );

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

  const compteursTypes = new Map<OffreTypeReservation, number>();
  for (const r of toutes)
    compteursTypes.set(r.offreType, (compteursTypes.get(r.offreType) ?? 0) + 1);

  function urlFiltre(statut: string | null, type: string | null): string {
    const params = new URLSearchParams();
    if (statut !== null && statut !== 'tous') params.set('statut', statut);
    if (type !== null && type !== 'tous') params.set('type', type);
    const qs = params.toString();
    return qs === '' ? '/profil/reservations' : `/profil/reservations?${qs}`;
  }

  const [estAdmin, titre, intro, emptyAucune, emptyFiltre, demandeeLe, motifLabel, voirMessage] =
    await Promise.all([
      estAdminCourant(),
      lireContenuEditorial('profil.reservations.titre', { valeurMd: 'Mes réservations' }),
      lireContenuEditorial('profil.reservations.intro', {
        valeurMd:
          'Les demandes que tu as envoyées pour du covoiturage, hébergement, prêt, service SEL ou location mutualisée. Les propriétaires d’offres voient leurs demandes reçues depuis leur propre tableau de bord.',
      }),
      lireContenuEditorial('profil.reservations.empty_aucune', {
        valeurMd:
          'Aucune réservation pour le moment. Quand tu demanderas une offre d’entraide, elle apparaîtra ici avec son statut et le message envoyé.',
      }),
      lireContenuEditorial('profil.reservations.empty_filtre', {
        valeurMd: 'Aucune réservation pour ce filtre. Choisis « Tous » pour voir l’ensemble.',
      }),
      lireContenuEditorial('profil.reservations.demandee_le', { valeurMd: 'Demandée le' }),
      lireContenuEditorial('profil.reservations.motif_label', { valeurMd: 'Motif :' }),
      lireContenuEditorial('profil.reservations.voir_message', {
        valeurMd: 'Voir le message envoyé',
      }),
    ]);

  return (
    <Container taille="md" className="py-12">
      <TexteEditableAdmin
        cle="profil.reservations.titre"
        valeurInitiale={titre.valeurMd}
        estAdmin={estAdmin}
        libelle="titre page mes reservations"
        longueurMax={40}
      >
        {(t) => <Heading niveau={1}>{t}</Heading>}
      </TexteEditableAdmin>
      <TexteEditableAdmin
        cle="profil.reservations.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro page mes reservations"
        multilignes
        longueurMax={400}
      >
        {(t) => <p className="mt-2 text-text-2">{t}</p>}
      </TexteEditableAdmin>

      {toutes.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3 border-border border-b pb-3">
          <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
            {STATUTS_FILTRES_RESERVATION.map((f) => {
              const n =
                f.slug === 'tous'
                  ? toutes.length
                  : (compteurs.get(f.slug as StatutReservation) ?? 0);
              const estActif =
                (filtreActif === null && f.slug === 'tous') || filtreActif === f.slug;
              return (
                <Link
                  key={f.slug}
                  href={urlFiltre(f.slug, filtreTypeActif)}
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
          <nav aria-label="Filtrer par type d'offre" className="flex flex-wrap gap-2">
            {TYPES_FILTRES_OFFRE.map((f) => {
              const n =
                f.slug === 'tous'
                  ? toutes.length
                  : (compteursTypes.get(f.slug as OffreTypeReservation) ?? 0);
              if (n === 0 && f.slug !== 'tous') return null;
              const estActif =
                (filtreTypeActif === null && f.slug === 'tous') || filtreTypeActif === f.slug;
              return (
                <Link
                  key={f.slug}
                  href={urlFiltre(filtreActif, f.slug)}
                  className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                    estActif
                      ? 'border-brand bg-brand text-bg'
                      : 'border-border bg-surface text-text-3 hover:bg-surface-2'
                  }`}
                  aria-current={estActif ? 'page' : undefined}
                >
                  {f.libelle} ({n})
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}

      {reservations.length === 0 ? (
        <Card variant="ombre" className="mt-8">
          {toutes.length === 0 ? (
            <TexteEditableAdmin
              cle="profil.reservations.empty_aucune"
              valeurInitiale={emptyAucune.valeurMd}
              estAdmin={estAdmin}
              libelle="empty state quand aucune reservation"
              multilignes
              longueurMax={300}
            >
              {(t) => <p className="text-text-2">{t}</p>}
            </TexteEditableAdmin>
          ) : (
            <TexteEditableAdmin
              cle="profil.reservations.empty_filtre"
              valeurInitiale={emptyFiltre.valeurMd}
              estAdmin={estAdmin}
              libelle="empty state quand filtre ne renvoie rien"
              multilignes
              longueurMax={200}
            >
              {(t) => <p className="text-text-2">{t}</p>}
            </TexteEditableAdmin>
          )}
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
                demandeeLe={demandeeLe.valeurMd}
                motifLabel={motifLabel.valeurMd}
                voirMessage={voirMessage.valeurMd}
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
  demandeeLe,
  motifLabel,
  voirMessage,
}: {
  reservation: import('@/lib/reservation').Reservation;
  titreOffre: { titre: string; cheminPage: string | null } | null;
  journal: EntreeJournalReservation[];
  identites: Map<string, IdentiteAffichee>;
  demandeeLe: string;
  motifLabel: string;
  voirMessage: string;
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
          {demandeeLe} {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}
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
          <strong>{motifLabel}</strong> {reservation.motifDecision}
        </p>
      ) : null}

      <details className="rounded-md border border-border bg-surface-2 p-3 text-sm">
        <summary className="cursor-pointer text-text-2">
          <MessageSquare size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          {voirMessage}
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
