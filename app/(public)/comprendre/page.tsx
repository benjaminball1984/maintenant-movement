import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Card, Container, Heading } from '@/components/ui';
import { trouverEspace } from '@/config/espaces';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Comprendre',
};

const FALLBACK_TITRE = 'Comprendre';
const FALLBACK_INTRO = 'La pédagogie du mouvement : monnaie, doctrine, FAQ, ressources.';
const FALLBACK_PREHEADER = 'Espace';

/**
 * Page racine de l'espace Comprendre. Contrairement aux 4 autres
 * espaces, on lie ici aux 4 sous-pages parce qu'elles existent
 * (en stub editorial pour 2.1, completion en 2.2).
 */
export default async function PageComprendre() {
  const espace = trouverEspace('comprendre');

  const [estAdmin, titre, intro, preheader] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('comprendre.titre', { valeurMd: FALLBACK_TITRE }),
    lireContenuEditorial('comprendre.intro', { valeurMd: FALLBACK_INTRO }),
    lireContenuEditorial('hub.preheader.espace', { valeurMd: FALLBACK_PREHEADER }),
  ]);

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
          cle="comprendre.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre de la page comprendre"
          longueurMax={60}
        >
          {(t) => (
            <Heading niveau={1} className="mt-1">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="comprendre.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro de la page comprendre"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {espace.sousEspaces.map((sousEspace) => (
          <Link key={sousEspace.slug} href={`/comprendre/${sousEspace.slug}`} className="block">
            <Card variant="ombre" className="h-full hover:border-border-dark">
              <p className="font-bold text-text-1">{sousEspace.libelle}</p>
              <p className="mt-1 font-mono text-xs text-text-3">/comprendre/{sousEspace.slug}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
