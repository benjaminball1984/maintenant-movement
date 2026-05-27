import { CarteWrapper } from '@/components/carte/CarteWrapper';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { chargerPointsCarte } from '@/lib/carte/donnees';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carte unifiée',
  description:
    'Carte interactive des actions Maintenant! : mobilisations, communes libres, et plus à venir.',
};

/**
 * Page `/carte` — carte unifiée transverse (chantier 3.2 v1).
 *
 * Cf. spec §8A : « bases de données séparées par espace, agrégation à
 * l'affichage ». Le Server Component charge les points (mobilisations
 * publiées + communes), le Client Component les rend avec MapLibre.
 *
 * Sources actuelles : mobilisations + communes. À enrichir au fil des
 * chantiers :
 *   - 3.3 cagnottes locales
 *   - 4.x moments solidaires
 *   - 6.x frigos / minimarchés / initiatives d'entraide
 *   - 7.5 sondages locaux
 */
export default async function PageCarte() {
  const [points, estAdmin, titre, intro, pointsAffichesLabel] = await Promise.all([
    chargerPointsCarte(),
    estAdminCourant(),
    lireContenuEditorial('carte.titre', { valeurMd: 'Carte des actions' }),
    lireContenuEditorial('carte.intro', {
      valeurMd:
        'Tout ce qui est géolocalisé sur Maintenant!, sur une seule carte. Coche / décoche les types pour filtrer. Plus de sources viendront avec les prochains chantiers.',
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
          libelle="titre carte unifiee"
          longueurMax={40}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="carte.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro carte unifiee"
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
