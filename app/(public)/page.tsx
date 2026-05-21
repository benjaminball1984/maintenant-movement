import { BlocTitre } from '@/components/home/BlocTitre';
import { PreFooterCompteurs } from '@/components/home/PreFooterCompteurs';
import { UneArticle } from '@/components/home/UneArticle';
import { UneCagnotte } from '@/components/home/UneCagnotte';
import { UneMobilisation } from '@/components/home/UneMobilisation';
import { UnePetition } from '@/components/home/UnePetition';
import { getCompteursHome } from '@/lib/home/requetes';

/**
 * Page d'accueil définitive (chantier 2.1).
 *
 * Structure (cf. 01_ARCHITECTURE.md §3) :
 *   1. Header (depuis layout (public))
 *   2. BlocTitre (surtitre / titre / sous-titre)
 *   3. 4 unes empilées (pétition, article, mobilisation, cagnotte)
 *   4. PreFooterCompteurs (newsletter, membres, signataires)
 *   5. Footer (depuis layout (public))
 *
 * Pour 2.1, les 4 unes sont en état vide propre : les tables sources
 * (petition, article, mobilisation, cagnotte) n'existent pas encore
 * (phases 3 et 7). Chaque carte affiche un message d'attente + lien
 * « voir tous » vers l'index de l'espace correspondant.
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
        <UneArticle />
        <UneMobilisation />
        <UneCagnotte />
      </section>

      <PreFooterCompteurs
        newsletter={compteurs.newsletter}
        membres={compteurs.membres}
        signataires={compteurs.signataires}
      />
    </>
  );
}
