import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { MosaiqueMedias } from '@/components/media/MosaiqueMedias';
import { Alert, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { idEpingleUneHome } from '@/lib/home/une';
import { TAGS_BREVES } from '@/lib/import-breves/tags';
import {
  listerFluxMedias,
  listerMediasMaison,
  listerMediasPublies,
  mediaPublieParId,
} from '@/lib/media/requetes';
import { cn } from '@/lib/utils';
import type { TypeMedia } from '@/types/database';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACKS = {
  introAmorce:
    'Les articles de la rédaction et la revue de presse de Maintenant! : brèves des médias indépendants et internationaux, dans leur langue, reliées à leur source. Voir aussi',
  introMilieu: 'et',
  introFin: '.',
  ongletTous: 'À la une',
  emptyTitre: 'Aucun média publié pour ce filtre',
  emptyCorps:
    "La rédaction publiera bientôt. Les éditos et la newsletter sont produits par l'équipe nationale ; tribunes et articles sont ouverts à toustes (modération a posteriori).",
  rédactionDefault: 'Rédaction',
};

export const metadata: Metadata = {
  title: 'Maintenant Médias',
  description:
    'Articles de la rédaction et revue de presse des médias indépendants et internationaux.',
};

interface PageMediaProps {
  searchParams: Promise<{ type?: string; tag?: string }>;
}

const LIBELLE_TYPE: Record<TypeMedia, string> = {
  edito: 'Éditos',
  tribune: 'Tribunes',
  article: 'Articles',
  breve: 'Brèves',
  dessin: 'Dessins',
  podcast: 'Podcasts',
  video: 'Vidéos',
  live: 'Lives',
  newsletter: 'Newsletter',
};

/**
 * Onglets affichés : l'espace « Brèves » dédié est supprimé (revue
 * 2026-06-12, Ben) : la revue de presse vit dans la vue principale,
 * mêlée aux contenus maison.
 */
const TYPES_ONGLETS: TypeMedia[] = [
  'edito',
  'tribune',
  'article',
  'dessin',
  'podcast',
  'video',
  'live',
  'newsletter',
];

const LISTE_TYPES: TypeMedia[] = [...TYPES_ONGLETS, 'breve'];

function estTypeValide(v: string | undefined): v is TypeMedia {
  return v !== undefined && (LISTE_TYPES as string[]).includes(v);
}

export default async function PageMedia({ searchParams }: PageMediaProps) {
  const { type, tag } = await searchParams;
  const filtre = estTypeValide(type) ? type : undefined;
  const tagActif = tag !== undefined && TAGS_BREVES.includes(tag) ? tag : undefined;

  const [estAdmin, introAmorce, introMilieu, introFin, ongletTous, emptyTitre, emptyCorps] =
    await Promise.all([
      estAdminCourant(),
      lireContenuEditorial('s-informer.media.intro_amorce', { valeurMd: FALLBACKS.introAmorce }),
      lireContenuEditorial('s-informer.media.intro_milieu', { valeurMd: FALLBACKS.introMilieu }),
      lireContenuEditorial('s-informer.media.intro_fin', { valeurMd: FALLBACKS.introFin }),
      lireContenuEditorial('s-informer.media.onglet_tous', { valeurMd: FALLBACKS.ongletTous }),
      lireContenuEditorial('s-informer.media.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
      lireContenuEditorial('s-informer.media.empty_corps', { valeurMd: FALLBACKS.emptyCorps }),
    ]);

  // Toutes les vues (principale ET onglets par format) suivent les 3
  // logiques : une, bandeau « La rédaction », séparateur « Revue de
  // presse » avant les contenus externes (demande Ben 2026-06-13).
  let medias: Awaited<ReturnType<typeof listerMediasPublies>> = [];
  let redaction: Awaited<ReturnType<typeof listerMediasMaison>> = [];
  let une: Awaited<ReturnType<typeof mediaPublieParId>> = null;
  if (filtre !== undefined) {
    // Onglet d'un format précis (brèves, dessins, podcasts, vidéos,
    // lives, ou un type maison). On partitionne maison / revue de presse.
    const tousDuType = await listerMediasPublies(filtre, 250);
    const maisonDuType = tousDuType.filter((m) => m.provenance_externe === null);
    une = maisonDuType[0] ?? null;
    redaction = maisonDuType.slice(1);
    medias = tousDuType.filter((m) => m.provenance_externe !== null);
  } else {
    const [flux, maison, idUne] = await Promise.all([
      listerFluxMedias(tagActif),
      listerMediasMaison(),
      idEpingleUneHome('article'),
    ]);
    if (tagActif === undefined) {
      // La une appartient à la rédaction : l'épingle admin si elle existe,
      // sinon le contenu maison le plus récent (JAMAIS une brève importée).
      const epingle = idUne !== null ? await mediaPublieParId(idUne) : null;
      une = epingle !== null && epingle.type !== 'breve' ? epingle : (maison[0] ?? null);
      redaction = maison.filter((m) => m.id !== une?.id);
      medias = flux.filter((m) => m.type === 'breve');
    } else {
      medias = flux.filter((m) => m.id !== une?.id);
    }
  }
  const ongletActif = filtre ?? 'tous';

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
        <Heading niveau={1}>Maintenant Médias</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          <TexteEditableAdmin
            cle="s-informer.media.intro_amorce"
            valeurInitiale={introAmorce.valeurMd}
            estAdmin={estAdmin}
            libelle="amorce intro media (avant Maintenant Radio)"
            multilignes
            longueurMax={400}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          <Link href="/s-informer/radio" className="underline">
            Maintenant Radio
          </Link>{' '}
          <TexteEditableAdmin
            cle="s-informer.media.intro_milieu"
            valeurInitiale={introMilieu.valeurMd}
            estAdmin={estAdmin}
            libelle="conjonction au milieu (et)"
            longueurMax={20}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          <Link href="/s-informer/journal" className="underline">
            Le Peuple à l'Affiche (journal-affiche)
          </Link>
          <TexteEditableAdmin
            cle="s-informer.media.intro_fin"
            valeurInitiale={introFin.valeurMd}
            estAdmin={estAdmin}
            libelle="fin intro (.)"
            longueurMax={20}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </p>
      </header>

      <nav aria-label="Type de média" className="mb-8 flex flex-wrap gap-2 border-b border-border">
        <TexteEditableAdmin
          cle="s-informer.media.onglet_tous"
          valeurInitiale={ongletTous.valeurMd}
          estAdmin={estAdmin}
          libelle="onglet Tous media"
          longueurMax={20}
        >
          {(t) => (
            <Link
              href="/s-informer/media"
              className={
                ongletActif === 'tous'
                  ? 'border-b-2 border-brand px-3 py-2 text-sm text-brand'
                  : 'border-b-2 border-transparent px-3 py-2 text-sm text-text-3 hover:text-text-1'
              }
            >
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
        {TYPES_ONGLETS.map((t) => (
          <Link
            key={t}
            href={`/s-informer/media?type=${t}`}
            className={
              ongletActif === t
                ? 'border-b-2 border-brand px-3 py-2 text-sm text-brand'
                : 'border-b-2 border-transparent px-3 py-2 text-sm text-text-3 hover:text-text-1'
            }
          >
            {LIBELLE_TYPE[t]}
          </Link>
        ))}
      </nav>

      {filtre === undefined ? (
        <nav aria-label="Filtrer par tag" className="mb-6 flex flex-wrap items-center gap-2">
          <Link
            href="/s-informer/media"
            className={cn(
              'rounded-pill border px-3 py-1 text-xs',
              tagActif === undefined
                ? 'border-brand bg-brand text-white'
                : 'border-border bg-surface text-text-2 hover:bg-surface-2',
            )}
          >
            Tous
          </Link>
          {TAGS_BREVES.map((t) => (
            <Link
              key={t}
              href={`/s-informer/media?tag=${encodeURIComponent(t)}`}
              className={cn(
                'rounded-pill border px-3 py-1 text-xs',
                tagActif === t
                  ? 'border-brand bg-brand text-white'
                  : 'border-border bg-surface text-text-2 hover:bg-surface-2',
              )}
            >
              {t}
            </Link>
          ))}
        </nav>
      ) : null}

      {medias.length > 0 || une !== null || redaction.length > 0 ? (
        <MosaiqueMedias une={une} redaction={redaction} medias={medias} />
      ) : (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="s-informer.media.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty state media"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          <TexteEditableAdmin
            cle="s-informer.media.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty state media"
            multilignes
            longueurMax={400}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      )}
    </Container>
  );
}
