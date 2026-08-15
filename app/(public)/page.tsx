import { BlocTitre } from '@/components/home/BlocTitre';
import { PreFooterCompteurs } from '@/components/home/PreFooterCompteurs';
import { UneArticle } from '@/components/home/UneArticle';
import { UneMobilisation } from '@/components/home/UneMobilisation';
import { UnePetition } from '@/components/home/UnePetition';
import { UneSondage } from '@/components/home/UneSondage';
import { getCompteursHome } from '@/lib/home/requetes';

/**
 * Page d'accueil définitive (chantier 2.1).
 *
 * Structure :
 *   1. Header (depuis layout (public))
 *   2. BlocTitre (surtitre / titre / sous-titre)
 *   3. 4 unes empilées — une par rubrique gardée, dans l'ordre du menu
 *      (pétition, mobilisation, sondage, article)
 *   4. PreFooterCompteurs (newsletter, membres, signataires)
 *   5. Footer (depuis layout (public))
 *
 * ## Une une par rubrique
 *
 * Depuis la mise en sommeil du 01/08/2026 (cf. `config/rubriques.ts`), le
 * site n'expose plus que cinq rubriques. L'accueil en montre une entrée
 * chacune : le visiteur vérifie d'un coup d'œil que chaque item du menu
 * mène à du contenu réel, au lieu de le découvrir en cliquant.
 *
 * L'ordre suit celui du menu, du geste le plus facile au plus
 * contemplatif : signer, se retrouver, donner, donner son avis,
 * s'informer.
 */
export default async function PageAccueil() {
  const compteurs = await getCompteursHome();

  return (
    <>
      <BlocTitre />

      <section
        aria-label="À la une"
        className="mx-auto grid max-w-4xl gap-6 px-4 pb-16 sm:px-6 lg:px-8"
      >
        <UnePetition />
        <UneMobilisation />
        <UneSondage />
        <UneArticle />
        {/* La une « cagnotte » est retirée en même temps que la rubrique
            (01/08/2026) : aucune cagnotte n'est publiée, la carte
            n'aurait affiché qu'un état vide. Remettre <UneCagnotte /> ici
            en rallumant la rubrique dans `config/rubriques.ts`. */}
      </section>

      <PreFooterCompteurs
        newsletter={compteurs.newsletter}
        membres={compteurs.membres}
        signataires={compteurs.signataires}
      />
    </>
  );
}
