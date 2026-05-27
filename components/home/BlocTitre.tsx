import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';

const FALLBACK_SURTITRE = 'La plateforme citoyenne des 99 %';
const FALLBACK_TITRE = 'Maintenant!';
const FALLBACK_SOUS_TITRE =
  'Pour une vie digne et heureuse pour tous et toutes, dans un monde vivable. Face aux oppressions systémiques, nos luttes doivent devenir systémiques.';

/**
 * Bloc titre de la page d'accueil.
 *
 * Textes éditables par admin via le CMS (`contenu_editorial`) :
 * - `home.surtitre`
 * - `home.titre`
 * - `home.sous_titre`
 *
 * Fallbacks issus de la spec §3 si aucun override en base. Admin →
 * bouton ✏️ en hover sur chaque texte.
 */
export async function BlocTitre() {
  const [estAdmin, surtitre, titre, sousTitre] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('home.surtitre', { valeurMd: FALLBACK_SURTITRE }),
    lireContenuEditorial('home.titre', { valeurMd: FALLBACK_TITRE }),
    lireContenuEditorial('home.sous_titre', { valeurMd: FALLBACK_SOUS_TITRE }),
  ]);

  return (
    <section
      aria-label="Identité du mouvement"
      className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8"
    >
      <TexteEditableAdmin
        cle="home.surtitre"
        valeurInitiale={surtitre.valeurMd}
        estAdmin={estAdmin}
        libelle="surtitre de la home"
      >
        {(t) => (
          <p className="font-body text-sm font-bold uppercase tracking-cap text-text-3">{t}</p>
        )}
      </TexteEditableAdmin>

      <TexteEditableAdmin
        cle="home.titre"
        valeurInitiale={titre.valeurMd}
        estAdmin={estAdmin}
        libelle="titre principal de la home"
      >
        {(t) => (
          <Heading niveau={1} className="bg-grad bg-clip-text text-transparent">
            {t}
          </Heading>
        )}
      </TexteEditableAdmin>

      <TexteEditableAdmin
        cle="home.sous_titre"
        valeurInitiale={sousTitre.valeurMd}
        estAdmin={estAdmin}
        libelle="sous-titre / accroche de la home"
        multilignes
        longueurMax={500}
      >
        {(t) => <p className="max-w-2xl text-lg text-text-2 sm:text-xl">{t}</p>}
      </TexteEditableAdmin>
    </section>
  );
}
