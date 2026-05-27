import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { compter } from '@/lib/pluriel';
import { getSupabaseServer } from '@/lib/supabase';
import { CalendarRange, Flag, PenSquare, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACK_TITRE = 'Mobiliser';
const FALLBACK_INTRO =
  'Les outils de mobilisation du mouvement : interpeller, manifester, financer, regrouper.';

export const metadata: Metadata = {
  title: 'Mobiliser',
  description: 'Pétitions, mobilisations, cagnottes, campagnes du mouvement.',
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
 * Page hub `/mobiliser` (refonte V2.4 : sortie du squelette « chantier 3.x »).
 */
export default async function PageMobiliser() {
  const supabase = await getSupabaseServer();

  const [petitions, mobilisations, cagnottes, campagnes, estAdmin, titre, intro] =
    await Promise.all([
      supabase
        .from('petition')
        .select('id', { count: 'exact', head: true })
        .eq('statut', 'publiee'),
      supabase
        .from('mobilisation')
        .select('id', { count: 'exact', head: true })
        .eq('statut', 'publiee')
        .gte('date_debut', new Date().toISOString()),
      supabase
        .from('cagnotte')
        .select('id', { count: 'exact', head: true })
        .eq('statut', 'publiee'),
      supabase
        .from('campagne')
        .select('id', { count: 'exact', head: true })
        .eq('statut', 'publiee'),
      estAdminCourant(),
      lireContenuEditorial('mobiliser.titre', { valeurMd: FALLBACK_TITRE }),
      lireContenuEditorial('mobiliser.intro', { valeurMd: FALLBACK_INTRO }),
    ]);

  const cartes: Carte[] = [
    {
      slug: 'petitions',
      titre: 'Pétitions',
      description:
        'Pétitions adressées à un destinataire identifié, avec compteur stretch et signature anonyme ou connectée.',
      icone: PenSquare,
      href: '/mobiliser/petitions',
      badge: compter(petitions.count ?? 0, 'publiée'),
    },
    {
      slug: 'mobilisations',
      titre: 'Mobilisations',
      description:
        'Manifestations, rassemblements, blocages, événements ponctuels avec date, lieu, participantes.',
      icone: CalendarRange,
      href: '/mobiliser/mobilisations',
      badge: `${mobilisations.count ?? 0} à venir`,
    },
    {
      slug: 'cagnottes',
      titre: 'Cagnottes',
      description:
        'Cagnottes ouvertes, caisses de lutte, cotisations solidaires. Dons en euros ou en 99-coin.',
      icone: Wallet,
      href: '/mobiliser/cagnottes',
      badge: compter(cagnottes.count ?? 0, 'publiée'),
    },
    {
      slug: 'campagnes',
      titre: 'Campagnes',
      description:
        'Regroupements de pétitions, mobilisations, cagnottes et sondages sur une même cause.',
      icone: Flag,
      href: '/mobiliser/campagnes',
      badge: compter(campagnes.count ?? 0, 'publiée'),
    },
  ];

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Espace</p>
        <TexteEditableAdmin
          cle="mobiliser.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre de la page mobiliser"
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="mobiliser.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro de la page mobiliser"
          multilignes
          longueurMax={500}
        >
          {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
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
