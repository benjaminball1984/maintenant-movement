import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import {
  PREFIXES_IMAGES,
  type PrefixeImage,
  listerFichiersBucketImages,
} from '@/lib/admin/bibliotheque-images';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterDateHeure } from '@/lib/format-date';
import { formaterTailleOctets } from '@/lib/format-taille';
import { Image as IconeImage } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Bibliothèque d’images — Admin',
};

interface Props {
  searchParams: Promise<{ prefixe?: string }>;
}

/**
 * Page `/admin/national/images` (V2.4.25).
 *
 * Bibliothèque d'images uploadées par les admins. Liste les fichiers du
 * bucket Supabase Storage `media` (Supabase ou Mock), avec filtrage
 * par préfixe (dossier). L'admin peut copier l'URL d'une image existante
 * pour l'utiliser dans une autre édition / page sans re-téléverser.
 */
export default async function PageBibliothequeImages({ searchParams }: Props) {
  const { prefixe } = await searchParams;
  const prefixeActuel: PrefixeImage = PREFIXES_IMAGES.includes(prefixe as PrefixeImage)
    ? (prefixe as PrefixeImage)
    : '';

  const fichiers = await listerFichiersBucketImages(prefixeActuel);
  const totalOctets = fichiers.reduce((acc, f) => acc + f.tailleOctets, 0);

  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.images.titre', { valeurMd: "Bibliothèque d'images" }),
    lireContenuEditorial('admin.national.images.intro', {
      valeurMd:
        'Toutes les images téléversées sur Supabase Storage (bucket `media`). Tri par date de mise à jour décroissante.',
    }),
  ]);

  return (
    <>
      <Heading niveau={1}>
        <IconeImage size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="admin.national.images.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console bibliotheque images"
          longueurMax={50}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <TexteEditableAdmin
        cle="admin.national.images.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console bibliotheque images"
        multilignes
        longueurMax={300}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>

      <section className="mt-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
          Filtrer par dossier
        </p>
        <ul className="flex flex-wrap gap-1">
          {PREFIXES_IMAGES.map((p) => {
            const actif = p === prefixeActuel;
            return (
              <li key={p || 'racine'}>
                <Link
                  href={p === '' ? '/admin/national/images' : `/admin/national/images?prefixe=${p}`}
                  className={
                    actif
                      ? 'inline-flex rounded-full bg-brand px-3 py-1 font-bold text-white text-xs'
                      : 'inline-flex rounded-full border border-border bg-surface px-3 py-1 text-text-2 text-xs hover:bg-surface-2'
                  }
                >
                  {p === '' ? 'Racine' : p}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-4 text-text-3 text-xs">
        {fichiers.length} fichier{fichiers.length > 1 ? 's' : ''} ·{' '}
        {formaterTailleOctets(totalOctets)} total
      </p>

      {fichiers.length === 0 ? (
        <Alert variant="info" titre="Aucune image dans ce dossier" className="mt-3">
          {prefixeActuel === ''
            ? 'Le bucket est vide ou le service Storage tourne en mode Mock (en local).'
            : 'Aucune image n’a encore été téléversée dans ce dossier. Choisis un autre dossier ou téléverse depuis un formulaire d’admin.'}
        </Alert>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fichiers.map((f) => (
            <li key={f.cheminBucket}>
              <Card variant="ombre" className="grid gap-2">
                <div className="relative aspect-video overflow-hidden rounded-md bg-surface-2">
                  <Image
                    src={f.url}
                    alt={f.nom}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="grid gap-1">
                  <p className="line-clamp-1 font-mono text-text-1 text-xs">{f.nom}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {f.mimeType !== null ? (
                      <Badge variant="default">{f.mimeType.split('/')[1] ?? f.mimeType}</Badge>
                    ) : null}
                    <span className="text-text-3 text-xs">
                      {formaterTailleOctets(f.tailleOctets)}
                    </span>
                    {f.derniereMaj !== null ? (
                      <span className="text-text-3 text-xs">
                        · {formaterDateHeure(f.derniereMaj)}
                      </span>
                    ) : null}
                  </div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand text-xs hover:underline"
                  >
                    Ouvrir dans un nouvel onglet ↗
                  </a>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
