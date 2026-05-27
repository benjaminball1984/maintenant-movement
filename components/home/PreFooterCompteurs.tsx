import { Card } from '@/components/ui';

interface PreFooterCompteursProps {
  /** Inscrit·es newsletter : signataires ayant coché opt-in plateforme. */
  newsletter: number;
  /** Comptes actifs sur le site (adhérent·es + sympathisant·es). */
  membres: number;
  /** Signataires de pétitions (total, incluant les 17 746 importés Base44). */
  signataires: number;
}

/**
 * Bande de 3 compteurs en pré-footer (cf. spec §3).
 *
 * Affiche les chiffres réels du mouvement : membres (count personne
 * actif), signataires (count signature_petition), newsletter (count
 * signature_petition where accepte_newsletter = true).
 */
export function PreFooterCompteurs({ newsletter, membres, signataires }: PreFooterCompteursProps) {
  return (
    <section aria-label="Compteurs du mouvement" className="border-y border-border bg-surface-2">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
        <CompteurCarte libelle="Newsletter" valeur={newsletter} />
        <CompteurCarte libelle="Membres" valeur={membres} />
        <CompteurCarte libelle="Signataires" valeur={signataires} />
      </div>
    </section>
  );
}

function CompteurCarte({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <Card variant="plat" className="text-center">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">{libelle}</p>
      <p className="mt-1 font-display text-4xl font-bold text-text-1">
        {new Intl.NumberFormat('fr-FR').format(valeur)}
      </p>
    </Card>
  );
}
