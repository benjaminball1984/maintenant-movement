import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { compter } from '@/lib/pluriel';
import { getSupabaseServer } from '@/lib/supabase';
import { CalendarRange, HandHeart, MapPin, MoreHorizontal, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACK_TITRE = 'Agir';
const FALLBACK_INTRO =
  'Passer à l’action concrète : adhérer, activer ou rejoindre une commune libre, participer à un moment solidaire près de chez toi, ou agir autrement.';
const FALLBACK_PREHEADER = 'Espace';

// Cf. /mobiliser : titres = vocabulaire fixe, descriptions = editorial editable.
const CARTES_DESCRIPTIONS: Record<string, string> = {
  adherer:
    'Rejoindre Maintenant! Adhésion gratuite, en euros ou en 99-coin. Cotisation solidaire libre.',
  communes:
    'Activer une commune libre près de chez toi, rejoindre la sienne. Près de 35 000 communes pré-créées.',
  federations: 'Regroupements géographiques ou thématiques de communes.',
  'moments-solidaires':
    'Porte-à-porte, maraudes, vide-greniers, manifestations, repas solidaires, concerts.',
  'autres-moyens': 'Devenir bénévole sur un chantier, héberger un événement, prêter du matériel.',
};

export const metadata: Metadata = {
  title: 'Agir',
  description:
    'Adhérer au mouvement, rejoindre une commune libre, participer à un moment solidaire, agir autrement.',
};

interface Carte {
  slug: string;
  titre: string;
  description: string;
  icone: LucideIcon;
  href: string;
  badge?: string;
}

/**
 * Page hub `/agir` (refonte V2.4 : sortie du squelette « chantier 5.x »).
 */
export default async function PageAgir() {
  const supabase = await getSupabaseServer();

  const slugsDescriptions = Object.keys(CARTES_DESCRIPTIONS);

  const [
    communesLibres,
    momentsAVenir,
    federations,
    estAdmin,
    titre,
    intro,
    preheader,
    ...descriptionsLues
  ] = await Promise.all([
    supabase
      .from('commune')
      .select('id', { count: 'exact', head: true })
      .neq('statut_creation', 'pre_creee'),
    supabase
      .from('moment_solidaire')
      .select('id', { count: 'exact', head: true })
      .in('statut', ['annonce', 'en_cours'])
      .gte('commence_le', new Date().toISOString()),
    supabase.from('federation').select('id', { count: 'exact', head: true }),
    estAdminCourant(),
    lireContenuEditorial('agir.titre', { valeurMd: FALLBACK_TITRE }),
    lireContenuEditorial('agir.intro', { valeurMd: FALLBACK_INTRO }),
    lireContenuEditorial('hub.preheader.espace', { valeurMd: FALLBACK_PREHEADER }),
    ...slugsDescriptions.map((slug) =>
      lireContenuEditorial(`agir.carte.${slug}.description`, {
        valeurMd: CARTES_DESCRIPTIONS[slug] ?? '',
      }),
    ),
  ]);

  const descriptionParSlug = new Map<string, string>(
    slugsDescriptions.map((slug, i) => [slug, descriptionsLues[i]?.valeurMd ?? '']),
  );

  const cartes: Carte[] = [
    {
      slug: 'adherer',
      titre: 'Adhérer',
      description: descriptionParSlug.get('adherer') ?? '',
      icone: HandHeart,
      href: '/agir/adherer',
    },
    {
      slug: 'communes',
      titre: 'Communes libres',
      description: descriptionParSlug.get('communes') ?? '',
      icone: MapPin,
      href: '/agir/communes',
      badge: `${communesLibres.count ?? 0} actives`,
    },
    {
      slug: 'federations',
      titre: 'Fédérations',
      description: descriptionParSlug.get('federations') ?? '',
      icone: Users,
      href: '/agir/federations',
      badge: compter(federations.count ?? 0, 'fédération'),
    },
    {
      slug: 'moments-solidaires',
      titre: 'Moments solidaires',
      description: descriptionParSlug.get('moments-solidaires') ?? '',
      icone: CalendarRange,
      href: '/agir/moments-solidaires',
      badge: `${momentsAVenir.count ?? 0} à venir`,
    },
    {
      slug: 'autres-moyens',
      titre: 'D’autres moyens d’agir',
      description: descriptionParSlug.get('autres-moyens') ?? '',
      icone: MoreHorizontal,
      href: '/agir/autres-moyens',
    },
  ];

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
          cle="agir.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre de la page agir"
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="agir.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro de la page agir"
          multilignes
          longueurMax={500}
        >
          {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartes.map((c) => {
          const Icone = c.icone;
          return (
            <Link key={c.slug} href={c.href} className="block hover:opacity-90">
              <Card variant="ombre" className="grid h-full gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Icone size={28} className="text-brand" aria-hidden="true" />
                  {c.badge !== undefined ? <Badge variant="success">{c.badge}</Badge> : null}
                </div>
                <h2 className="font-display font-bold text-lg text-text-1">{c.titre}</h2>
                <TexteEditableAdmin
                  cle={`agir.carte.${c.slug}.description`}
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
    </Container>
  );
}
