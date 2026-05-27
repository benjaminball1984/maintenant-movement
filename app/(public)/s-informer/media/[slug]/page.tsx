import { retirerMediaAction } from '@/app/actions/archivage';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonArchiverEntite } from '@/components/admin/BoutonArchiverEntite';
import { BoutonSupprimerEntite } from '@/components/admin/BoutonSupprimerEntite';
import { Alert, Badge, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { mediaParSlug } from '@/lib/media/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { formaterTempsLecture } from '@/lib/temps-lecture';
import type { TypeMedia } from '@/types/database';
import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const LIBELLE_TYPE: Record<TypeMedia, string> = {
  edito: 'Édito',
  tribune: 'Tribune',
  article: 'Article',
  breve: 'Brève',
  dessin: 'Dessin',
  podcast: 'Podcast',
  video: 'Vidéo',
  live: 'Live',
  newsletter: 'Newsletter',
};

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const media = await mediaParSlug(slug);
  if (media === null) return { title: 'Média introuvable' };
  return metadataPourPartage({
    objet: {
      titre: media.titre,
      description: media.corps,
      // `vignette_url` est le champ image dédié à l'aperçu / OG (V1 chantier média).
      image_url: media.vignette_url,
      type_objet: 'article',
    },
    cheminPage: `/s-informer/media/${slug}`,
    ogType: 'article',
  });
}

export default async function PageDetailMedia({ params }: PageDetailProps) {
  const estAdmin = await estAdminCourant();
  const { slug } = await params;
  const media = await mediaParSlug(slug);
  if (media === null) notFound();
  if (media.statut !== 'publie') notFound();

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-informer/media" className="hover:text-brand">
          ← Média Maintenant
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Badge variant={media.type === 'edito' ? 'brand' : 'default'}>
              {LIBELLE_TYPE[media.type]}
            </Badge>
            <BoutonAdminEditer href={`/admin/moderation/media?id=${media.id}`}>
              Admin
            </BoutonAdminEditer>
          </div>
          <Heading niveau={1}>{media.titre}</Heading>
          <p className="text-sm text-text-3">
            {[media.auteurice_prenom, media.auteurice_nom]
              .filter((s) => s !== null && s.trim() !== '')
              .join(' ') || 'Rédaction'}
            {media.publie_le !== null ? ` · ${FORMATEUR.format(new Date(media.publie_le))}` : ''}
            {media.corps.trim() !== '' ? ` · ${formaterTempsLecture(media.corps)}` : ''}
          </p>
        </header>

        {media.provenance_externe !== null ? (
          <Alert variant="info" titre={`Brève reprise de ${media.provenance_externe}`}>
            Cette brève provient d'une source externe et n'engage pas la rédaction de Maintenant!.
            Source originale :{' '}
            {media.source_url !== null ? (
              <a
                href={media.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {media.source_url} <ExternalLink size={12} className="inline" />
              </a>
            ) : (
              'non précisée'
            )}
          </Alert>
        ) : null}

        {media.vignette_url !== null ? (
          <img
            src={media.vignette_url}
            alt={media.titre}
            className="w-full rounded-md border border-border"
          />
        ) : null}

        <section className="prose grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
          {media.corps}
        </section>

        {media.media_url !== null && (media.type === 'video' || media.type === 'live') ? (
          <div className="aspect-video overflow-hidden rounded-md border border-border">
            <iframe
              src={media.media_url}
              title={media.titre}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}

        {media.media_url !== null && media.type === 'podcast' ? (
          <audio controls className="w-full">
            <source src={media.media_url} />
            <track kind="captions" />
          </audio>
        ) : null}

        {media.tags !== null && media.tags.length > 0 ? (
          <footer className="flex flex-wrap gap-2 border-t border-border pt-4">
            {media.tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </footer>
        ) : null}
      </article>

      {estAdmin ? (
        <section
          aria-label="Actions admin"
          className="mt-12 grid gap-3 border-t border-border pt-8"
        >
          <Heading niveau={2} apparenceComme={4}>
            Actions admin
          </Heading>
          <BoutonArchiverEntite
            id={media.id}
            action={retirerMediaAction}
            verbe="Retirer le média"
            description="Statut → 'retire'. Le média disparaît de la liste publique."
            labelRaison="Raison du retrait (optionnelle)"
          />
          <BoutonSupprimerEntite table="media" id={media.id} redirigerVers="/s-informer/media" />
        </section>
      ) : null}
    </Container>
  );
}
