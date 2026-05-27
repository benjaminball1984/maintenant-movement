import { Alert, Badge, Card, Heading } from '@/components/ui';
import { listerCaissesPourDashboard } from '@/lib/admin/tresorerie';
import { Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trésorerie',
};

/**
 * Dashboard trésorerie en LECTURE SEULE (cycle V2 V2.3.10).
 *
 * Liste les caisses (V2.2.3) avec leur type, statut, nombre de
 * réceptacles actifs et de transactions sortantes. La création de
 * caisse, la pose de réceptacle et l'initiation de reversement passent
 * par les helpers `lib/caisse.ts` (V2.2.3) ; l'UI complète d'écriture
 * (formulaires + Server Actions + upload de justificatif) sera un
 * chantier dédié.
 *
 * Garde d'accès : layout `/admin/national/` protégé par
 * `garantirAdminNational`. Quand la matrice de droits V2 sera branchée,
 * on pourra étendre l'accès aux trésorier·ière·s cooptés (droit
 * atomique `gerer_caisse`).
 */
export default async function PageDashboardTresorerie() {
  const caisses = await listerCaissesPourDashboard();

  return (
    <section className="grid gap-6">
      <header className="flex items-start gap-3">
        <Wallet size={28} className="mt-1 text-brand" aria-hidden="true" />
        <div>
          <Heading niveau={1} apparenceComme={2}>
            Trésorerie
          </Heading>
          <p className="mt-1 text-text-2">
            Lecture seule des caisses (régime B), des réceptacles datés et des reversements. Les
            actions (créer une caisse, poser un réceptacle, initier un reversement) viendront dans
            un chantier dédié — les helpers techniques sont prêts (cf. <code>lib/caisse.ts</code>
            posé en V2.2.3).
          </p>
        </div>
      </header>

      {caisses.length === 0 ? (
        <Alert variant="info" titre="Aucune caisse pour le moment">
          La table <code>caisse</code> est vide. Une fois la migration V2.2.3 appliquée au distant
          et une première caisse créée via Server Action, elle apparaîtra ici.
        </Alert>
      ) : (
        <ul className="grid gap-4">
          {caisses.map((ligne) => (
            <li key={ligne.caisse.id}>
              <CarteCaisse ligne={ligne} />
            </li>
          ))}
        </ul>
      )}

      <Alert variant="info" titre="Rappel D12bis (justificatif obligatoire)">
        Toute transaction sortante exige un justificatif (CHECK SQL côté
        <code> transaction_sortante</code>). Aucune sortie ne peut être créée sans pièce attachée
        (PDF, JPEG, PNG ou WebP).
      </Alert>
    </section>
  );
}

const VARIANT_STATUT = {
  ouverte: 'success',
  suspendue: 'warning',
  fermee: 'default',
} as const;

const LIBELLE_TYPE_CAISSE = {
  adhesion: 'Adhésions',
  cotisation_solidaire: 'Cotisations solidaires',
  don_general: 'Dons généraux',
  cagnotte: 'Cagnotte',
  autre: 'Autre',
} as const;

function CarteCaisse({
  ligne,
}: {
  ligne: import('@/lib/admin/tresorerie').CaisseEnrichie;
}) {
  const { caisse, nbReceptaclesActifs, nbTransactionsSortantes, derniereTransactionLe } = ligne;

  return (
    <Card variant="ombre" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">{LIBELLE_TYPE_CAISSE[caisse.typeCaisse]}</Badge>
          <Badge variant={VARIANT_STATUT[caisse.statut]}>{caisse.statut}</Badge>
        </div>
        <span className="text-text-3 text-xs">
          Ouverte le {new Date(caisse.ouverteLe).toLocaleDateString('fr-FR')}
        </span>
      </div>

      <h2 className="font-display font-bold text-lg text-text-1">
        <Link href={`/admin/national/tresorerie/${caisse.id}`} className="hover:text-brand">
          {caisse.libelle}
        </Link>
      </h2>

      {caisse.objetType !== null ? (
        <p className="text-sm text-text-3">
          Rattachée à : <code>{caisse.objetType}</code> · <code>{caisse.objetId}</code>
        </p>
      ) : (
        <p className="text-sm text-text-3">Caisse globale (non rattachée à un objet précis).</p>
      )}

      <dl className="mt-1 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-md border border-border bg-surface-2 p-3">
          <dt className="font-bold text-text-3 text-xs uppercase tracking-cap">
            Réceptacles actifs
          </dt>
          <dd className="mt-1 font-mono text-lg text-text-1">{nbReceptaclesActifs}</dd>
          <p className="mt-1 text-text-3 text-xs">euros + 99-coin confondus</p>
        </div>
        <div className="rounded-md border border-border bg-surface-2 p-3">
          <dt className="font-bold text-text-3 text-xs uppercase tracking-cap">
            Transactions sortantes
          </dt>
          <dd className="mt-1 font-mono text-lg text-text-1">{nbTransactionsSortantes}</dd>
          <p className="mt-1 text-text-3 text-xs">avec justificatif obligatoire</p>
        </div>
        <div className="rounded-md border border-border bg-surface-2 p-3">
          <dt className="font-bold text-text-3 text-xs uppercase tracking-cap">Dernière sortie</dt>
          <dd className="mt-1 text-sm text-text-1">
            {derniereTransactionLe !== null
              ? new Date(derniereTransactionLe).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
