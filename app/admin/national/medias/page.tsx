import { Alert, Badge, Card, Heading } from '@/components/ui';
import { type OptionsListeMedias, listerMediasAdmin } from '@/lib/admin/medias';
import { formaterDateCourte } from '@/lib/format-date';
import { compter } from '@/lib/pluriel';
import { ExternalLink, Newspaper } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Médias — Admin',
};

const STATUTS: Array<{ value: NonNullable<OptionsListeMedias['statut']>; label: string }> = [
  { value: 'tous', label: 'Tous' },
  { value: 'publie', label: 'Publiés' },
  { value: 'brouillon', label: 'Brouillons' },
  { value: 'retire', label: 'Retirés' },
];

const TYPES: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tous types' },
  { value: 'edito', label: 'Édito' },
  { value: 'tribune', label: 'Tribune' },
  { value: 'article', label: 'Article' },
  { value: 'breve', label: 'Brève' },
  { value: 'dessin', label: 'Dessin' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'video', label: 'Vidéo' },
  { value: 'live', label: 'Live' },
  { value: 'newsletter', label: 'Newsletter' },
];

interface Props {
  searchParams: Promise<{ q?: string; statut?: string; type?: string }>;
}

/**
 * Page `/admin/national/medias` (V2.4.54).
 *
 * Liste les médias publiés et brouillons avec recherche par titre/corps,
 * filtres statut + type. Affiche la vignette si disponible.
 */
export default async function PageAdminMedias({ searchParams }: Props) {
  const sp = await searchParams;
  const motCle = sp.q?.trim() ?? '';
  const statutFiltre = (STATUTS.find((s) => s.value === sp.statut)?.value ?? 'tous') as
    | 'tous'
    | 'publie'
    | 'brouillon'
    | 'retire';
  const typeFiltre = TYPES.find((t) => t.value === sp.type)?.value ?? '';

  const medias = await listerMediasAdmin({
    motCle: motCle === '' ? undefined : motCle,
    statut: statutFiltre,
    type: typeFiltre === '' ? undefined : typeFiltre,
  });

  return (
    <>
      <Heading niveau={1}>
        <Newspaper size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Médias
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        Articles, brèves, podcasts, vidéos. Filtres : mot-clé, statut, type. Lecture seule.
      </p>

      <form
        method="get"
        action="/admin/national/medias"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={motCle}
          placeholder="titre, corps…"
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
        <select
          name="type"
          defaultValue={typeFiltre}
          className="rounded-md border border-border bg-surface p-2"
        >
          {TYPES.map((t) => (
            <option key={t.value || 'all'} value={t.value}>
              {t.label}
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

      <p className="mt-4 text-text-3 text-xs">{compter(medias.length, 'résultat')}</p>

      {medias.length === 0 ? (
        <Alert variant="info" titre="Aucun média" className="mt-3">
          Aucun média ne correspond aux critères.
        </Alert>
      ) : (
        <ul className="mt-3 grid gap-2">
          {medias.map((m) => (
            <li key={m.id}>
              <Card variant="ombre" className="grid gap-2 sm:grid-cols-[auto_1fr]">
                {m.vignetteUrl !== null ? (
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    <Image
                      src={m.vignetteUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-24 shrink-0 rounded-md bg-surface-2" />
                )}
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-bold text-text-1">{m.titre}</p>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge
                        variant={
                          m.statut === 'publie'
                            ? 'success'
                            : m.statut === 'retire'
                              ? 'danger'
                              : 'default'
                        }
                      >
                        {m.statut}
                      </Badge>
                      <Badge variant="info">{m.type}</Badge>
                      {m.provenanceExterne !== null ? (
                        <Badge variant="default">repris de {m.provenanceExterne}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-text-3 text-xs">
                    <span>
                      {m.publieLe !== null
                        ? `Publié le ${formaterDateCourte(m.publieLe)}`
                        : `Créé le ${formaterDateCourte(m.createdAt)}`}
                    </span>
                    <Link
                      href={`/s-informer/media/${m.slug}`}
                      className="inline-flex items-center gap-1 text-brand hover:underline"
                    >
                      <ExternalLink size={12} aria-hidden="true" />
                      Page publique
                    </Link>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
