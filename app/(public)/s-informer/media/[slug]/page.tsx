import { retirerMediaAction } from '@/app/actions/archivage';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonArchiverEntite } from '@/components/admin/BoutonArchiverEntite';
import { BoutonSupprimerEntite } from '@/components/admin/BoutonSupprimerEntite';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterDateMoyenne } from '@/lib/format-date';
import { mediaParSlug } from '@/lib/media/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { formaterTempsLecture } from '@/lib/temps-lecture';
import type { TypeMedia } from '@/types/database';
import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const FALLBACKS = {
  retour: '← Média Maintenant',
  redactionFallback: 'Rédaction',
  alertExternePrefix: 'Brève reprise de',
  alertExterneAmorce:
    "Cette brève provient d'une source externe et n'engage pas la rédaction de Maintenant!. Source originale :",
  alertExterneFallback: 'non précisée',
  adminSectionTitre: 'Actions admin',
};

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
  const { slug } = await params;
  const [
    estAdmin,
    media,
    retour,
    redactionFallback,
    alertExternePrefix,
    alertExterneAmorce,
    alertExterneFallback,
    adminSectionTitre,
  ] = await Promise.all([
    estAdminCourant(),
    mediaParSlug(slug),
    lireContenuEditorial('media.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('media.fiche.redaction_fallback', {
      valeurMd: FALLBACKS.redactionFallback,
    }),
    lireContenuEditorial('media.fiche.alert_externe_prefix', {
      valeurMd: FALLBACKS.alertExternePrefix,
    }),
    lireContenuEditorial('media.fiche.alert_externe_amorce', {
      valeurMd: FALLBACKS.alertExterneAmorce,
    }),
    lireContenuEditorial('media.fiche.alert_externe_fallback', {
      valeurMd: FALLBACKS.alertExterneFallback,
    }),
    lireContenuEditorial('media.fiche.admin_section_titre', {
      valeurMd: FALLBACKS.adminSectionTitre,
    }),
  ]);
  if (media === null) notFound();
  if (media.statut !== 'publie') notFound();

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="media.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour vers liste media"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/s-informer/media" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
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
              .join(' ') || redactionFallback.valeurMd}
            {media.publie_le !== null ? ` · ${formaterDateMoyenne(media.publie_le)}` : ''}
            {media.corps.trim() !== '' ? ` · ${formaterTempsLecture(media.corps)}` : ''}
          </p>
        </header>

        {media.provenance_externe !== null ? (
          <Alert
            variant="info"
            titre={
              <>
                <TexteEditableAdmin
                  cle="media.fiche.alert_externe_prefix"
                  valeurInitiale={alertExternePrefix.valeurMd}
                  estAdmin={estAdmin}
                  libelle="prefixe alerte source externe (avant nom)"
                  longueurMax={40}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>{' '}
                {media.provenance_externe}
              </>
            }
          >
            <TexteEditableAdmin
              cle="media.fiche.alert_externe_amorce"
              valeurInitiale={alertExterneAmorce.valeurMd}
              estAdmin={estAdmin}
              libelle="amorce alerte source externe"
              multilignes
              longueurMax={300}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
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
              <TexteEditableAdmin
                cle="media.fiche.alert_externe_fallback"
                valeurInitiale={alertExterneFallback.valeurMd}
                estAdmin={estAdmin}
                libelle="fallback si pas d'URL source"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
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
          <TexteEditableAdmin
            cle="media.fiche.admin_section_titre"
            valeurInitiale={adminSectionTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section actions admin media"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={4}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
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
