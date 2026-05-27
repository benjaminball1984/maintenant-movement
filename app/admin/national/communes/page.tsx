import { Alert, Badge, Card, Heading, Pagination } from '@/components/ui';
import {
  type OptionsListeCommunes,
  compterCommunes,
  listerCommunesAdminPagine,
} from '@/lib/admin/communes';
import { lirePageDepuisParams, paginer } from '@/lib/pagination';
import { compter } from '@/lib/pluriel';
import { ExternalLink, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Communes — Admin',
};

const FORMAT_NB = new Intl.NumberFormat('fr-FR');

const STATUTS: Array<{
  value: NonNullable<OptionsListeCommunes['statut']>;
  label: string;
}> = [
  { value: 'tous', label: 'Toutes' },
  { value: 'libre', label: 'Libres (activées)' },
  { value: 'pre_creee', label: 'Pré-créées (coquilles)' },
];

interface Props {
  searchParams: Promise<{ q?: string; statut?: string; dep?: string; page?: string }>;
}

const PAR_PAGE = 50;

/**
 * Page `/admin/national/communes` (V2.4.33).
 *
 * Liste les communes du référentiel (35 011 coquilles + libres activées).
 * Filtres par mot-clé, statut, code département. Lecture seule.
 * Lien direct vers la page publique de chaque commune.
 */
export default async function PageAdminCommunes({ searchParams }: Props) {
  const sp = await searchParams;
  const motCle = sp.q?.trim() ?? '';
  const statutFiltre = (STATUTS.find((s) => s.value === sp.statut)?.value ?? 'tous') as
    | 'tous'
    | 'libre'
    | 'pre_creee';
  const departement = sp.dep?.trim() ?? '';

  const pageDemandee = lirePageDepuisParams(sp);
  const filtres = {
    motCle: motCle === '' ? undefined : motCle,
    statut: statutFiltre,
    departement: departement === '' ? undefined : departement,
  };
  const [premier, compteurs] = await Promise.all([
    listerCommunesAdminPagine({ ...filtres, limite: PAR_PAGE, debutIdx: 0 }),
    compterCommunes(),
  ]);
  const pagination = paginer({
    page: pageDemandee,
    parPage: PAR_PAGE,
    total: premier.total,
  });
  const resultat =
    pagination.page === 1
      ? premier
      : await listerCommunesAdminPagine({
          ...filtres,
          limite: PAR_PAGE,
          debutIdx: pagination.debutIdx,
        });
  const communes = resultat.lignes;

  return (
    <>
      <Heading niveau={1}>
        <MapPin size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Communes
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        Référentiel des communes. Filtres : mot-clé, statut (libres vs coquilles pré-créées),
        département.{' '}
        <a
          href="/admin/national/communes/export.csv"
          className="text-brand hover:underline"
          download
        >
          Export CSV (50 000 max) ↓
        </a>
      </p>

      <section className="mt-4 grid gap-2 sm:grid-cols-3">
        <Card variant="ombre" className="grid gap-1">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Total</p>
          <p className="font-display text-2xl text-text-1">{FORMAT_NB.format(compteurs.total)}</p>
        </Card>
        <Card variant="ombre" className="grid gap-1">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Libres</p>
          <p className="font-display text-2xl text-text-1">{FORMAT_NB.format(compteurs.libres)}</p>
        </Card>
        <Card variant="ombre" className="grid gap-1">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Coquilles</p>
          <p className="font-display text-2xl text-text-1">
            {FORMAT_NB.format(compteurs.preCreees)}
          </p>
        </Card>
      </section>

      <form
        method="get"
        action="/admin/national/communes"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={motCle}
          placeholder="nom, code INSEE, code postal…"
          className="rounded-md border border-border bg-surface p-2"
        />
        <input
          type="text"
          name="dep"
          defaultValue={departement}
          placeholder="dép. (ex. 75)"
          maxLength={3}
          className="w-24 rounded-md border border-border bg-surface p-2"
        />
        <select
          name="statut"
          defaultValue={statutFiltre}
          className="rounded-md border border-border bg-surface p-2"
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
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

      <p className="mt-4 text-text-3 text-xs">
        {compter(premier.total, 'résultat')} · page {pagination.page} sur {pagination.nbPages}
      </p>

      {communes.length === 0 ? (
        <Alert variant="info" titre="Aucune commune" className="mt-3">
          Aucune commune ne correspond aux critères.
        </Alert>
      ) : (
        <ul className="mt-3 grid gap-2">
          {communes.map((c) => (
            <li key={c.id}>
              <Card variant="ombre" className="grid gap-1 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-bold text-text-1">{c.nom}</p>
                  <p className="text-text-3 text-xs">
                    {c.codePostalPrincipal !== null ? `${c.codePostalPrincipal} · ` : ''}
                    INSEE {c.codeInsee ?? '—'} · dép. {c.departement ?? '—'} · {c.region ?? '—'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-center">
                  <Badge variant={c.statutCreation === 'pre_creee' ? 'default' : 'success'}>
                    {c.statutCreation === 'pre_creee' ? 'Coquille' : 'Libre'}
                  </Badge>
                  <Link
                    href={`/agir/communes/${c.slug}`}
                    className="inline-flex items-center gap-1 text-brand text-xs hover:underline"
                  >
                    <ExternalLink size={12} aria-hidden="true" />
                    Page publique
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={pagination.page}
        nbPages={pagination.nbPages}
        href="/admin/national/communes"
        paramsAPreserver={{ q: motCle, statut: statutFiltre, dep: departement }}
      />
    </>
  );
}
