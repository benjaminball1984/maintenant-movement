import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { type FiltreAgenda, chargerEvenementsAgenda } from '@/lib/agenda/donnees';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ jour?: string; departement?: string }>;
}

const TYPES_VALIDES = [
  'mobilisations',
  'moments-solidaires',
  'minimarches',
  'boutiques-ephemeres',
  'sondages',
] as const;
type TypeRoute = (typeof TYPES_VALIDES)[number];

const MAPPING_TYPE: Record<TypeRoute, { interne: FiltreAgenda['type']; libelle: string }> = {
  mobilisations: { interne: 'mobilisation', libelle: 'Mobilisations' },
  'moments-solidaires': { interne: 'moment_solidaire', libelle: 'Moments solidaires' },
  minimarches: { interne: 'minimarche', libelle: 'Minimarchés' },
  'boutiques-ephemeres': { interne: 'boutique_marche', libelle: 'Boutiques éphémères' },
  sondages: { interne: 'sondage', libelle: 'Clôtures de sondages' },
};

const FORMATEUR_LONG = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const FORMATEUR_HEURE = new Intl.DateTimeFormat('fr-FR', {
  hour: 'numeric',
  minute: 'numeric',
});

function estTypeRoute(v: string): v is TypeRoute {
  return (TYPES_VALIDES as readonly string[]).includes(v);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  if (!estTypeRoute(type)) return { title: 'Agenda introuvable' };
  return {
    title: `Agenda — ${MAPPING_TYPE[type].libelle}`,
    description: `Agenda dédié aux ${MAPPING_TYPE[type].libelle.toLowerCase()}.`,
  };
}

/**
 * Agenda dédié par type d'événement (cycle V2 V2.4.4).
 *
 * Route catch-all : /agenda/mobilisations, /agenda/moments-solidaires,
 * /agenda/minimarches, /agenda/boutiques-ephemeres, /agenda/sondages.
 *
 * Réutilise la même couche de données que /agenda mais préfiltre par
 * type. Permet aux personnes intéressées par un seul type de garder
 * un flux dédié.
 */
export default async function PageAgendaParType({ params, searchParams }: Props) {
  const { type } = await params;
  if (!estTypeRoute(type)) notFound();
  const config = MAPPING_TYPE[type];

  const { jour, departement } = await searchParams;
  const filtre: FiltreAgenda = {
    jour: jour === undefined || jour === '' ? undefined : jour,
    departement: departement === undefined || departement === '' ? undefined : departement,
    type: config.interne,
  };
  const evenements = await chargerEvenementsAgenda(filtre);

  const groupesParJour = new Map<string, typeof evenements>();
  for (const e of evenements) {
    const jourCle = e.commence_le.slice(0, 10);
    const liste = groupesParJour.get(jourCle) ?? [];
    liste.push(e);
    groupesParJour.set(jourCle, liste);
  }

  return (
    <Container taille="lg" className="py-12">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agenda" className="hover:text-brand">
          ← Agenda complet
        </Link>
      </p>
      <header className="mt-2 mb-8">
        <Heading niveau={1}>{config.libelle}</Heading>
        <p className="mt-2 max-w-2xl text-text-2">
          Vue dédiée. Pour tout voir au même endroit, va sur{' '}
          <Link href="/agenda" className="text-brand hover:underline">
            l'agenda complet
          </Link>
          .
        </p>
      </header>

      {groupesParJour.size === 0 ? (
        <Alert variant="info" titre="Aucun événement">
          Aucun {config.libelle.toLowerCase()} à venir.
        </Alert>
      ) : (
        <div className="grid gap-8">
          {Array.from(groupesParJour.entries()).map(([jourCle, liste]) => (
            <section key={jourCle}>
              <Heading niveau={2} apparenceComme={3} className="mb-3 capitalize">
                {FORMATEUR_LONG.format(new Date(jourCle))}
              </Heading>
              <ul className="grid gap-3">
                {liste.map((e) => (
                  <li key={`${e.type}-${e.id}`}>
                    <Card variant="ombre" className="flex flex-col gap-2">
                      <header className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="default">{config.libelle.replace(/s$/, '')}</Badge>
                        <span className="text-xs text-text-3">
                          {FORMATEUR_HEURE.format(new Date(e.commence_le))}
                        </span>
                      </header>
                      <h3 className="text-lg font-bold leading-tight text-text-1">
                        <Link href={e.href} className="underline-offset-4 hover:underline">
                          {e.titre}
                        </Link>
                      </h3>
                      {e.lieu !== null ? <p className="text-sm text-text-3">{e.lieu}</p> : null}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
