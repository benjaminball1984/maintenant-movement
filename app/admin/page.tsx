import { Card, Heading } from '@/components/ui';
import { chargerStatsAdmin } from '@/lib/admin/stats';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Console — Vue d’ensemble' };

const FORMAT_NB = new Intl.NumberFormat('fr-FR');
const FORMAT_EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/**
 * Page `/admin` — Tableau de bord admin (chantier 9.2).
 *
 * Cf. spec §9 « Tableau de bord admin : stats globales et par commune
 * + gestion financière + édition pages éditoriales et catégories
 * marché ». Pour 9.2 v1, on couvre les stats globales. La gestion
 * financière fine (génération CSV, reçus fiscaux) et l'édition des
 * pages éditoriales viendront en polish.
 */
export default async function PageAdmin() {
  const stats = await chargerStatsAdmin();

  return (
    <>
      <header className="mb-6">
        <Heading niveau={1}>Vue d'ensemble</Heading>
        <p className="mt-1 text-sm text-text-3">
          Stats globales (rafraîchies à chaque chargement). Filtrage par commune à venir en polish.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Carte titre="Personnes" valeur={FORMAT_NB.format(stats.personnes)} />
        <Carte titre="Adhérent·es actif·ves" valeur={FORMAT_NB.format(stats.adherentsActifs)} />
        <Carte titre="Pétitions publiées" valeur={FORMAT_NB.format(stats.petitionsPubliees)} />
        <Carte
          titre="Mobilisations publiées"
          valeur={FORMAT_NB.format(stats.mobilisationsPubliees)}
        />
        <Carte titre="Cagnottes publiées" valeur={FORMAT_NB.format(stats.cagnottesPubliees)} />
        <Carte
          titre="Euros collectés"
          valeur={FORMAT_EUR.format(stats.totalEurosCollectes / 100)}
        />
        <Carte titre="99-coin reçus" valeur={`${FORMAT_NB.format(stats.totalT99CPCollectes)} u.`} />
        <Carte titre="Services SEL" valeur={FORMAT_NB.format(stats.servicesSel)} />
        <Carte
          titre="Prestations créditées"
          valeur={FORMAT_NB.format(stats.prestationsCreditees)}
        />
        <Carte titre="Produits marché" valeur={FORMAT_NB.format(stats.produitsMarche)} />
        <Carte titre="Moments à venir" valeur={FORMAT_NB.format(stats.momentsAVenir)} />
        <Carte titre="Médias publiés" valeur={FORMAT_NB.format(stats.mediasPublies)} />
        <Carte titre="Sondages ouverts" valeur={FORMAT_NB.format(stats.sondagesOuverts)} />
        <Carte titre="Communes pré-créées" valeur={FORMAT_NB.format(stats.communesPreCreees)} />
        <Carte titre="Mandats assemblée actifs" valeur={FORMAT_NB.format(stats.mandatsAssemblee)} />
      </section>

      <header className="mt-8 mb-4">
        <Heading niveau={2} apparenceComme={3}>
          Indicateurs V2 (trésorerie + réservations + appartenances)
        </Heading>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Carte titre="Caisses ouvertes" valeur={FORMAT_NB.format(stats.caissesOuvertes)} />
        <Carte titre="Solde € caisses" valeur={FORMAT_EUR.format(stats.totalEurosCaisses)} />
        <Carte
          titre="Solde 99-coin caisses"
          valeur={`${FORMAT_NB.format(stats.totalCoin99Caisses)} u.`}
        />
        <Carte
          titre="Reversements initiés"
          valeur={FORMAT_NB.format(stats.transactionsSortantesInitiees)}
        />
        <Carte
          titre="Reversements confirmés"
          valeur={FORMAT_NB.format(stats.transactionsSortantesConfirmees)}
        />
        <Carte titre="Réservations total" valeur={FORMAT_NB.format(stats.reservationsTotal)} />
        <Carte
          titre="Réservations en attente"
          valeur={FORMAT_NB.format(stats.reservationsEnAttente)}
        />
        <Carte
          titre="Réservations en litige"
          valeur={FORMAT_NB.format(stats.reservationsEnLitige)}
        />
        <Carte titre="Membres campagnes" valeur={FORMAT_NB.format(stats.membresCampagnes)} />
        <Carte titre="Membres GT" valeur={FORMAT_NB.format(stats.membresGTs)} />
        <Carte
          titre="Membres groupes entraide"
          valeur={FORMAT_NB.format(stats.membresGroupesEntraide)}
        />
      </section>
    </>
  );
}

function Carte({ titre, valeur }: { titre: string; valeur: string }) {
  return (
    <Card variant="ombre" className="grid gap-1">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">{titre}</p>
      <p className="font-display text-2xl text-text-1">{valeur}</p>
    </Card>
  );
}
