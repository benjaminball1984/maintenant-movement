import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireInscription } from './FormulaireInscription';

export const metadata: Metadata = {
  title: 'Créer un compte',
};

const FALLBACKS = {
  titre: 'Créer mon compte',
  intro: 'Bienvenue. Quelques minutes pour rejoindre Maintenant!.',
  bottomAmorce: 'Déjà un compte ?',
  bottomLien: 'Se connecter',
};

/**
 * Page d'inscription : formulaire complet avec Turnstile et CGU.
 *
 * La page elle-même est un Server Component ; le formulaire est isolé en
 * Client Component (`FormulaireInscription`) parce qu'il a besoin de
 * `react-hook-form` (state + onSubmit).
 */
export default async function PageInscription() {
  const [estAdmin, titre, intro, bottomAmorce, bottomLien] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('inscription.titre', { valeurMd: FALLBACKS.titre }),
    lireContenuEditorial('inscription.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('inscription.bottom.amorce', { valeurMd: FALLBACKS.bottomAmorce }),
    lireContenuEditorial('inscription.bottom.lien', { valeurMd: FALLBACKS.bottomLien }),
  ]);

  return (
    <article className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="inscription.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre de la page inscription"
          longueurMax={60}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="inscription.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro de la page inscription"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <FormulaireInscription />

      <p className="text-sm text-text-3">
        <TexteEditableAdmin
          cle="inscription.bottom.amorce"
          valeurInitiale={bottomAmorce.valeurMd}
          estAdmin={estAdmin}
          libelle="amorce bas de page inscription"
          longueurMax={60}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>{' '}
        <TexteEditableAdmin
          cle="inscription.bottom.lien"
          valeurInitiale={bottomLien.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle lien Se connecter (bas page inscription)"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/connexion" className="text-brand underline-offset-4 hover:underline">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>
    </article>
  );
}
