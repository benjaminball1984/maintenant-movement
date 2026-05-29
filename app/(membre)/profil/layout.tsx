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
 * - barre de navigation 11 onglets (`NavOnglets`)
 * - main centre
 *
 * Tous les libelles d'onglets et le bouton de deconnexion sont editables
 * admin via le CMS (cles `profil.onglet.*` et `profil.deconnexion.*`).
 */
const ONGLETS_FALLBACKS: ReadonlyArray<OngletConfig> = [
  { slug: 'dashboard', libelle: 'Vue d’ensemble' },
  { slug: 'informations', libelle: 'Informations' },
  { slug: 'mes-groupes', libelle: 'Mes groupes' },
  { slug: 'mes-creations', libelle: 'Mes créations' },
  { slug: 'communes', libelle: 'Communes' },
  { slug: 'contributions', libelle: 'Contributions' },
  { slug: 'reservations', libelle: 'Mes réservations' },
  { slug: 'demandes-reservations', libelle: 'Demandes reçues' },
  { slug: 'notifications-recues', libelle: 'Notifications' },
  { slug: 'notifications', libelle: 'Préférences notif' },
  { slug: 'confidentialite', libelle: 'Confidentialité' },
];

export default async function LayoutProfil({ children }: { children: ReactNode }) {
  // Lecture en parallele : 11 libelles d'onglets + 2 libelles du bouton de deconnexion.
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
