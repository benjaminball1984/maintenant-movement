import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { compter } from '@/lib/pluriel';
import { getSupabaseServer } from '@/lib/supabase';
import { CheckCircle, FileText, Newspaper, Radio, Search, Users, Video, Vote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

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

  // Compteurs en parallèle pour ne pas allonger le TTFB.
  const [mediasPub, journalPub, sondagesOuv, sallesDecider, postsReseau] = await Promise.all([
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
  ]);

  const sousEspaces: CarteSousEspace[] = [
    {
      slug: 'media',
      titre: 'Média Maintenant',
      description:
        'Édito, tribune, articles, brèves, dessins, podcasts, vidéos, lives, newsletter.',
      icone: Newspaper,
      href: '/s-informer/media',
      compteurLibelle: 'publié',
      compteurFn: async () => mediasPub.count ?? 0,
    },
    {
      slug: 'radio',
      titre: 'Maintenant Radio',
      description: 'Webradio communautaire (en construction).',
      icone: Radio,
      href: '/s-informer/radio',
      enConstruction: true,
    },
    {
      slug: 'journal',
      titre: 'Maintenant Médias',
      description:
        'Journal-affiche imprimable A3/A4 à coller dans l’espace public. Patchwork de modules.',
      icone: FileText,
      href: '/s-informer/journal',
      compteurLibelle: 'édition',
      compteurFn: async () => journalPub.count ?? 0,
    },
    {
      slug: 'reseau',
      titre: 'Réseau social',
      description:
        'Flux hiérarchisé, profil par numéro M+7, publications, soutiens, messagerie interne.',
      icone: Users,
      href: '/s-informer/reseau',
      compteurLibelle: 'publication',
      compteurFn: async () => postsReseau.count ?? 0,
    },
    {
      slug: 'sondages',
      titre: 'Sondages',
      description: 'Sondages classiques et pondérés ouverts au mouvement. Résultats publics.',
      icone: Vote,
      href: '/s-informer/sondages',
      compteurLibelle: 'ouvert',
      compteurFn: async () => sondagesOuv.count ?? 0,
    },
    {
      slug: 'decider',
      titre: 'Décider',
      description:
        'Infrastructure de la décision en réunion. 3 modes : consensus, levée d’objections, jugement majoritaire.',
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
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Espace</p>
        <Heading niveau={1}>S’informer</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Articles, brèves, podcasts, vidéos, sondages, journal-affiche imprimable, salles de
          décision, réseau social du mouvement. Tout ce qui circule à l’intérieur de Maintenant! et
          qui s’adresse au plus grand nombre.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link
            href="/recherche"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-text-2 hover:bg-surface-2"
          >
            <Search size={14} aria-hidden="true" />
            Recherche globale
          </Link>
          <Link
            href="/agenda"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-text-2 hover:bg-surface-2"
          >
            Agenda agrégé
          </Link>
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
                <p className="text-sm text-text-2">{c.description}</p>
              </Card>
            </Link>
          );
        })}
      </section>

      <Alert variant="info" titre="Pas encore connecté·e ?" className="mt-8">
        Tu peux lire les contenus publics sans compte. Pour publier, soutenir, voter ou rejoindre
        une salle Décider,{' '}
        <Link href="/inscription" className="underline">
          crée un compte
        </Link>{' '}
        (gratuit, 1 minute).
      </Alert>
    </Container>
  );
}
