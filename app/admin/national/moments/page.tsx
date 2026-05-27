import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { type OptionsListeMoments, listerMomentsAdmin } from '@/lib/admin/moments';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterDateHeure } from '@/lib/format-date';
import { compter } from '@/lib/pluriel';
import { CalendarRange, ExternalLink, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Moments solidaires — Admin',
};

const STATUTS: Array<{ value: NonNullable<OptionsListeMoments['statut']>; label: string }> = [
  { value: 'tous', label: 'Tous' },
  { value: 'annonce', label: 'Annoncés' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminés' },
  { value: 'annule', label: 'Annulés' },
  { value: 'retire', label: 'Retirés' },
];

const TYPES: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tous types' },
  { value: 'porte_a_porte', label: 'Porte-à-porte' },
  { value: 'maraude', label: 'Maraude' },
  { value: 'vide_grenier_solidaire', label: 'Vide-grenier' },
  { value: 'soutien', label: 'Soutien' },
  { value: 'manifestation', label: 'Manifestation' },
  { value: 'rencontre', label: 'Rencontre' },
  { value: 'concert_solidaire', label: 'Concert' },
  { value: 'repas_solidaire', label: 'Repas' },
];

interface Props {
  searchParams: Promise<{ q?: string; statut?: string; type?: string }>;
}

/**
 * Page `/admin/national/moments` (V2.4.51).
 *
 * Liste les moments solidaires avec recherche par titre / lieu, filtre
 * statut + type. Triés par date de début décroissante. Lecture seule.
 */
export default async function PageAdminMoments({ searchParams }: Props) {
  const sp = await searchParams;
  const motCle = sp.q?.trim() ?? '';
  const statutFiltre = (STATUTS.find((s) => s.value === sp.statut)?.value ?? 'tous') as
    | 'tous'
    | 'annonce'
    | 'en_cours'
    | 'termine'
    | 'annule'
    | 'retire';
  const typeFiltre = TYPES.find((t) => t.value === sp.type)?.value ?? '';

  const moments = await listerMomentsAdmin({
    motCle: motCle === '' ? undefined : motCle,
    statut: statutFiltre,
    type: typeFiltre === '' ? undefined : typeFiltre,
  });
  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.moments.titre', { valeurMd: 'Moments solidaires' }),
    lireContenuEditorial('admin.national.moments.intro', {
      valeurMd:
        'Liste des moments solidaires tous statuts confondus. Filtres : mot-clé, statut, type. Lecture seule, limite 100, triés par date de début décroissante.',
    }),
  ]);

  return (
    <>
      <Heading niveau={1}>
        <CalendarRange size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="admin.national.moments.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console moments admin"
          longueurMax={60}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        <TexteEditableAdmin
          cle="admin.national.moments.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro console moments admin"
          multilignes
          longueurMax={400}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>{' '}
        <a
          href="/admin/national/moments/export.csv"
          className="text-brand hover:underline"
          download
        >
          Export CSV ↓
        </a>
      </p>

      <form
        method="get"
        action="/admin/national/moments"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={motCle}
          placeholder="titre, lieu…"
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

      <p className="mt-4 text-text-3 text-xs">{compter(moments.length, 'résultat')}</p>

      {moments.length === 0 ? (
        <Alert variant="info" titre="Aucun moment" className="mt-3">
          Aucun moment solidaire ne correspond aux critères.
        </Alert>
      ) : (
        <ul className="mt-3 grid gap-2">
          {moments.map((m) => (
            <li key={m.id}>
              <Card variant="ombre" className="grid gap-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-text-1">{m.titre}</p>
                    <p className="flex items-center gap-1 text-text-3 text-xs">
                      <MapPin size={12} aria-hidden="true" />
                      {m.lieu}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge
                      variant={
                        m.statut === 'en_cours'
                          ? 'success'
                          : m.statut === 'annonce'
                            ? 'warning'
                            : m.statut === 'retire'
                              ? 'danger'
                              : 'default'
                      }
                    >
                      {m.statut}
                    </Badge>
                    <Badge variant="info">{m.type}</Badge>
                    {m.sousType !== null ? <Badge variant="default">{m.sousType}</Badge> : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-text-3 text-xs">
                  <span>
                    {formaterDateHeure(m.commenceLe)}
                    {m.termineLe !== null ? ` → ${formaterDateHeure(m.termineLe)}` : ''}
                  </span>
                  <Link
                    href={`/agir/moments-solidaires/${m.slug}`}
                    className="inline-flex items-center gap-1 text-brand hover:underline"
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
