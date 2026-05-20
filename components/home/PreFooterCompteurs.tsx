import { Card } from '@/components/ui';

interface PreFooterCompteursProps {
  /** Inscrit·es à la newsletter (chantier 8.1 quand opérationnel). */
  newsletter: number;
  /** Comptes actifs sur le site (adhérent·es + sympathisant·es). */
  membres: number;
  /** Signataires de pétitions (chantier 3.1 quand opérationnel). */
  signataires: number;
}

/**
 * Bande de 3 compteurs en pré-footer (cf. spec §3).
 *
 * Pour 2.1, seul `membres` a une vraie valeur (count personne actif).
 * `newsletter` et `signataires` valent 0 tant que les chantiers 8.1 et
 * 3.1 ne sont pas livrés. On ne ment pas : on affiche 0 et on signale
 * « en construction » dans la note du bas.
 *
 * Les chiffres Base44 hérités (946 membres, ~9k newsletter, ~16k
 * signataires) ne sont pas intégrés ici : ils arriveront au chantier
 * 10.1 (script de migration), avec préservation des consentements.
 */
export function PreFooterCompteurs({ newsletter, membres, signataires }: PreFooterCompteursProps) {
  return (
    <section aria-label="Compteurs du mouvement" className="border-y border-border bg-surface-2">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
        <CompteurCarte libelle="Newsletter" valeur={newsletter} />
        <CompteurCarte libelle="Membres" valeur={membres} />
        <CompteurCarte libelle="Signataires" valeur={signataires} />
      </div>
      {(newsletter === 0 || signataires === 0) && (
        <p className="mx-auto max-w-7xl px-4 pb-6 text-center text-xs text-text-3 sm:px-6 lg:px-8">
          Compteurs en construction : la newsletter et les signatures se rempliront avec les
          chantiers 8.1 et 3.1. Les 946 adhérent·es, ~9 000 inscrit·es newsletter et ~16 000
          signataires de Base44 seront importé·es au chantier 10.1.
        </p>
      )}
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
