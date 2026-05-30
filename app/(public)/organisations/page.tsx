import { Badge, Button, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerOrganisations } from '@/lib/organisations/requetes';
import { LIBELLE_TYPE_ORGANISATION, type TypeOrganisation } from '@/lib/organisations/validation';
import { BadgeCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Organisations',
  description: 'Les organisations présentes sur Maintenant! : collectifs, associations, syndicats…',
};

interface PageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

/**
 * Index public des organisations (épopée réseau V2, chantier B.1).
 *
 * Liste les organisations actives (badgées d'abord), avec recherche par nom et
 * filtre par type. Bouton de création pour les personnes connectées.
 */
export default async function PageOrganisations({ searchParams }: PageProps) {
  const { q, type } = await searchParams;
  const typeFiltre =
    type !== undefined && type in LIBELLE_TYPE_ORGANISATION
      ? (type as TypeOrganisation)
      : undefined;

  const [organisations, session] = await Promise.all([
    listerOrganisations({ recherche: q, type: typeFiltre }),
    getSession(),
  ]);

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Réseau</p>
          <Heading niveau={1}>Organisations</Heading>
          <p className="mt-1 text-text-2">
            Collectifs, associations, syndicats et autres structures présentes sur Maintenant!
          </p>
        </div>
        {session !== null ? (
          <Link href="/organisations/nouvelle">
            <Button>Créer une organisation</Button>
          </Link>
        ) : null}
      </header>

      {/* Recherche + filtre par type (formulaire GET, sans JS). */}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <label htmlFor="q" className="text-sm font-bold text-text-2">
            Rechercher
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Nom de l’organisation"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1"
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="type" className="text-sm font-bold text-text-2">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={type ?? ''}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1"
          >
            <option value="">Tous les types</option>
            {Object.entries(LIBELLE_TYPE_ORGANISATION).map(([cle, libelle]) => (
              <option key={cle} value={cle}>
                {libelle}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Filtrer
        </Button>
      </form>

      {organisations.length === 0 ? (
        <p className="py-12 text-center text-text-3">
          Aucune organisation pour l’instant.{' '}
          {session !== null ? 'Crée la première !' : 'Connecte-toi pour en créer une.'}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {organisations.map((o) => (
            <li key={o.id}>
              <Link href={`/organisations/${o.slug}`}>
                <Card variant="ombre" className="h-full transition hover:border-brand">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="brand">{LIBELLE_TYPE_ORGANISATION[o.typeOrganisation]}</Badge>
                    {o.badgeOfficiel ? (
                      <span
                        className="inline-flex items-center gap-1 font-bold text-brand text-xs"
                        title="Organisation officielle"
                      >
                        <BadgeCheck size={14} strokeWidth={2} aria-hidden="true" />
                        Officielle
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-bold text-text-1">{o.nom}</h2>
                  {o.description !== null && o.description.trim() !== '' ? (
                    <p className="mt-1 line-clamp-2 text-sm text-text-3">{o.description}</p>
                  ) : null}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
