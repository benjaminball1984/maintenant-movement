import { CarteWrapper } from '@/components/carte/CarteWrapper';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { chargerPointsCarte } from '@/lib/carte/donnees';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { MapPin } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carte des mobilisations',
  description: 'Ce qui se passe près de chez vous : les mobilisations Maintenant! sur une carte.',
};

/**
 * Page `/cartes` : la carte du site.
 *
 * ## Pourquoi cette page a changé de nature
 *
 * Jusqu'au 01/08/2026, `/cartes` était un **index de trois cartes**
 * (activités, communes, hébergements solidaires) et la carte elle-même
 * vivait sur `/carte`. Deux adresses très proches pour une même idée,
 * et un index qui coûtait un clic de plus.
 *
 * Les cartes « communes » et « hébergements » desservant des rubriques
 * mises en sommeil, l'index n'aurait plus proposé qu'une seule
 * destination. On a donc fusionné : `/cartes` **est** la carte, et
 * `/carte` (le doublon) est endormi.
 *
 * Les points affichés sont filtrés en amont par `chargerPointsCarte()`,
 * qui écarte tout ce qui pointe vers une fiche endormie. En pratique il
 * reste les mobilisations et les sondages géolocalisés.
 */
export default async function PageCarte() {
  const [points, estAdmin, titre, intro, pointsAffichesLabel] = await Promise.all([
    chargerPointsCarte(),
    estAdminCourant(),
    lireContenuEditorial('carte.titre', { valeurMd: 'Carte des mobilisations' }),
    lireContenuEditorial('carte.intro', {
      valeurMd:
        'Ce qui se passe près de chez vous. Cliquez sur un point pour ouvrir la fiche, et retrouvez les dates dans l’agenda.',
    }),
    lireContenuEditorial('carte.points_affiches', { valeurMd: 'points affichés.' }),
  ]);

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-6">
        <TexteEditableAdmin
          cle="carte.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre de la carte"
          longueurMax={40}
        >
          {(t) => (
            <Heading niveau={1}>
              <MapPin size={26} className="-mt-1 mr-2 inline" aria-hidden="true" />
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="carte.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro de la carte"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mt-2 max-w-2xl text-text-2">{t}</p>}
        </TexteEditableAdmin>
        <p className="mt-1 text-xs text-text-3">
          {points.length}{' '}
          <TexteEditableAdmin
            cle="carte.points_affiches"
            valeurInitiale={pointsAffichesLabel.valeurMd}
            estAdmin={estAdmin}
            libelle="label apres le compteur de points"
            longueurMax={50}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </p>
      </header>

      <CarteWrapper points={points} />
    </Container>
  );
}
