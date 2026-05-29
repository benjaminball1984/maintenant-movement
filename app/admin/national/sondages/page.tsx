import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { type OptionsListeSondages, listerSondagesAdmin } from '@/lib/admin/sondages';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterDateCourte } from '@/lib/format-date';
import { compter } from '@/lib/pluriel';
import { ExternalLink, Vote } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sondages — Admin',
};

const STATUTS: Array<{ value: NonNullable<OptionsListeSondages['statut']>; label: string }> = [
  { value: 'tous', label: 'Tous' },
  { value: 'ouvert', label: 'Ouverts' },
  { value: 'ferme', label: 'Fermés' },
  { value: 'en_moderation', label: 'En modération' },
];

const MODES: Array<{ value: NonNullable<OptionsListeSondages['mode']>; label: string }> = [
  { value: 'tous', label: 'Tous modes' },
  { value: 'classique', label: 'Classique' },
  { value: 'pondere', label: 'Pondéré' },
];

interface Props {
  searchParams: Promise<{ q?: string; statut?: string; mode?: string }>;
}

/**
 * Page `/admin/national/sondages` (V2.4.48).
 *
 * Liste les sondages avec recherche par titre/question et filtres
 * statut + mode. Affiche nb d'options + date de fermeture. Lecture
 * seule, limite 100 lignes.
 */
export default async function PageAdminSondages({ searchParams }: Props) {
  const sp = await searchParams;
  const motCle = sp.q?.trim() ?? '';
  const statutFiltre = (STATUTS.find((s) => s.value === sp.statut)?.value ?? 'tous') as
    | 'tous'
    | 'ouvert'
    | 'ferme'
    | 'en_moderation';
  const modeFiltre = (MODES.find((s) => s.value === sp.mode)?.value ?? 'tous') as
    | 'tous'
    | 'classique'
    | 'pondere';

  const sondages = await listerSondagesAdmin({
    motCle: motCle === '' ? undefined : motCle,
    statut: statutFiltre,
    mode: modeFiltre,
  });
  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.sondages.titre', { valeurMd: 'Sondages' }),
    lireContenuEditorial('admin.national.sondages.intro', {
      valeurMd:
        'Liste des sondages tous statuts confondus. Filtres : mot-clé, statut, mode. Lecture seule, limite 100.',
    }),
  ]);

  return (
    <>
      <Heading niveau={1}>
        <Vote size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="admin.national.sondages.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console sondages admin"
          longueurMax={40}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        <TexteEditableAdmin
          cle="admin.national.sondages.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro console sondages admin"
          multilignes
          longueurMax={300}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>{' '}
        <a
          href="/admin/national/sondages/export.csv"
          className="text-brand hover:underline"
          download
        >
          Export CSV <span aria-hidden="true">↓</span>
        </a>
      </p>

      <form
        method="get"
        action="/admin/national/sondages"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={motCle}
          placeholder="titre, question…"
          aria-label="Rechercher un sondage"
          className="rounded-md border border-border bg-surface p-2"
        />
        <select
          name="statut"
          defaultValue={statutFiltre}
          aria-label="Filtrer par statut"
          className="rounded-md border border-border bg-surface p-2"
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          name="mode"
          defaultValue={modeFiltre}
          aria-label="Filtrer par mode"
          className="rounded-md border border-border bg-surface p-2"
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
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

      <p className="mt-4 text-text-3 text-xs">{compter(sondages.length, 'résultat')}</p>

      {sondages.length === 0 ? (
        <Alert variant="info" titre="Aucun sondage" className="mt-3">
          Aucun sondage ne correspond aux critères.
        </Alert>
      ) : (
        <ul className="mt-3 grid gap-2">
          {sondages.map((s) => (
            <li key={s.id}>
              <Card variant="ombre" className="grid gap-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-text-1">{s.titre}</p>
                    <p className="text-text-2 text-sm">{s.question}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge
                      variant={
                        s.statut === 'ouvert'
                          ? 'success'
                          : s.statut === 'en_moderation'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {s.statut}
                    </Badge>
                    <Badge variant="info">{s.mode}</Badge>
                    <Badge variant="default">{compter(s.nbOptions, 'option')}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-text-3 text-xs">
                  <span>
                    Créé le {formaterDateCourte(s.createdAt)}
                    {s.fermeLe !== null ? ` · fermé le ${formaterDateCourte(s.fermeLe)}` : ''}
                  </span>
                  <Link
                    href={`/s-informer/sondages/${s.slug}`}
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
