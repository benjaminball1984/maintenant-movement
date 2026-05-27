import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import { LOREM_LONG } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
};

const FALLBACK = `Maintenant! collecte le strict nécessaire au fonctionnement du mouvement.

## Doctrine

- Pas de cookie publicitaire, pas de traceur tiers.
- Données stockées en région EU (Supabase Francfort, Allemagne).
- Consentement granulaire et révocable (cf. /profil/confidentialite).
- Délégué·e à la protection des données (DPD) : [à désigner], dpd@maintenant-le-mouvement.org.

## Quelles données ?

${LOREM_LONG}

## Combien de temps ?

${LOREM_LONG}

## Tes droits

Tu peux à tout moment :

- Accéder à tes données (export ZIP via /profil/confidentialite)
- Les rectifier
- Les supprimer (suppression différée 30 jours)
- T'opposer à un traitement
- Retirer un consentement

${LOREM_LONG}

## Cookies

${LOREM_LONG}
`;

export default function PagePolitiqueConfidentialite() {
  return (
    <PageEditorialeCMS
      surtitre="Vie privée"
      titreParDefaut="Politique de confidentialité"
      cle="page.confidentialite"
      loremFallback={FALLBACK}
    />
  );
}
