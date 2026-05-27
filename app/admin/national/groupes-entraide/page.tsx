import { Alert, Badge, Card, Heading } from '@/components/ui';
import {
  type OptionsListeGroupesEntraide,
  listerGroupesEntraideAdmin,
} from '@/lib/admin/groupes-entraide';
import { compter } from '@/lib/pluriel';
import { ExternalLink, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Groupes d’entraide — Admin',
};

const STATUTS: Array<{
  value: NonNullable<OptionsListeGroupesEntraide['statut']>;
  label: string;
}> = [
  { value: 'tous', label: 'Tous' },
  { value: 'publie', label: 'Publiés' },
  { value: 'en_moderation', label: 'En modération' },
  { value: 'retire', label: 'Retirés' },
];

interface Props {
  searchParams: Promise<{ q?: string; statut?: string }>;
}

/**
 * Page `/admin/national/groupes-entraide` (V2.4.45).
 *
 * Liste les groupes d'entraide locaux avec recherche par nom / zone et
 * filtre par statut. Affiche les outils activés (prêt, marché, SEL).
 */
export default async function PageAdminGroupesEntraide({ searchParams }: Props) {
  const sp = await searchParams;
  const motCle = sp.q?.trim() ?? '';
  const statutFiltre = (STATUTS.find((s) => s.value === sp.statut)?.value ?? 'tous') as
    | 'tous'
    | 'publie'
    | 'en_moderation'
    | 'retire';

  const groupes = await listerGroupesEntraideAdmin({
    motCle: motCle === '' ? undefined : motCle,
    statut: statutFiltre,
  });

  return (
    <>
      <Heading niveau={1}>
        <Users size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Groupes d'entraide locaux
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        Référentiel des groupes d'entraide. Filtres : mot-clé, statut. Lecture seule, limite 100.
      </p>

      <form
        method="get"
        action="/admin/national/groupes-entraide"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={motCle}
          placeholder="nom, zone géographique…"
          className="rounded-md border border-border bg-surface p-2"
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

      <p className="mt-4 text-text-3 text-xs">{compter(groupes.length, 'résultat')}</p>

      {groupes.length === 0 ? (
        <Alert variant="info" titre="Aucun groupe" className="mt-3">
          Aucun groupe d'entraide ne correspond aux critères.
        </Alert>
      ) : (
        <ul className="mt-3 grid gap-2">
          {groupes.map((g) => (
            <li key={g.id}>
              <Card variant="ombre" className="grid gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-text-1">{g.nom}</p>
                    <p className="text-text-3 text-xs">
                      <code className="font-mono">{g.slug}</code> · {g.zoneGeographique}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge
                      variant={
                        g.statut === 'publie'
                          ? 'success'
                          : g.statut === 'en_moderation'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {g.statut}
                    </Badge>
                    {g.outilPretActive ? <Badge variant="info">Prêt</Badge> : null}
                    {g.outilMarcheActive ? <Badge variant="info">Marché</Badge> : null}
                    {g.outilSelActive ? <Badge variant="info">SEL</Badge> : null}
                    <Link
                      href={`/s-entraider/groupes-locaux/${g.slug}`}
                      className="inline-flex items-center gap-1 text-brand text-xs hover:underline"
                    >
                      <ExternalLink size={12} aria-hidden="true" />
                      Voir
                    </Link>
                  </div>
                </div>
                {g.descriptionCourte.trim() !== '' ? (
                  <p className="line-clamp-2 text-sm text-text-2">{g.descriptionCourte}</p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
