import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { Building, HandHelping, Map as IconeMap, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cartes',
  description: 'Index des cartes Maintenant! : évènements, communes, hébergements solidaires.',
};

const CARTES = [
  {
    slug: 'activites',
    href: '/carte',
    titre: 'Carte des activités',
    description:
      'Toutes les activités géolocalisées : mobilisations, entraide, SEL, marché, moments solidaires, sondages, groupes d’entraide.',
    icone: IconeMap,
  },
  {
    slug: 'communes',
    href: '/communes',
    titre: 'Carte des communes',
    description:
      '35 000+ communes pré-créées sur le référentiel INSEE. Clusterisation pour zoomer sur la France entière.',
    icone: Building,
  },
  {
    slug: 'hebergements',
    href: '/cartes/hebergements',
    titre: 'Hébergements solidaires',
    description:
      'Carte dédiée aux hébergements solidaires uniquement, pour qui cherche un toit ou veut en offrir un.',
    icone: HandHelping,
  },
] as const;

export default async function PageIndexCartes() {
  const [estAdmin, titre, intro, ...descriptions] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('cartes.titre', { valeurMd: 'Cartes' }),
    lireContenuEditorial('cartes.intro', {
      valeurMd: 'Trois cartes thématiques selon ce que tu cherches.',
    }),
    ...CARTES.flatMap((c) => [
      lireContenuEditorial(`cartes.${c.slug}.titre`, { valeurMd: c.titre }),
      lireContenuEditorial(`cartes.${c.slug}.description`, { valeurMd: c.description }),
    ]),
  ]);
  const cartesAvecCms = CARTES.map((c, i) => ({
    ...c,
    titreCms: descriptions[i * 2]?.valeurMd ?? c.titre,
    descriptionCms: descriptions[i * 2 + 1]?.valeurMd ?? c.description,
  }));

  return (
    <Container taille="lg" className="py-12">
      <Heading niveau={1}>
        <MapPin size={26} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="cartes.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre page cartes"
          longueurMax={30}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <TexteEditableAdmin
        cle="cartes.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro page cartes"
        longueurMax={200}
      >
        {(t) => <p className="mt-2 text-text-2">{t}</p>}
      </TexteEditableAdmin>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartesAvecCms.map((c) => {
          const Icone = c.icone;
          return (
            <li key={c.href}>
              <Link href={c.href} className="block hover:opacity-90">
                <Card variant="ombre" className="grid h-full gap-2">
                  <Icone size={28} className="text-brand" aria-hidden="true" />
                  <TexteEditableAdmin
                    cle={`cartes.${c.slug}.titre`}
                    valeurInitiale={c.titreCms}
                    estAdmin={estAdmin}
                    libelle={`titre carte ${c.slug}`}
                    longueurMax={50}
                  >
                    {(t) => <h2 className="font-display font-bold text-lg text-text-1">{t}</h2>}
                  </TexteEditableAdmin>
                  <TexteEditableAdmin
                    cle={`cartes.${c.slug}.description`}
                    valeurInitiale={c.descriptionCms}
                    estAdmin={estAdmin}
                    libelle={`description carte ${c.slug}`}
                    multilignes
                    longueurMax={300}
                  >
                    {(t) => <p className="text-sm text-text-2">{t}</p>}
                  </TexteEditableAdmin>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
