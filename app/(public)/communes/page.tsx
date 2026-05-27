import { CarteCommunesWrapper } from '@/components/communes/CarteCommunesWrapper';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carte des communes',
  description:
    'Carte de toutes les communes et arrondissements. Clique sur une commune pour voir sa fiche : inscrit·es, signataires, abonné·es et membres.',
};

/**
 * Carte clusterisée du référentiel des communes (chantier 13.3-C).
 *
 * Distincte de la carte unifiée (chantier 6.1, tout le contenu géolocalisé) :
 * celle-ci porte uniquement le référentiel géographique complet (~35 000
 * communes + arrondissements) et sert de porte d'entrée vers les fiches.
 */
export default async function PageCarteCommunes() {
  const [estAdmin, titre, intro, footerNote] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('communes.carte.titre', { valeurMd: 'Carte des communes' }),
    lireContenuEditorial('communes.carte.intro', {
      valeurMd:
        "Toutes les communes et arrondissements. Zoome puis clique sur une commune pour ouvrir sa fiche : nombre d'inscrit·es, de signataires, d'abonné·es, et les membres qui l'ont rejointe.",
    }),
    lireContenuEditorial('communes.carte.footer_note', {
      valeurMd:
        'Les compteurs sont agrégés et anonymisés. Seuls les membres qui ont explicitement rejoint une commune y apparaissent nommément.',
    }),
  ]);

  return (
    <Container className="py-8">
      <header className="mb-6">
        <TexteEditableAdmin
          cle="communes.carte.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre carte communes"
          longueurMax={50}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="communes.carte.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro carte communes"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mt-2 max-w-2xl text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <CarteCommunesWrapper />

      <TexteEditableAdmin
        cle="communes.carte.footer_note"
        valeurInitiale={footerNote.valeurMd}
        estAdmin={estAdmin}
        libelle="note bas de page carte communes"
        multilignes
        longueurMax={300}
      >
        {(t) => <p className="mt-4 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>
    </Container>
  );
}
