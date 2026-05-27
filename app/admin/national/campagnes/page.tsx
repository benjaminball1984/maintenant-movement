import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { type OptionsListeCampagnes, listerCampagnesAdmin } from '@/lib/admin/campagnes';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterDateCourte } from '@/lib/format-date';
import { compter } from '@/lib/pluriel';
import { ExternalLink, Flag } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Campagnes — Admin',
};

const STATUTS: Array<{ value: NonNullable<OptionsListeCampagnes['statut']>; label: string }> = [
  { value: 'tous', label: 'Tous' },
  { value: 'publiee', label: 'Publiées' },
  { value: 'en_moderation', label: 'En modération' },
  { value: 'rejetee', label: 'Rejetées' },
  { value: 'archivee', label: 'Archivées' },
];

interface Props {
  searchParams: Promise<{ q?: string; statut?: string }>;
}

/**
 * Page `/admin/national/campagnes` (V2.4.57).
 *
 * Liste les campagnes tous statuts confondus avec recherche par titre
 * et filtre par statut. Affiche raison de rejet si présente.
 */
export default async function PageAdminCampagnes({ searchParams }: Props) {
  const sp = await searchParams;
  const motCle = sp.q?.trim() ?? '';
  const statutFiltre = (STATUTS.find((s) => s.value === sp.statut)?.value ?? 'tous') as
    | 'tous'
    | 'en_moderation'
    | 'publiee'
    | 'rejetee'
    | 'archivee';

  const campagnes = await listerCampagnesAdmin({
    motCle: motCle === '' ? undefined : motCle,
    statut: statutFiltre,
  });
  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.campagnes.titre', { valeurMd: 'Campagnes' }),
    lireContenuEditorial('admin.national.campagnes.intro', {
      valeurMd: 'Liste des campagnes tous statuts confondus. Recherche par titre, filtre statut.',
    }),
  ]);

  return (
    <>
      <Heading niveau={1}>
        <Flag size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="admin.national.campagnes.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console campagnes admin"
          longueurMax={40}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <TexteEditableAdmin
        cle="admin.national.campagnes.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console campagnes admin"
        multilignes
        longueurMax={300}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>

      <form
        method="get"
        action="/admin/national/campagnes"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={motCle}
          placeholder="titre de campagne…"
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

      <p className="mt-4 text-text-3 text-xs">{compter(campagnes.length, 'résultat')}</p>

      {campagnes.length === 0 ? (
        <Alert variant="info" titre="Aucune campagne" className="mt-3">
          Aucune campagne ne correspond aux critères.
        </Alert>
      ) : (
        <ul className="mt-3 grid gap-2">
          {campagnes.map((c) => (
            <li key={c.id}>
              <Card variant="ombre" className="grid gap-2 sm:grid-cols-[auto_1fr]">
                {c.imageUrl !== null ? (
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    <Image
                      src={c.imageUrl}
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
                    <p className="font-bold text-text-1">{c.titre}</p>
                    <Badge
                      variant={
                        c.statut === 'publiee'
                          ? 'success'
                          : c.statut === 'en_moderation'
                            ? 'warning'
                            : c.statut === 'rejetee'
                              ? 'danger'
                              : 'default'
                      }
                    >
                      {c.statut}
                    </Badge>
                  </div>
                  {c.raisonRejet !== null ? (
                    <p className="text-danger text-xs">
                      <strong>Raison du rejet :</strong> {c.raisonRejet}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-text-3 text-xs">
                    <span>
                      Créée le {formaterDateCourte(c.createdAt)}
                      {c.modereLe !== null ? ` · modérée le ${formaterDateCourte(c.modereLe)}` : ''}
                    </span>
                    <Link
                      href={`/mobiliser/campagnes/${c.slug}`}
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
