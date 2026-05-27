import { Badge, Card, Container, Heading } from '@/components/ui';
import { compter } from '@/lib/pluriel';
import { getSupabaseServer } from '@/lib/supabase';
import { CalendarRange, HandHeart, MapPin, MoreHorizontal, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

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

  const [communesLibres, momentsAVenir, federations] = await Promise.all([
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
  ]);

  const cartes: Carte[] = [
    {
      slug: 'adherer',
      titre: 'Adhérer',
      description:
        'Rejoindre Maintenant! Adhésion gratuite, en euros ou en 99-coin. Cotisation solidaire libre.',
      icone: HandHeart,
      href: '/agir/adherer',
    },
    {
      slug: 'communes',
      titre: 'Communes libres',
      description:
        'Activer une commune libre près de chez toi, rejoindre la sienne. Près de 35 000 communes pré-créées.',
      icone: MapPin,
      href: '/agir/communes',
      badge: `${communesLibres.count ?? 0} actives`,
    },
    {
      slug: 'federations',
      titre: 'Fédérations',
      description: 'Regroupements géographiques ou thématiques de communes.',
      icone: Users,
      href: '/agir/federations',
      badge: compter(federations.count ?? 0, 'fédération'),
    },
    {
      slug: 'moments-solidaires',
      titre: 'Moments solidaires',
      description:
        'Porte-à-porte, maraudes, vide-greniers, manifestations, repas solidaires, concerts.',
      icone: CalendarRange,
      href: '/agir/moments-solidaires',
      badge: `${momentsAVenir.count ?? 0} à venir`,
    },
    {
      slug: 'autres-moyens',
      titre: 'D’autres moyens d’agir',
      description: 'Devenir bénévole sur un chantier, héberger un événement, prêter du matériel.',
      icone: MoreHorizontal,
      href: '/agir/autres-moyens',
    },
  ];

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Espace</p>
        <Heading niveau={1}>Agir</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Passer à l’action concrète : adhérer, activer ou rejoindre une commune libre, participer à
          un moment solidaire près de chez toi, ou agir autrement.
        </p>
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
                <p className="text-sm text-text-2">{c.description}</p>
              </Card>
            </Link>
          );
        })}
      </section>
    </Container>
  );
}
