import { lireContenuEditorial } from '@/lib/contenu-editorial';

/**
 * Lien d'évitement (« skip link »).
 *
 * Premier élément focusable de la page : invisible jusqu'à recevoir le
 * focus clavier, il permet à une personne au clavier ou au lecteur d'écran
 * de sauter directement au contenu principal sans tabuler à travers toute
 * la navigation (essentiel sur la console admin dont la nav compte ~30
 * liens). Cible : l'élément `<main id={cibleId} tabIndex={-1}>` du layout.
 *
 * Le libellé est éditable via le CMS (clé `a11y.lien_evitement`).
 *
 * Pattern : `sr-only` masque visuellement, `focus:not-sr-only` révèle au
 * focus. Server Component (aucun JS embarqué).
 */
export async function LienEvitement({ cibleId = 'contenu' }: { cibleId?: string }) {
  const libelle = await lireContenuEditorial('a11y.lien_evitement', {
    valeurMd: 'Aller au contenu principal',
  });

  return (
    <a
      href={`#${cibleId}`}
      className="sr-only rounded-md font-bold focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-brand focus:px-4 focus:py-2 focus:text-white focus:shadow-brand"
    >
      {libelle.valeurMd}
    </a>
  );
}
