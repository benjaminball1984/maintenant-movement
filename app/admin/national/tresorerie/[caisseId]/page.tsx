import { BoutonsTransactionSortante } from '@/components/admin/tresorerie/BoutonsTransactionSortante';
import { FormulaireInitierReversement } from '@/components/admin/tresorerie/FormulaireInitierReversement';
import { LienJustificatif } from '@/components/admin/tresorerie/LienJustificatif';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { chargerCaissePourDetail } from '@/lib/admin/tresorerie';
import { calculerSoldeCaisse } from '@/lib/caisse-solde';
import { formaterDateMoyenne } from '@/lib/format-date';
import {
  chargerIdentitesAffichables,
  nomAffichageRespectantVisibilite,
} from '@/lib/reseau/identite';
import { ArrowDownToLine, FileText, Inbox, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

/**
 * Page de détail d'une caisse (cycle V2 V2.3.18).
 *
 * Lecture seule. Trois sections :
 * 1. Entête : type, libellé, objet rattaché, statut, dates d'ouverture/fermeture.
 * 2. Réceptacles : historique daté (canaux euro / 99-coin, identifiants,
 *    validité). Le plus récent en haut.
 * 3. Transactions sortantes : liste triée par date d'initiation (plus
 *    récent en haut), avec montant, bénéficiaire, motif, statut,
 *    justificatif (placeholder en attendant le bucket Storage).
 *
 * Pas d'UI d'écriture ici : les actions (poser réceptacle, initier
 * transaction, confirmer transaction) attendent le bucket `justificatifs`
 * et le composant `ChampDocument` (cf. manifest V2.3.10).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ caisseId: string }>;
}): Promise<Metadata> {
  const { caisseId } = await params;
  const detail = await chargerCaissePourDetail(caisseId);
  return {
    title: detail !== null ? `Caisse — ${detail.caisse.libelle}` : 'Caisse introuvable',
    description: 'Détail d’une caisse de trésorerie : réceptacles + transactions sortantes.',
  };
}

export default async function PageDetailCaisse({
  params,
}: {
  params: Promise<{ caisseId: string }>;
}) {
  const { caisseId } = await params;
  const detail = await chargerCaissePourDetail(caisseId);
  if (detail === null) notFound();

  const { caisse, receptacles, entrees, transactions } = detail;
  const solde = await calculerSoldeCaisse(caisseId);

  const idsPersonnes = new Set<string>();
  for (const t of transactions) {
    if (t.beneficiairePersonneId !== null) idsPersonnes.add(t.beneficiairePersonneId);
    idsPersonnes.add(t.initiePersonneId);
  }
  for (const e of entrees) {
    if (e.payeurPersonneId !== null) idsPersonnes.add(e.payeurPersonneId);
  }
  const identitesParId = await chargerIdentitesAffichables([...idsPersonnes]);

  return (
    <>
      <p className="text-sm text-text-3">
        <Link href="/admin/national/tresorerie" className="hover:text-brand">
          ← Trésorerie
        </Link>
      </p>
      <Heading niveau={1} className="mt-2">
        {caisse.libelle}
      </Heading>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="default">{LIBELLE_TYPE_CAISSE[caisse.typeCaisse]}</Badge>
        <Badge variant={STATUT_VARIANT[caisse.statut]}>
          {LIBELLE_STATUT_CAISSE[caisse.statut]}
        </Badge>
        {caisse.objetType !== null ? (
          <Badge variant="info">
            Objet : {caisse.objetType} (ID {caisse.objetId?.slice(0, 8) ?? '—'}…)
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-text-3">
        Ouverte le {formaterDateMoyenne(caisse.ouverteLe)}
        {caisse.fermeeLe !== null ? ` · fermée le ${formaterDateMoyenne(caisse.fermeeLe)}` : ''}
      </p>

      <section className="mt-6 grid gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-2">
        <div>
          <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Solde €</p>
          <p className="mt-1 font-display font-bold text-2xl text-text-1">
            {FORMATEUR_EURO.format(solde.euro.solde)}
          </p>
          <p className="text-text-3 text-xs">
            {FORMATEUR_EURO.format(solde.euro.entrees)} entrées −{' '}
            {FORMATEUR_EURO.format(solde.euro.sorties)} sorties
          </p>
        </div>
        <div>
          <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Solde 99-coin</p>
          <p className="mt-1 font-display font-bold text-2xl text-text-1">
            {solde.coin99.solde.toLocaleString('fr-FR')} 99c
          </p>
          <p className="text-text-3 text-xs">
            {solde.coin99.entrees.toLocaleString('fr-FR')} entrées −{' '}
            {solde.coin99.sorties.toLocaleString('fr-FR')} sorties
          </p>
        </div>
      </section>

      <Alert variant="warning" titre="Rappel D12bis" className="mt-6">
        Toute transaction sortante exige un <strong>justificatif obligatoire</strong>. L’UI
        d’initiation viendra dans un chantier dédié (bucket Storage `justificatifs` + composant
        ChampDocument).
      </Alert>

      <section className="mt-8">
        <Heading niveau={2}>
          <Inbox size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Réceptacles ({receptacles.length})
        </Heading>
        <p className="mt-1 text-sm text-text-3">
          Historique des canaux d’encaissement (euro Stripe, 99-coin Polygon). Un réceptacle courant
          par canal max (le suivant ferme le précédent en posant `valide_au`).
        </p>
        {receptacles.length === 0 ? (
          <p className="mt-4 text-sm text-text-2">Aucun réceptacle posé pour le moment.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {receptacles.map((r) => (
              <li key={r.id}>
                <Card variant="ombre" className="grid gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="sr-only">Canal : </span>
                      <Badge variant={r.canal === 'euro' ? 'default' : 'info'}>
                        {r.canal === 'euro' ? 'Euro (Stripe)' : '99-coin (Polygon)'}
                      </Badge>
                      <span className="sr-only">Statut : </span>
                      <Badge variant={r.valideAu === null ? 'success' : 'default'}>
                        {r.valideAu === null ? 'Actif' : 'Fermé'}
                      </Badge>
                    </div>
                    <span className="text-text-3 text-xs">
                      Du {formaterDateMoyenne(r.valideDu)}
                      {r.valideAu !== null ? ` → au ${formaterDateMoyenne(r.valideAu)}` : ''}
                    </span>
                  </div>
                  <p className="break-all font-mono text-sm text-text-1">
                    {r.identifiantReceptacle}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <Heading niveau={2}>
          <ArrowDownToLine size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Entrées ({entrees.length})
        </Heading>
        <p className="mt-1 text-sm text-text-3">
          Versements reçus dans cette caisse (dons, adhésions, cotisations). 200 derniers.
        </p>
        {entrees.length === 0 ? (
          <p className="mt-4 text-sm text-text-2">Aucune entrée pour le moment.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {entrees.map((e) => (
              <li key={e.id}>
                <Card variant="ombre" className="grid gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="sr-only">Statut : </span>
                      <Badge variant={LIBELLE_STATUT_ENTREE[e.statut].variant}>
                        {LIBELLE_STATUT_ENTREE[e.statut].libelle}
                      </Badge>
                      <span className="sr-only">Source : </span>
                      <Badge variant="default">{LIBELLE_SOURCE[e.sourceType]}</Badge>
                      <span className="sr-only">Canal : </span>
                      <Badge variant="info">{e.canal === 'euro' ? '€' : '99c'}</Badge>
                    </div>
                    <span className="font-display font-bold text-lg text-text-1">
                      <span className="sr-only">Montant : </span>
                      {formaterMontant(e.montant, e.canal)}
                    </span>
                  </div>
                  <p className="text-sm text-text-2">
                    <strong>Payeur :</strong>{' '}
                    {e.payeurPersonneId !== null
                      ? nomAffichageRespectantVisibilite(identitesParId.get(e.payeurPersonneId))
                      : (e.payeurExterneNom ??
                        (e.payeurExterneEmail !== null ? e.payeurExterneEmail : 'Anonyme'))}
                  </p>
                  {e.motif !== null ? <p className="text-sm text-text-3">{e.motif}</p> : null}
                  <p className="text-text-3 text-xs">Reçue le {formaterDateMoyenne(e.recueLe)}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <Heading niveau={2}>
          <Wallet size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Initier un reversement
        </Heading>
        <div className="mt-4">
          <FormulaireInitierReversement
            caisseId={caisse.id}
            receptaclesActifs={receptacles
              .filter((r) => r.valideAu === null)
              .map((r) => ({
                id: r.id,
                canal: r.canal,
                identifiantReceptacle: r.identifiantReceptacle,
              }))}
          />
        </div>
      </section>

      <section className="mt-8">
        <Heading niveau={2}>
          <Wallet size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Transactions sortantes ({transactions.length})
        </Heading>
        <p className="mt-1 text-sm text-text-3">
          Reversements depuis cette caisse (D12). Triés par date d’initiation, plus récents en haut.
        </p>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-text-2">Aucune transaction sortante pour le moment.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {transactions.map((t) => (
              <li key={t.id}>
                <Card variant="ombre" className="grid gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="sr-only">Statut : </span>
                      <Badge variant={STATUT_TX_VARIANT[t.statut]}>
                        {LIBELLE_STATUT_TX[t.statut]}
                      </Badge>
                      <span className="sr-only">Canal : </span>
                      <Badge variant="default">{t.canal === 'euro' ? '€' : '99c'}</Badge>
                    </div>
                    <span className="font-display font-bold text-lg text-text-1">
                      <span className="sr-only">Montant : </span>
                      {formaterMontant(t.montant, t.canal)}
                    </span>
                  </div>
                  <p className="text-sm text-text-2">
                    <strong>Bénéficiaire :</strong>{' '}
                    {t.beneficiairePersonneId !== null
                      ? nomAffichageRespectantVisibilite(
                          identitesParId.get(t.beneficiairePersonneId),
                        )
                      : (t.beneficiaireExterneNom ?? '—')}
                    {t.beneficiaireExterneIbanOuWallet !== null
                      ? ` (${t.beneficiaireExterneIbanOuWallet})`
                      : ''}
                  </p>
                  <p className="text-sm text-text-2">
                    <strong>Motif :</strong> {t.motif}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-text-3">
                    <FileText size={14} aria-hidden="true" />
                    Justificatif :{' '}
                    <LienJustificatif
                      cheminBucket={t.justificatifStoragePath}
                      nomOriginal={t.justificatifNomOriginal}
                    />
                    <span className="text-text-3 text-xs">({t.justificatifMimeType})</span>
                  </p>
                  <p className="text-text-3 text-xs">
                    Initiée le {formaterDateMoyenne(t.initieLe)} par{' '}
                    {nomAffichageRespectantVisibilite(identitesParId.get(t.initiePersonneId))}
                    {t.confirmeLe !== null
                      ? ` · confirmée le ${formaterDateMoyenne(t.confirmeLe)}`
                      : ''}
                  </p>
                  {t.statut === 'initiee' ? (
                    <BoutonsTransactionSortante transactionId={t.id} caisseId={caisse.id} />
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

const LIBELLE_TYPE_CAISSE = {
  adhesion: 'Adhésion',
  cotisation_solidaire: 'Cotisation solidaire',
  don_general: 'Don général',
  cagnotte: 'Cagnotte',
  autre: 'Autre',
} as const;

const LIBELLE_STATUT_CAISSE = {
  ouverte: 'Ouverte',
  suspendue: 'Suspendue',
  fermee: 'Fermée',
} as const;

const STATUT_VARIANT = {
  ouverte: 'success',
  suspendue: 'warning',
  fermee: 'default',
} as const;

const LIBELLE_STATUT_TX = {
  initiee: 'Initiée',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
  litige: 'Litige',
} as const;

const LIBELLE_STATUT_ENTREE = {
  initiee: { libelle: 'Initiée', variant: 'warning' as const },
  confirmee: { libelle: 'Confirmée', variant: 'success' as const },
  remboursee: { libelle: 'Remboursée', variant: 'default' as const },
  annulee: { libelle: 'Annulée', variant: 'default' as const },
} as const;

const LIBELLE_SOURCE = {
  don: 'Don',
  adhesion: 'Adhésion',
  cagnotte: 'Cagnotte',
  cotisation_solidaire: 'Cotisation',
  autre: 'Autre',
  regularisation_manuelle: 'Régularisation',
} as const;

const STATUT_TX_VARIANT = {
  initiee: 'warning',
  confirmee: 'success',
  annulee: 'default',
  litige: 'danger',
} as const;

const FORMATEUR_EURO = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

function formaterMontant(montant: number, canal: 'euro' | '99_coin'): string {
  if (Number.isNaN(montant)) return `${montant} ${canal === 'euro' ? '€' : '99c'}`;
  if (canal === 'euro') return FORMATEUR_EURO.format(montant);
  return `${montant.toLocaleString('fr-FR')} 99c`;
}
