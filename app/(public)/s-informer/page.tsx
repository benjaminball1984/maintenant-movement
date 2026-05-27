import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { compter } from '@/lib/pluriel';
import { getSupabaseServer } from '@/lib/supabase';
import { CheckCircle, FileText, Newspaper, Radio, Search, Users, Video, Vote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACK_TITRE = 'S’informer';
const FALLBACK_INTRO =
  'Articles, brèves, podcasts, vidéos, sondages, journal-affiche imprimable, salles de décision, réseau social du mouvement. Tout ce qui circule à l’intérieur de Maintenant! et qui s’adresse au plus grand nombre.';

// Microcopy editable admin : preheader, chips CTA, et Alert «  pas encore
// connecte ?  ». Decoupage de l'Alert : titre, amorce avant le lien, libelle
// du lien, fin apres le lien. Le lien lui-meme reste en dur (URL fixe).
const FALLBACK_PREHEADER = 'Espace';
const FALLBACK_CTA_RECHERCHE = 'Recherche globale';
const FALLBACK_CTA_AGENDA = 'Agenda agrégé';
const FALLBACK_ALERT_TITRE = 'Pas encore connecté·e ?';
const FALLBACK_ALERT_AMORCE =
  'Tu peux lire les contenus publics sans compte. Pour publier, soutenir, voter ou rejoindre une salle Décider,';
const FALLBACK_ALERT_LIEN_LABEL = 'crée un compte';
const FALLBACK_ALERT_FIN = '(gratuit, 1 minute).';

// Cf. /mobiliser, /agir : titres = vocabulaire fixe, descriptions = editable.
const CARTES_DESCRIPTIONS: Record<string, string> = {
  media: 'Édito, tribune, articles, brèves, dessins, podcasts, vidéos, lives, newsletter.',
  radio: 'Webradio communautaire (en construction).',
  journal: 'Journal-affiche imprimable A3/A4 à coller dans l’espace public. Patchwork de modules.',
  reseau: 'Flux hiérarchisé, profil par numéro M+7, publications, soutiens, messagerie interne.',
  sondages: 'Sondages classiques et pondérés ouverts au mouvement. Résultats publics.',
  decider:
    'Infrastructure de la décision en réunion. 3 modes : consensus, levée d’objections, jugement majoritaire.',
};

export const metadata: Metadata = {
  title: 'S’informer',
  description:
    'Articles, brèves, podcasts, vidéos. Sondages, journal-affiche, salles de décision, réseau social du mouvement.',
};

interface CarteSousEspace {
  slug: string;
  titre: string;
  description: string;
  icone: LucideIcon;
  href: string;
  /** Compteur dynamique. Si undefined, on affiche pas de badge. */
  compteurFn?: () => Promise<number>;
  compteurLibelle?: string;
  /** Statut si non encore livré. */
  enConstruction?: boolean;
}

/**
 * Page hub `/s-informer` (refonte V2.4 : sortie du squelette « chantier 7.x »
 * vers une vraie home vivante avec compteurs réels et liens fonctionnels).
 */
export default async function PageSInformer() {
  const supabase = await getSupabaseServer();

  const slugsDescriptions = Object.keys(CARTES_DESCRIPTIONS);

  // Compteurs + textes editoriaux + estAdmin en parallèle pour ne pas allonger le TTFB.
  const [
    mediasPub,
    journalPub,
    sondagesOuv,
    sallesDecider,
    postsReseau,
    estAdmin,
    titre,
    intro,
    ...descriptionsLues
  ] = await Promise.all([
    supabase.from('media').select('id', { count: 'exact', head: true }).eq('statut', 'publie'),
    supabase
      .from('journal_affiche')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'publie'),
    supabase.from('sondage').select('id', { count: 'exact', head: true }).eq('statut', 'ouvert'),
    supabase.from('salle_decider').select('id', { count: 'exact', head: true }),
    supabase
      .from('post_reseau')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'publie'),
    estAdminCourant(),
    lireContenuEditorial('s-informer.titre', { valeurMd: FALLBACK_TITRE }),
    lireContenuEditorial('s-informer.intro', { valeurMd: FALLBACK_INTRO }),
    ...slugsDescriptions.map((slug) =>
      lireContenuEditorial(`s-informer.carte.${slug}.description`, {
        valeurMd: CARTES_DESCRIPTIONS[slug] ?? '',
      }),
    ),
  ]);

  // Microcopy editable, lecture en parallele.
  const [preheader, ctaRecherche, ctaAgenda, alertTitre, alertAmorce, alertLienLabel, alertFin] =
    await Promise.all([
      lireContenuEditorial('hub.preheader.espace', { valeurMd: FALLBACK_PREHEADER }),
      lireContenuEditorial('s-informer.cta.recherche', { valeurMd: FALLBACK_CTA_RECHERCHE }),
      lireContenuEditorial('s-informer.cta.agenda', { valeurMd: FALLBACK_CTA_AGENDA }),
      lireContenuEditorial('s-informer.alert.titre', { valeurMd: FALLBACK_ALERT_TITRE }),
      lireContenuEditorial('s-informer.alert.amorce', { valeurMd: FALLBACK_ALERT_AMORCE }),
      lireContenuEditorial('s-informer.alert.lien_label', {
        valeurMd: FALLBACK_ALERT_LIEN_LABEL,
      }),
      lireContenuEditorial('s-informer.alert.fin', { valeurMd: FALLBACK_ALERT_FIN }),
    ]);

  const descriptionParSlug = new Map<string, string>(
    slugsDescriptions.map((slug, i) => [slug, descriptionsLues[i]?.valeurMd ?? '']),
  );

  const sousEspaces: CarteSousEspace[] = [
    {
      slug: 'media',
      titre: 'Média Maintenant',
      description: descriptionParSlug.get('media') ?? '',
      icone: Newspaper,
      href: '/s-informer/media',
      compteurLibelle: 'publié',
      compteurFn: async () => mediasPub.count ?? 0,
    },
    {
      slug: 'radio',
      titre: 'Maintenant Radio',
      description: descriptionParSlug.get('radio') ?? '',
      icone: Radio,
      href: '/s-informer/radio',
      enConstruction: true,
    },
    {
      slug: 'journal',
      titre: 'Maintenant Médias',
      description: descriptionParSlug.get('journal') ?? '',
      icone: FileText,
      href: '/s-informer/journal',
      compteurLibelle: 'édition',
      compteurFn: async () => journalPub.count ?? 0,
    },
    {
      slug: 'reseau',
      titre: 'Réseau social',
      description: descriptionParSlug.get('reseau') ?? '',
      icone: Users,
      href: '/s-informer/reseau',
      compteurLibelle: 'publication',
      compteurFn: async () => postsReseau.count ?? 0,
    },
    {
      slug: 'sondages',
      titre: 'Sondages',
      description: descriptionParSlug.get('sondages') ?? '',
      icone: Vote,
      href: '/s-informer/sondages',
      compteurLibelle: 'ouvert',
      compteurFn: async () => sondagesOuv.count ?? 0,
    },
    {
      slug: 'decider',
      titre: 'Décider',
      description: descriptionParSlug.get('decider') ?? '',
      icone: Video,
      href: '/s-informer/decider',
      compteurLibelle: 'salle',
      compteurFn: async () => sallesDecider.count ?? 0,
    },
  ];

  // Précalcule les compteurs (déjà fait en parallèle au-dessus, ici on
  // matérialise la promesse pour le rendu).
  const cartes = await Promise.all(
    sousEspaces.map(async (se) => ({
      ...se,
      nb: se.compteurFn !== undefined ? await se.compteurFn() : null,
    })),
  );

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <TexteEditableAdmin
          cle="hub.preheader.espace"
          valeurInitiale={preheader.valeurMd}
          estAdmin={estAdmin}
          libelle="preheader 'Espace' des pages hub (cle partagee)"
          longueurMax={30}
        >
          {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="s-informer.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre de la page s-informer"
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="s-informer.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro de la page s-informer"
          multilignes
          longueurMax={800}
        >
          {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
        </TexteEditableAdmin>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <TexteEditableAdmin
            cle="s-informer.cta.recherche"
            valeurInitiale={ctaRecherche.valeurMd}
            estAdmin={estAdmin}
            libelle="libelle du chip CTA Recherche"
            longueurMax={60}
          >
            {(t) => (
              <Link
                href="/recherche"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-text-2 hover:bg-surface-2"
              >
                <Search size={14} aria-hidden="true" />
                {t}
              </Link>
            )}
          </TexteEditableAdmin>
          <TexteEditableAdmin
            cle="s-informer.cta.agenda"
            valeurInitiale={ctaAgenda.valeurMd}
            estAdmin={estAdmin}
            libelle="libelle du chip CTA Agenda"
            longueurMax={60}
          >
            {(t) => (
              <Link
                href="/agenda"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-text-2 hover:bg-surface-2"
              >
                {t}
              </Link>
            )}
          </TexteEditableAdmin>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartes.map((c) => {
          const Icone = c.icone;
          return (
            <Link key={c.slug} href={c.href} className="block hover:opacity-90">
              <Card variant="ombre" className="grid h-full gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Icone size={28} className="text-brand" aria-hidden="true" />
                  {c.enConstruction ? (
                    <Badge variant="warning">En construction</Badge>
                  ) : c.nb !== null && c.nb !== undefined && c.compteurLibelle ? (
                    <Badge variant="success">
                      <CheckCircle size={12} aria-hidden="true" />
                      {compter(c.nb, c.compteurLibelle)}
                    </Badge>
                  ) : null}
                </div>
                <h2 className="font-display font-bold text-lg text-text-1">{c.titre}</h2>
                <TexteEditableAdmin
                  cle={`s-informer.carte.${c.slug}.description`}
                  valeurInitiale={c.description}
                  estAdmin={estAdmin}
                  libelle={`description de la carte ${c.titre}`}
                  multilignes
                  longueurMax={400}
                >
                  {(t) => <p className="text-sm text-text-2">{t}</p>}
                </TexteEditableAdmin>
              </Card>
            </Link>
          );
        })}
      </section>

      <Alert
        variant="info"
        titre={
          <TexteEditableAdmin
            cle="s-informer.alert.titre"
            valeurInitiale={alertTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre de l'Alert bas de page s-informer"
            longueurMax={80}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        }
        className="mt-8"
      >
        <TexteEditableAdmin
          cle="s-informer.alert.amorce"
          valeurInitiale={alertAmorce.valeurMd}
          estAdmin={estAdmin}
          libelle="amorce avant le lien dans l'Alert s-informer"
          multilignes
          longueurMax={300}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>{' '}
        <TexteEditableAdmin
          cle="s-informer.alert.lien_label"
          valeurInitiale={alertLienLabel.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle du lien dans l'Alert s-informer"
          longueurMax={50}
        >
          {(t) => (
            <Link href="/inscription" className="underline">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>{' '}
        <TexteEditableAdmin
          cle="s-informer.alert.fin"
          valeurInitiale={alertFin.valeurMd}
          estAdmin={estAdmin}
          libelle="fin apres le lien dans l'Alert s-informer"
          longueurMax={200}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Alert>
    </Container>
  );
}
