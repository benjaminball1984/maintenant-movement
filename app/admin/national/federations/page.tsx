import { Alert, Badge, Card, Heading } from '@/components/ui';
import { type OptionsListeFederations, listerFederationsAdmin } from '@/lib/admin/federations';
import { ExternalLink, Network } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fédérations — Admin',
};

const TYPES: Array<{ value: NonNullable<OptionsListeFederations['type']>; label: string }> = [
  { value: 'tous', label: 'Tous' },
  { value: 'geographique', label: 'Géographique' },
  { value: 'thematique', label: 'Thématique' },
  { value: 'mixte', label: 'Mixte' },
];

interface Props {
  searchParams: Promise<{ q?: string; type?: string }>;
}

/**
 * Page `/admin/national/federations` (V2.4.35).
 *
 * Liste les fédérations avec recherche par nom et filtre par type.
 * Affiche le nombre de communes rattachées par fédération. Lecture
 * seule, limite 100 lignes.
 */
export default async function PageAdminFederations({ searchParams }: Props) {
  const sp = await searchParams;
  const motCle = sp.q?.trim() ?? '';
  const typeFiltre = (TYPES.find((s) => s.value === sp.type)?.value ?? 'tous') as
    | 'tous'
    | 'geographique'
    | 'thematique'
    | 'mixte';

  const federations = await listerFederationsAdmin({
    motCle: motCle === '' ? undefined : motCle,
    type: typeFiltre,
  });

  return (
    <>
      <Heading niveau={1}>
        <Network size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Fédérations
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        Référentiel des fédérations (regroupements de communes ou groupes thématiques). Filtres :
        mot-clé, type. Lecture seule, limite 100 lignes.
      </p>

      <form
        method="get"
        action="/admin/national/federations"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={motCle}
          placeholder="nom de fédération…"
          className="rounded-md border border-border bg-surface p-2"
        />
        <select
          name="type"
          defaultValue={typeFiltre}
          className="rounded-md border border-border bg-surface p-2"
        >
          {TYPES.map((s) => (
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
        {federations.length} résultat{federations.length > 1 ? 's' : ''}
      </p>

      {federations.length === 0 ? (
        <Alert variant="info" titre="Aucune fédération" className="mt-3">
          Aucune fédération ne correspond aux critères.
        </Alert>
      ) : (
        <ul className="mt-3 grid gap-2">
          {federations.map((f) => (
            <li key={f.id}>
              <Card variant="ombre" className="grid gap-1 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-bold text-text-1">{f.nom}</p>
                  <p className="text-text-3 text-xs">
                    <code className="font-mono">{f.slug}</code>
                  </p>
                  {f.descriptionCourte !== null && f.descriptionCourte.trim() !== '' ? (
                    <p className="mt-1 line-clamp-2 text-sm text-text-2">{f.descriptionCourte}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 self-center">
                  <Badge variant="info">{f.type}</Badge>
                  <Badge variant="default">
                    {f.nbCommunes} commune{f.nbCommunes > 1 ? 's' : ''}
                  </Badge>
                  <Link
                    href={`/agir/federations/${f.slug}`}
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
    </>
  );
}
