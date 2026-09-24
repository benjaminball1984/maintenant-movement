import { retirerMediaAction } from '@/app/actions/archivage';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonArchiverEntite } from '@/components/admin/BoutonArchiverEntite';
import { BoutonSupprimerEntite } from '@/components/admin/BoutonSupprimerEntite';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { BoutonMettreALaUne } from '@/components/home/BoutonMettreALaUne';
import { Alert, Badge, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterDateMoyenne } from '@/lib/format-date';
import { idEpingleUneHome } from '@/lib/home/une';
import { mediaParSlug } from '@/lib/media/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { formaterTempsLecture } from '@/lib/temps-lecture';
import type { TypeMedia } from '@/types/database';
import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const FALLBACKS = {
  retour: 'Retour',
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

/**
 * Cartes qu'un article peut intégrer (2026-09-21) : quand `media_url` pointe
 * vers l'une d'elles, l'article l'affiche dans un cadre sous son texte, quel
 * que soit son type. Premier cas : la carte des mobilisations du 26 septembre.
 *
 * ⚠️ Chaque origine ajoutée ici doit AUSSI figurer dans `frame-src` de la CSP
 * (`next.config.mjs`), sinon le navigateur affiche un cadre vide.
 */
const CARTES_INTEGRABLES = new Set(['26septembre.org']);

function carteIntegrable(url: string | null): boolean {
  if (url === null) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && CARTES_INTEGRABLES.has(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Seconde illustration d'un article (2026-09-24) : quand `media_url` pointe
 * vers une IMAGE de notre propre stockage (bucket public `media`), l'article
 * l'affiche sous son texte. Premier cas : la tribune « Fin du monde, fin du
 * mois » parue dans Regards et dans Basta!, chacune avec son illustration.
 * On n'accepte que notre stockage : une image d'un site tiers pourrait
 * disparaître ou changer sans prévenir.
 */
function imageIllustration(url: string | null): boolean {
  if (url === null) return false;
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      u.hostname.endsWith('.supabase.co') &&
      u.pathname.startsWith('/storage/v1/object/public/media/') &&
      /\.(jpe?g|png|webp)$/i.test(u.pathname)
    );
  } catch {
    return false;
  }
}

/** Une adresse web dans le texte d'un article : http(s), jusqu'au prochain blanc. */
const MOTIF_ADRESSE = /(https?:\/\/[^\s<>"]+)/g;

/**
 * Le corps est du texte brut. Pour que les adresses citées (« Tribune publiée
 * dans Regards : https://… ») soient cliquables sans ouvrir la porte au HTML,
 * on découpe le texte autour des adresses et on ne fabrique que des liens.
 * Un point ou une virgule collés à la fin de l'adresse restent du texte.
 */
function CorpsAvecLiens({ texte }: { texte: string }) {
  return (
    <>
      {texte.split(MOTIF_ADRESSE).map((morceau, i) => {
        if (i % 2 === 0) return morceau;
        const ponctuation = /[.,;:!?)»]+$/.exec(morceau)?.[0] ?? '';
        const adresse = morceau.slice(0, morceau.length - ponctuation.length);
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: les morceaux n'ont pas d'identité propre, l'ordre du découpage est stable
          <span key={i}>
            <a href={adresse} target="_blank" rel="noopener noreferrer" className="underline">
              {adresse}
            </a>
            {ponctuation}
          </span>
        );
      })}
    </>
  );
}

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

  // Épinglage « à la une » de la home : depuis la clarification du 2026-06-11,
  // l'emplacement 'article' de la home pointe sur les articles Maintenant
  // Médias (le bouton vivait avant sur les éditions du journal-affiche).
  const estEpingleUne = estAdmin ? (await idEpingleUneHome('article')) === media.id : false;

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
            <span className="flex flex-wrap items-center gap-2">
              {estAdmin ? (
                <BoutonMettreALaUne
                  emplacement="article"
                  objetId={media.id}
                  estEpingleInitial={estEpingleUne}
                />
              ) : null}
              <BoutonAdminEditer href={`/admin/national/medias/${media.id}`}>
                Modifier
              </BoutonAdminEditer>
              <BoutonAdminEditer href={`/admin/moderation/media?id=${media.id}`}>
                Modérer
              </BoutonAdminEditer>
            </span>
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
                {media.source_url} <ExternalLink size={12} className="inline" aria-hidden="true" />
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
          <img src={media.vignette_url} alt="" className="w-full rounded-md border border-border" />
        ) : null}

        <section className="prose grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
          <CorpsAvecLiens texte={media.corps} />
        </section>

        {imageIllustration(media.media_url) ? (
          <img
            src={media.media_url ?? undefined}
            alt=""
            loading="lazy"
            className="w-full rounded-md border border-border"
          />
        ) : null}

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

        {carteIntegrable(media.media_url) ? (
          <iframe
            src={media.media_url ?? undefined}
            title={media.titre}
            width="100%"
            height={620}
            loading="lazy"
            className="w-full rounded-md border border-border"
          />
        ) : null}

        {media.media_url !== null && media.type === 'podcast' ? (
          // biome-ignore lint/a11y/useMediaCaption: podcast audio externe sans piste de sous-titres disponible ; pas de <track> vide non fonctionnel.
          <audio controls className="w-full">
            <source src={media.media_url} />
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
