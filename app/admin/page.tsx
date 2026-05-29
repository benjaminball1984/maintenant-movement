import { Alert, Badge, Card, Heading } from '@/components/ui';
import { chargerCompteursFileModeration } from '@/lib/admin/file-moderation';
import { chargerStatsAdmin } from '@/lib/admin/stats';
import { CheckCircle, Flag } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

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
  const [stats, fileModeration] = await Promise.all([
    chargerStatsAdmin(),
    chargerCompteursFileModeration(),
  ]);
  const totalEnAttente = Object.values(fileModeration).reduce((a, b) => a + b, 0);

  return (
    <>
      <header className="mb-6">
        <Heading niveau={1}>Vue d'ensemble</Heading>
        <p className="mt-1 text-sm text-text-3">
          Stats globales (rafraîchies à chaque chargement). Filtrage par commune à venir en polish.
        </p>
      </header>

      {totalEnAttente > 0 ? (
        <Alert variant="warning" titre="Modération à faire" className="mb-6">
          <p>
            <strong>{FORMAT_NB.format(totalEnAttente)}</strong> élément
            {totalEnAttente > 1 ? 's' : ''} en attente d'action.{' '}
            <Link href="/admin/moderation" className="underline">
              Ouvrir la file de modération →
            </Link>
          </p>
        </Alert>
      ) : (
        <Alert variant="success" titre="Modération à jour" className="mb-6">
          <CheckCircle size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          Aucune action de modération en attente.{' '}
          <Link href="/admin/moderation" className="underline">
            Voir la file →
          </Link>
        </Alert>
      )}

      <header className="mb-3">
        <Heading niveau={2} apparenceComme={3}>
          <Flag size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          File de modération
        </Heading>
      </header>
      <section className="mb-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <CarteAttente
          href="/admin/moderation/petitions"
          libelle="Pétitions"
          nb={fileModeration.petitionsEnModeration}
        />
        <CarteAttente
          href="/admin/moderation/campagnes"
          libelle="Campagnes"
          nb={fileModeration.campagnesEnModeration}
        />
        <CarteAttente
          href="/admin/moderation/cagnottes"
          libelle="Cagnottes"
          nb={fileModeration.cagnottesSuspendues}
        />
        <CarteAttente
          href="/admin/moderation/media"
          libelle="Médias"
          nb={fileModeration.mediasEnAttente}
        />
        <CarteAttente
          href="/admin/moderation/sondages"
          libelle="Sondages"
          nb={fileModeration.sondagesEnModeration}
        />
        <CarteAttente
          href="/admin/moderation/reservations"
          libelle="Réservations litige"
          nb={fileModeration.reservationsEnLitige}
        />
      </section>

      <header className="mb-3">
        <Heading niveau={2} apparenceComme={3}>
          Stats globales
        </Heading>
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
    <Card variant="ombre" className="grid gap-1" aria-label={`${titre} : ${valeur}`}>
      <p aria-hidden="true" className="text-xs font-bold uppercase tracking-cap text-text-3">
        {titre}
      </p>
      <p aria-hidden="true" className="font-display text-2xl text-text-1">
        {valeur}
      </p>
    </Card>
  );
}

function CarteAttente({ href, libelle, nb }: { href: string; libelle: string; nb: number }) {
  return (
    <Link
      href={href}
      className="block"
      aria-label={`${libelle} : ${FORMAT_NB.format(nb)} en attente`}
    >
      <Card
        variant={nb > 0 ? 'ombre' : 'plat'}
        className="flex items-center justify-between gap-2 hover:bg-surface-2"
      >
        <p aria-hidden="true" className={nb > 0 ? 'font-bold text-text-1' : 'text-text-2'}>
          {libelle}
        </p>
        <Badge variant={nb >= 5 ? 'danger' : nb > 0 ? 'warning' : 'default'} aria-hidden="true">
          {FORMAT_NB.format(nb)}
        </Badge>
      </Card>
    </Link>
  );
}
