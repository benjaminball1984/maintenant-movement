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
    "Les tribunes et les articles sont ouverts à toustes : proposez le vôtre, la rédaction le relit avant publication. Les éditos et la newsletter sont produits par l'équipe nationale.",
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
/**
 * Onglets de format de la revue de presse (contenus externes). Les
 * contenus MAISON (édito, tribune, article, newsletter) ne sont plus des
 * onglets séparés : ils sont regroupés dans l'onglet « Rédaction »
 * (demande Ben 2026-06-13).
 */
const TYPES_ONGLETS: TypeMedia[] = ['dessin', 'podcast', 'video'];

/** Tous les types acceptés en paramètre `?type=` (liens directs inclus). */
const LISTE_TYPES: TypeMedia[] = [
  'edito',
  'tribune',
  'article',
  'newsletter',
  'breve',
  ...TYPES_ONGLETS,
];

/** Pseudo-vue « Rédaction » : tous les contenus maison, par date. */
const VUE_REDACTION = 'redaction';

/** Nombre d'articles de la rédaction affichés sur la page générale (Ben). */
const MAX_REDACTION_GENERALE = 3;

function estTypeValide(v: string | undefined): v is TypeMedia {
  return v !== undefined && (LISTE_TYPES as string[]).includes(v);
}

export default async function PageMedia({ searchParams }: PageMediaProps) {
  const { type, tag } = await searchParams;
  const vueRedaction = type === VUE_REDACTION;
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
  // Épingle de la une (partagée avec la home, emplacement « article ») :
  // sert à l'état du bouton admin sur chaque carte, sur toutes les vues.
  const idUneEpingle = await idEpingleUneHome('article');

  let medias: Awaited<ReturnType<typeof listerMediasPublies>> = [];
  let redaction: Awaited<ReturnType<typeof listerMediasMaison>> = [];
  let une: Awaited<ReturnType<typeof mediaPublieParId>> = null;
  if (vueRedaction) {
    // Onglet « Rédaction » : TOUS les contenus maison, du plus récent au
    // plus ancien (demande Ben 2026-06-13). La une en tête, le reste sous
    // « La rédaction », pas de section « Revue de presse ».
    const maison = await listerMediasMaison(250);
    une = maison[0] ?? null;
    redaction = maison.slice(1);
    medias = [];
  } else if (filtre !== undefined) {
    // Onglet d'un format précis (dessins, podcasts, vidéos, lives, ou un
    // type maison via lien direct). On partitionne maison / revue de presse.
    const tousDuType = await listerMediasPublies(filtre, 250);
    const maisonDuType = tousDuType.filter((m) => m.provenance_externe === null);
    une = maisonDuType[0] ?? null;
    redaction = maisonDuType.slice(1);
    medias = tousDuType.filter((m) => m.provenance_externe !== null);
  } else {
    const [flux, maison] = await Promise.all([listerFluxMedias(tagActif), listerMediasMaison()]);
    if (tagActif === undefined) {
      // La une : UNIQUEMENT l'épingle admin (N'IMPORTE QUEL contenu,
      // podcast/dessin/vidéo ou même une brève choisie explicitement,
      // demande Ben 2026-06-13). Depuis le 15/08/2026 (décision Ben),
      // plus de repli automatique sur le contenu maison le plus récent :
      // sans épinglage, la page démarre directement sur « La rédaction ».
      une = idUneEpingle !== null ? await mediaPublieParId(idUneEpingle) : null;
      // Page générale : la rédaction est BORNÉE (Ben 2026-06-13, 3 max) ;
      // tout le reste de la rédaction est dans l'onglet « Rédaction ».
      redaction = maison.filter((m) => m.id !== une?.id).slice(0, MAX_REDACTION_GENERALE);
      // Flux principal VARIÉ : tout le flux externe mêlé (brèves + dessins
      // + vidéos + lives + podcasts), antichronologique.
      medias = flux.filter((m) => m.provenance_externe !== null && m.id !== une?.id);
    } else {
      // Filtre par tag : juste le flux externe correspondant (la une et le
      // bandeau rédaction, non filtrés, n'ont pas de sens ici).
      medias = flux.filter((m) => m.provenance_externe !== null);
    }
  }
  const ongletActif = vueRedaction ? VUE_REDACTION : (filtre ?? 'tous');

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
        {/* Onglet « Rédaction » : tous les contenus maison (Ben 2026-06-13). */}
        <Link
          href={`/s-informer/media?type=${VUE_REDACTION}`}
          className={
            ongletActif === VUE_REDACTION
              ? 'border-b-2 border-brand px-3 py-2 text-sm text-brand'
              : 'border-b-2 border-transparent px-3 py-2 text-sm text-text-3 hover:text-text-1'
          }
        >
          Rédaction
        </Link>
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

      {filtre === undefined && !vueRedaction ? (
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
        <MosaiqueMedias
          une={une}
          redaction={redaction}
          medias={medias}
          estAdmin={estAdmin}
          idUneEpingle={idUneEpingle}
        />
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
