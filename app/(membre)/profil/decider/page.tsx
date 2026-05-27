import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import {
  LIBELLE_MODE,
  LIBELLE_STATUT,
  listerDernieresReunionsAvecPV,
  listerProchainesReunionsToutesSalles,
} from '@/lib/decider';
import { ArrowLeft, CheckCircle, Clock, Video } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Mes prochaines réunions Décider',
};

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Page `/profil/decider` — Vue personnelle des réunions Décider visibles
 * à la personne (V2.4.22).
 *
 * RLS Supabase filtre déjà les salles selon la visibilité (membres /
 * fedeere / public). Cette page propose donc juste un agrégat tri à
 * destination de la personne connectée : prochaines réunions + dernières
 * décisions, sans filtre supplémentaire côté applicatif. C'est le RLS
 * qui sécurise.
 */
export default async function PageMesReunions() {
  const session = await getSession();
  if (session === null) redirect('/connexion?prochaine=/profil/decider');

  const [prochaines, recentes] = await Promise.all([
    listerProchainesReunionsToutesSalles(20),
    listerDernieresReunionsAvecPV(10),
  ]);

  return (
    <Container taille="md" className="py-12">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/profil/dashboard" className="hover:text-brand">
          <ArrowLeft size={12} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          Mon dashboard
        </Link>
      </p>

      <Heading niveau={1}>
        <Video size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Mes réunions Décider
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        Toutes les réunions visibles selon ton périmètre (les salles sont filtrées par RLS selon
        leur visibilité).
      </p>

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          <Clock size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Prochaines réunions ({prochaines.length})
        </Heading>
        {prochaines.length === 0 ? (
          <Alert variant="info" titre="Aucune réunion à venir" className="mt-3">
            Reviens bientôt. Tu peux aussi explorer{' '}
            <Link href="/s-informer/decider" className="underline">
              toutes les salles Décider
            </Link>{' '}
            pour voir celles publiques.
          </Alert>
        ) : (
          <ul className="mt-3 grid gap-2">
            {prochaines.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/s-informer/decider/${r.salleSlug}/${r.id}`}
                  className="block hover:opacity-90"
                >
                  <Card variant="ombre" className="grid gap-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-text-3 text-xs">{r.salleNom}</span>
                      <span className="font-bold text-brand text-xs">
                        {FORMATEUR.format(new Date(r.debutLe))}
                      </span>
                    </div>
                    <h3 className="font-bold text-text-1">{r.titre}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={r.statut === 'en_cours' ? 'success' : 'warning'}>
                        {LIBELLE_STATUT[r.statut]}
                      </Badge>
                      <Badge variant="info">{LIBELLE_MODE[r.modeDecision]}</Badge>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <Heading niveau={2} apparenceComme={3}>
          <CheckCircle size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Dernières décisions ({recentes.length})
        </Heading>
        {recentes.length === 0 ? (
          <p className="mt-3 text-sm text-text-3">Aucun PV publié pour le moment.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {recentes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/s-informer/decider/${r.salleSlug}/${r.id}`}
                  className="block hover:opacity-90"
                >
                  <Card variant="plat" className="grid gap-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-text-3 text-xs">{r.salleNom}</span>
                      <Badge variant="info">{LIBELLE_MODE[r.modeDecision]}</Badge>
                    </div>
                    <h3 className="font-bold text-text-1">{r.titre}</h3>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
