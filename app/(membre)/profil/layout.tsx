import { LienEvitement } from '@/components/layout/LienEvitement';
import { SITE } from '@/config/site';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BoutonDeconnexion } from './BoutonDeconnexion';
import { NavOnglets, type OngletConfig } from './NavOnglets';

/**
 * Layout du profil utilisateurice.
 *
 * Note : les pages enfants doivent appeler `getPersonneOuRediriger()`
 * elles-memes pour recuperer la session. Le layout ne peut pas passer
 * les data aux enfants (limite App Router) et faire deux appels (layout
 * + page) n'a pas de surcout grace au cache de session Supabase.
 *
 * Le layout sert ici a poser la structure visuelle commune :
 * - header sobre avec lien retour `/` et bouton deconnexion
 * - barre de navigation des onglets (`NavOnglets`)
 * - main centre
 *
 * Tous les libelles d'onglets et le bouton de deconnexion sont editables
 * admin via le CMS (cles `profil.onglet.*` et `profil.deconnexion.*`).
 */

/**
 * Onglets du profil.
 *
 * Ramenés de 11 à 4 le 01/08/2026 (décision Lilou/Ben). Les sept autres
 * — vue d'ensemble, mes groupes, communes, contributions, réservations,
 * demandes reçues, notifications — desservaient des rubriques mises en
 * sommeil : elles n'auraient affiché que des listes vides. Un espace
 * membre à moitié vide déçoit autant qu'un site à moitié vide.
 *
 * Les pages existent toujours dans `app/(membre)/profil/` : les remettre
 * ici suffit à les rallumer (voir aussi `config/rubriques.ts`).
 */
const ONGLETS_FALLBACKS: ReadonlyArray<OngletConfig> = [
  { slug: 'informations', libelle: 'Mes informations' },
  { slug: 'mes-creations', libelle: 'Mes créations' },
  { slug: 'contributions', libelle: 'Mes contributions' },
  { slug: 'confidentialite', libelle: 'Confidentialité' },
];

export default async function LayoutProfil({ children }: { children: ReactNode }) {
  // Lecture en parallele : les libelles d'onglets + 2 libelles du bouton de deconnexion.
  const [libellesOnglets, deconnexionLibelle, deconnexionEnCours] = await Promise.all([
    Promise.all(
      ONGLETS_FALLBACKS.map((o) =>
        lireContenuEditorial(`profil.onglet.${o.slug}`, { valeurMd: o.libelle }),
      ),
    ),
    lireContenuEditorial('profil.deconnexion.libelle', { valeurMd: 'Se déconnecter' }),
    lireContenuEditorial('profil.deconnexion.en_cours', {
      valeurMd: 'Déconnexion en cours...',
    }),
  ]);

  const onglets: ReadonlyArray<OngletConfig> = ONGLETS_FALLBACKS.map((o, i) => ({
    slug: o.slug,
    libelle: libellesOnglets[i]?.valeurMd ?? o.libelle,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <LienEvitement />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-display text-xl font-bold text-text-1 hover:text-brand">
            {SITE.nom}
          </Link>
          <BoutonDeconnexion
            libelle={deconnexionLibelle.valeurMd}
            libelleEnCours={deconnexionEnCours.valeurMd}
          />
        </div>
      </header>

      <NavOnglets onglets={onglets} />

      <main
        id="contenu"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
      >
        {children}
      </main>
    </div>
  );
}
