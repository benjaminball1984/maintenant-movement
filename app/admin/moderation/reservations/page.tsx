import { BoutonsResolutionLitige } from '@/components/admin/moderation/BoutonsResolutionLitige';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { HistoriqueTransitions } from '@/components/reservation/HistoriqueTransitions';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  chargerIdentitesAffichables,
  nomAffichageRespectantVisibilite,
} from '@/lib/reseau/identite';
import { listerJournauxReservations, listerReservationsEnLitige } from '@/lib/reservation';
import { chargerTitresOffres } from '@/lib/reservation-titres';
import { AlertTriangle, CalendarRange, MessageSquare, User } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Modération — Réservations en litige',
  description: 'Liste des réservations signalées en litige par les demandeurs. Arbitrage à rendre.',
};

/**
 * Console admin des réservations en litige (cycle V2 V2.3.17).
 *
 * Liste toutes les réservations dont le statut est `litige` (le bouton
 * « Signaler un litige » V2.3.16 y dirige). Pour chaque réservation, on
 * affiche le journal complet D8bis (V2.3.15) + 2 boutons d'arbitrage
 * « confirmer » (la prestation est réputée réalisée) / « annuler » (la
 * prestation est réputée non réalisée).
 *
 * Le layout `/admin/` (V2.2.1) garantit déjà que la personne est admin
 * ou modérateurice ; on rend la page sans re-vérifier.
 */
export default async function PageModerationReservationsEnLitige() {
  const reservations = await listerReservationsEnLitige();
  const [titresParId, journauxParId, estAdmin, titre, intro] = await Promise.all([
    chargerTitresOffres(reservations),
    listerJournauxReservations(reservations.map((r) => r.id)),
    estAdminCourant(),
    lireContenuEditorial('admin.moderation.reservations.titre', {
      valeurMd: 'Modération — Réservations en litige',
    }),
    lireContenuEditorial('admin.moderation.reservations.intro', {
      valeurMd:
        'Réservations basculées en statut **litige** par leur demandeur (V2.3.16). À arbitrer en lecture du motif et du journal complet (qui a fait quoi, et quand). Décision : confirmer la prestation (en faveur du propriétaire) ou annuler (en faveur du demandeur).',
    }),
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
    <>
      <TexteEditableAdmin
        cle="admin.moderation.reservations.titre"
        valeurInitiale={titre.valeurMd}
        estAdmin={estAdmin}
        libelle="titre console reservations litige"
        longueurMax={60}
      >
        {(t) => <Heading niveau={1}>{t}</Heading>}
      </TexteEditableAdmin>
      <TexteEditableAdmin
        cle="admin.moderation.reservations.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console reservations litige"
        multilignes
        longueurMax={400}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>

      {reservations.length === 0 ? (
        <Alert variant="info" titre="Aucun litige en cours" className="mt-6">
          Tout est calme côté réservations. Reviens ici si un demandeur signale un litige depuis sa
          page « Mes réservations ».
        </Alert>
      ) : (
        <ul className="mt-6 grid gap-4">
          {reservations.map((reservation) => {
            const titreOffre = titresParId.get(reservation.offreId) ?? null;
            const journal = journauxParId.get(reservation.id) ?? [];
            const identiteDemandeur = identitesParId.get(reservation.demandeurPersonneId);
            const numeroDemandeur = identiteDemandeur?.numero ?? null;
            const nomDemandeur = nomAffichageRespectantVisibilite(identiteDemandeur);
            return (
              <li key={reservation.id}>
                <Card variant="ombre" className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="danger">
                        <AlertTriangle size={12} aria-hidden="true" />
                        Litige
                      </Badge>
                      <Badge variant="default">{LIBELLE_TYPE_OFFRE[reservation.offreType]}</Badge>
                    </div>
                    <span className="text-text-3 text-xs">
                      Demandée le {new Date(reservation.createdAt).toLocaleDateString('fr-FR')} ·
                      Litige le {new Date(reservation.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <h2 className="font-display font-bold text-lg text-text-1">
                    {titreOffre?.cheminPage !== null && titreOffre?.cheminPage !== undefined ? (
                      <Link href={titreOffre.cheminPage} className="hover:text-brand">
                        {titreOffre?.titre ?? '(offre supprimée)'}
                      </Link>
                    ) : (
                      (titreOffre?.titre ?? '(offre supprimée)')
                    )}
                  </h2>

                  <div className="flex items-start gap-2 text-sm text-text-2">
                    <CalendarRange size={16} className="mt-0.5 text-text-3" aria-hidden="true" />
                    <span>
                      {FORMATEUR.format(new Date(reservation.creneauDebut))}
                      {reservation.creneauFin !== null
                        ? ` → ${FORMATEUR.format(new Date(reservation.creneauFin))}`
                        : ''}
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
                    <div className="rounded-md border border-danger bg-danger-light p-3 text-sm">
                      <p className="font-medium text-text-1">Motif du litige :</p>
                      <p className="mt-1 text-text-2 italic">« {reservation.motifDecision} »</p>
                    </div>
                  ) : null}

                  <details className="rounded-md border border-border bg-surface-2 p-3 text-sm">
                    <summary className="cursor-pointer text-text-2">
                      <MessageSquare size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
                      Voir le message d’amorce
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap text-text-1">
                      {reservation.messageAmorce}
                    </p>
                  </details>

                  <HistoriqueTransitions entrees={journal} identites={identitesParId} />

                  <BoutonsResolutionLitige
                    reservationId={reservation.id}
                    cheminRevalidation="/admin/moderation/reservations"
                  />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

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
