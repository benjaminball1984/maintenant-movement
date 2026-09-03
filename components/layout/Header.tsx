import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { RUBRIQUES_MENU } from '@/config/rubriques';
import { SITE } from '@/config/site';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { HeaderCloche } from './HeaderCloche';
import { HeaderProfilMenu } from './HeaderProfilMenu';

const FALLBACK_RECHERCHE_ARIA = 'Recherche globale';
const FALLBACK_CONNEXION = 'Se connecter';
const FALLBACK_ADHERER = 'Adhérer';

/**
 * Header du site.
 *
 * Structure :
 *   - Logo Maintenant! à gauche, lien vers `/`.
 *   - Menu à plat des rubriques actives au centre (depuis
 *     `config/rubriques.ts`).
 *   - Recherche, thème, puis bouton profil / connexion à droite.
 *     - Connecté·e : prénom + menu déroulant (profil, déconnexion).
 *     - Déconnecté·e : lien Se connecter + bouton Adhérer.
 *
 * ## Pourquoi un menu à plat
 *
 * Le header montrait les 5 espaces (S'informer, Mobiliser, S'entraider,
 * Agir, Comprendre). Depuis la mise en sommeil du 01/08/2026, trois de
 * ces espaces sont éteints et les deux autres ne mènent plus qu'à une ou
 * trois rubriques. Un étage de menu qui ne dessert qu'une seule page fait
 * perdre un clic pour rien. On affiche donc directement les rubriques :
 * un clic = une page pleine de contenu réel.
 *
 * ## Pourquoi « Adhérer » à la place de « Créer un compte »
 *
 * Décision de Lilou/Ben (01/08/2026) : l'adhésion est l'action que le
 * mouvement veut faire grandir, elle prend donc le point le plus visible
 * du site. La création de compte reste accessible depuis la page de
 * connexion et depuis les parcours de création (lancer une pétition, une
 * cagnotte…), qui la demandent au bon moment.
 *
 * Server Component (lit la session côté serveur). Le menu déroulant est
 * isolé en Client Component (`HeaderProfilMenu`).
 */
export async function Header() {
  const session = await getSession();
  const [estAdmin, rechercheAria, connexion, adherer] = await Promise.all([
    session !== null ? estAdminCourant() : Promise.resolve(false),
    lireContenuEditorial('header.recherche_aria', { valeurMd: FALLBACK_RECHERCHE_ARIA }),
    lireContenuEditorial('header.connexion', { valeurMd: FALLBACK_CONNEXION }),
    lireContenuEditorial('header.adherer', { valeurMd: FALLBACK_ADHERER }),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-text-1 hover:text-brand"
        >
          {SITE.nom}
        </Link>

        <nav aria-label="Rubriques du site" className="hidden flex-1 items-center md:flex">
          <ul className="flex gap-1">
            {RUBRIQUES_MENU.map((rubrique) => (
              <li key={rubrique.cle}>
                <Link
                  href={rubrique.href}
                  className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-text-2 transition-colors duration-fast hover:bg-surface-2 hover:text-text-1"
                >
                  {rubrique.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/recherche"
            aria-label={rechercheAria.valeurMd}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-2 hover:bg-surface-2 hover:text-text-1"
          >
            <Search size={18} aria-hidden="true" />
          </Link>
          <ThemeToggle />
          {session !== null ? (
            <>
              <HeaderCloche personneId={session.userId} />
              <HeaderProfilMenu
                email={session.email}
                prenom={session.personne?.prenom ?? null}
                estAdmin={estAdmin}
              />
            </>
          ) : (
            /* Le lien « Se connecter » était masqué sous 640 px (`hidden …
               sm:inline-flex`). Conséquence signalée par Ben le 18/08/2026 :
               depuis un téléphone, un visiteur déconnecté n'avait AUCUN moyen
               d'atteindre /connexion — ni ici, ni dans le pied de page, et le
               site n'a pas de menu burger. Les sondages, qui exigent un compte
               (doctrine §4D), devenaient inatteignables : 1 vote en deux mois
               malgré un mailing à 10 680 personnes. CE lien-ci reste réservé
               aux écrans ≥ 640 px : le rendre visible sur mobile faisait déborder
               la barre du haut (mesuré : 449 px de contenu pour 375 px d'écran,
               page qui défile latéralement). L'accès mobile passe donc par la
               barre de rubriques, en bas de cet en-tête. */
            <TexteEditableAdmin
              cle="header.connexion"
              valeurInitiale={connexion.valeurMd}
              estAdmin={estAdmin}
              libelle="CTA Se connecter du header"
              longueurMax={40}
            >
              {(t) => (
                <Link
                  href="/connexion"
                  className="hidden h-10 items-center rounded-md px-3 text-sm font-medium text-text-2 hover:text-text-1 sm:inline-flex"
                >
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>
          )}

          {/* Le bouton Adhérer est affiché dans les deux états, connecté
              ou non : une personne peut avoir un compte sans avoir
              adhéré. La page d'adhésion reconnaît les adhérent·es déjà à
              jour et leur affiche leur date d'échéance plutôt qu'une
              relance. */}
          <TexteEditableAdmin
            cle="header.adherer"
            valeurInitiale={adherer.valeurMd}
            estAdmin={estAdmin}
            libelle="CTA Adherer du header"
            longueurMax={40}
          >
            {(t) => (
              <Link
                href="/agir/adherer"
                className="inline-flex h-10 items-center rounded-md bg-grad px-4 text-sm font-bold text-white shadow-brand transition hover:brightness-110"
              >
                {t}
              </Link>
            )}
          </TexteEditableAdmin>
        </div>
      </div>

      {/* Nav mobile : tiroir simple horizontal scrollable. */}
      <nav
        aria-label="Rubriques du site (mobile)"
        className="overflow-x-auto border-t border-border bg-surface md:hidden"
      >
        <ul className="mx-auto flex max-w-7xl gap-1 px-4 py-2">
          {/* « Se connecter » vit ICI sur mobile, et non dans la barre du haut.
              Premier essai (18/08/2026) : rendre visible le lien du haut en
              retirant son `hidden`. Résultat mesuré sur un écran de 375 px : la
              barre réclamait 449 px (122 pour le logo, 287 pour les actions), la
              page se mettait à défiler latéralement sur tous les téléphones.
              Cette barre-ci est faite pour ça, elle défile déjà horizontalement.

              MAIS il était placé en DERNIER, donc hors écran : mesuré le
              03/09/2026 sur maintenant-le-mouvement.org, il commençait à 464 px
              sur un écran de 375, soit 89 px au-delà du bord droit. Personne ne
              pouvait le voir sans faire défiler cette barre latéralement, ce que
              rien n'indique. Signalé par Ben, qui n'arrivait pas à se connecter
              depuis son téléphone. Il passe donc EN PREMIER, et porte une
              bordure pour se lire comme une action, pas comme une rubrique. */}
          {session === null ? (
            <li>
              <Link
                href="/connexion"
                className="inline-flex h-9 items-center whitespace-nowrap rounded-md border border-border px-3 text-sm font-bold text-text-1"
              >
                {connexion.valeurMd}
              </Link>
            </li>
          ) : null}
          {RUBRIQUES_MENU.map((rubrique) => (
            <li key={rubrique.cle}>
              <Link
                href={rubrique.href}
                className="inline-flex h-9 items-center whitespace-nowrap rounded-md px-3 text-sm text-text-2"
              >
                {rubrique.libelle}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
