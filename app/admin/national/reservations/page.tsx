import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { type OptionsListeReservations, listerReservationsAdmin } from '@/lib/admin/reservations';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterDateHeure } from '@/lib/format-date';
import { compter } from '@/lib/pluriel';
import { tronquerCaracteres } from '@/lib/texte-apercu';
import { CalendarRange, Inbox } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réservations — Admin',
};

const STATUTS: Array<{
  value: NonNullable<OptionsListeReservations['statut']>;
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'default';
}> = [
  { value: 'tous', label: 'Tous', variant: 'default' },
  { value: 'proposee', label: 'Proposées', variant: 'warning' },
  { value: 'acceptee', label: 'Acceptées', variant: 'success' },
  { value: 'refusee', label: 'Refusées', variant: 'danger' },
  { value: 'realisee', label: 'Réalisées', variant: 'success' },
  { value: 'confirmee', label: 'Confirmées', variant: 'success' },
  { value: 'annulee', label: 'Annulées', variant: 'default' },
  { value: 'litige', label: 'En litige', variant: 'danger' },
];

/** Libellés humains au singulier pour l'affichage d'un statut de réservation (badge). */
const LIBELLE_STATUT: Record<string, string> = {
  proposee: 'Proposée',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  realisee: 'Réalisée',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
  litige: 'Litige',
};

const TYPES_OFFRE: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tous types' },
  { value: 'offre_entraide', label: 'Entraide' },
  { value: 'service_sel', label: 'SEL' },
  { value: 'produit_marche', label: 'Marché' },
  { value: 'hebergement', label: 'Hébergement' },
  { value: 'transport', label: 'Transport' },
  { value: 'pret_objet', label: 'Prêt' },
];

interface Props {
  searchParams: Promise<{ q?: string; statut?: string; type?: string }>;
}

/**
 * Page `/admin/national/reservations` (V2.4.60).
 *
 * Liste les réservations toutes confondues avec filtres statut + type
 * d'offre. Permet à un admin de voir l'activité de réservation globale,
 * en plus de la console litiges (`/admin/moderation/reservations`).
 */
export default async function PageAdminReservations({ searchParams }: Props) {
  const sp = await searchParams;
  const motCle = sp.q?.trim() ?? '';
  const statutFiltre = (STATUTS.find((s) => s.value === sp.statut)?.value ?? 'tous') as
    | 'tous'
    | 'proposee'
    | 'acceptee'
    | 'refusee'
    | 'realisee'
    | 'confirmee'
    | 'annulee'
    | 'litige';
  const typeFiltre = TYPES_OFFRE.find((t) => t.value === sp.type)?.value ?? '';

  const reservations = await listerReservationsAdmin({
    motCle: motCle === '' ? undefined : motCle,
    statut: statutFiltre,
    offreType: typeFiltre === '' ? undefined : typeFiltre,
  });
  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.reservations.titre', { valeurMd: 'Réservations' }),
    lireContenuEditorial('admin.national.reservations.intro', {
      valeurMd:
        'Liste des réservations tous statuts confondus. Pour gérer les litiges spécifiquement, voir',
    }),
  ]);

  return (
    <>
      <Heading niveau={1}>
        <Inbox size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="admin.national.reservations.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console reservations admin"
          longueurMax={40}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        <TexteEditableAdmin
          cle="admin.national.reservations.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro console reservations admin"
          multilignes
          longueurMax={300}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>{' '}
        <a href="/admin/moderation/reservations" className="text-brand hover:underline">
          /admin/moderation/reservations
        </a>
        .
      </p>

      <form
        method="get"
        action="/admin/national/reservations"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={motCle}
          placeholder="message d'amorce…"
          aria-label="Rechercher une réservation"
          className="rounded-md border border-border bg-surface p-2"
        />
        <select
          name="statut"
          defaultValue={statutFiltre}
          aria-label="Filtrer par statut"
          className="rounded-md border border-border bg-surface p-2"
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={typeFiltre}
          aria-label="Filtrer par type"
          className="rounded-md border border-border bg-surface p-2"
        >
          {TYPES_OFFRE.map((t) => (
            <option key={t.value || 'all'} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 font-bold text-white hover:brightness-110"
        >
          Filtrer
        </button>
      </form>

      <p className="mt-4 text-text-3 text-xs">{compter(reservations.length, 'résultat')}</p>

      {reservations.length === 0 ? (
        <Alert variant="info" titre="Aucune réservation" className="mt-3">
          Aucune réservation ne correspond aux critères.
        </Alert>
      ) : (
        <ul className="mt-3 grid gap-2">
          {reservations.map((r) => {
            const variantBadge = STATUTS.find((s) => s.value === r.statut)?.variant ?? 'default';
            return (
              <li key={r.id}>
                <Card variant="ombre" className="grid gap-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-text-2 text-sm">
                        {tronquerCaracteres(r.messageAmorce, 240)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant={variantBadge}>{LIBELLE_STATUT[r.statut] ?? r.statut}</Badge>
                      <Badge variant="info">
                        {TYPES_OFFRE.find((t) => t.value === r.offreType)?.label ?? r.offreType}
                      </Badge>
                      {r.quantite > 1 ? <Badge variant="default">×{r.quantite}</Badge> : null}
                    </div>
                  </div>
                  {r.motifDecision !== null ? (
                    <p className="text-text-3 text-xs">
                      <strong>Motif :</strong> {r.motifDecision}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 text-text-3 text-xs">
                    {r.debut !== null ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarRange size={12} aria-hidden="true" />
                        {formaterDateHeure(r.debut)}
                        {r.fin !== null ? ` → ${formaterDateHeure(r.fin)}` : ''}
                      </span>
                    ) : null}
                    <span>· créée le {formaterDateHeure(r.createdAt)}</span>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
