import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { RUBRIQUES_MENU } from '@/config/rubriques';
import { SITE } from '@/config/site';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import Image from 'next/image';
import Link from 'next/link';

const FALLBACK_BASELINE = SITE.descriptionCourte;
const FALLBACK_RGPD =
  'Données hébergées en région UE (Supabase Francfort). Pas de cookie publicitaire, pas de traceur tiers, pas de bandeau de consentement (cookies strictement techniques).';

// Définition des sections du footer avec leurs liens. Chaque libellé
// est éditable indépendamment via le CMS (clés `footer.section.X` et
// `footer.lien.X`). Les `href` restent en dur (changer une URL casse
// la navigation, on ne laisse pas ça à l'admin éditorial).
//
// Mise en sommeil du 01/08/2026 : les liens vers « Qui sommes-nous »,
// « Décider », « Le Peuple à l'Affiche » et « Organisations » ont été
// retirés — leurs pages sont endormies (cf. `config/rubriques.ts`), un
// lien vers elles renverrait à l'accueil. La colonne « Sur les réseaux »
// a été supprimée : elle n'annonçait que des comptes à venir.
const SECTION_APROPOS = {
  cleSection: 'footer.section.apropos',
  fallbackSection: 'Le mouvement',
  liens: [
    { cle: 'footer.lien.adherer', href: '/agir/adherer', fallback: 'Adhérer' },
    { cle: 'footer.lien.contact', href: '/contact', fallback: 'Contact' },
    { cle: 'footer.lien.mentions', href: '/mentions-legales', fallback: 'Mentions légales' },
    {
      cle: 'footer.lien.confidentialite',
      href: '/confidentialite',
      fallback: 'Politique de confidentialité',
    },
  ],
};

const SECTION_EXPLORER = {
  cleSection: 'footer.section.explorer',
  fallbackSection: 'Explorer',
  liens: [
    { cle: 'footer.lien.agenda', href: '/agenda', fallback: 'Agenda des mobilisations' },
    // Le lien « Carte des mobilisations » (`/cartes`) est retiré depuis la
    // mise en sourdine du 15/08/2026 (voir `config/rubriques.ts`). Le
    // rétablir ici quand la carte revient.
    { cle: 'footer.lien.recherche', href: '/recherche', fallback: 'Recherche' },
  ],
};

// Colonne « Rubriques » : reprise directe du menu principal, pour qu'un
// visiteur arrivé en bas de page n'ait pas à remonter. Les libellés
// viennent de `config/rubriques.ts` et ne sont donc pas éditables un par
// un ici — ils le sont à un seul endroit, ce qui évite qu'un même lien
// porte deux noms différents en haut et en bas de page.
const CLE_SECTION_RUBRIQUES = 'footer.section.rubriques';
const FALLBACK_SECTION_RUBRIQUES = 'Rubriques';

/**
 * Footer commun aux pages publiques.
 *
 * Tous les libellés sont éditables par admin via le CMS (clés `footer.*`).
 * Les URLs des liens restent en dur dans le code (changer une URL casse
 * la navigation, c'est de la config technique pas du texte éditorial).
 */
export async function Footer() {
  const estAdmin = await estAdminCourant();

  // Lecture en parallèle de tous les textes éditables.
  const allLiens = [...SECTION_APROPOS.liens, ...SECTION_EXPLORER.liens];
  const [baseline, rgpd, sectionApropos, sectionExplorer, sectionRubriques, ...liens] =
    await Promise.all([
      lireContenuEditorial('footer.baseline', { valeurMd: FALLBACK_BASELINE }),
      lireContenuEditorial('footer.rgpd', { valeurMd: FALLBACK_RGPD }),
      lireContenuEditorial(SECTION_APROPOS.cleSection, {
        valeurMd: SECTION_APROPOS.fallbackSection,
      }),
      lireContenuEditorial(SECTION_EXPLORER.cleSection, {
        valeurMd: SECTION_EXPLORER.fallbackSection,
      }),
      lireContenuEditorial(CLE_SECTION_RUBRIQUES, { valeurMd: FALLBACK_SECTION_RUBRIQUES }),
      ...allLiens.map((l) => lireContenuEditorial(l.cle, { valeurMd: l.fallback })),
    ]);

  const valeurLien = (cle: string, fallback: string): string => {
    const found = liens.find((l) => l.cle === cle);
    return found?.valeurMd ?? fallback;
  };

  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          {/* Logo officiel Maintenant! (poing levé + coquelicot, dégradé
              violet→framboise, wordmark intégré). Fourni le 2026-05-29 par
              Lilou/Ben, stocké dans `public/logo/maintenant.png` (1 Mo
              source PNG bitmap, qualité native conservée pour les écrans
              haute densité). */}
          <Link href="/" aria-label={`${SITE.nom} — accueil`} className="inline-block">
            <Image
              src="/logo/maintenant.png"
              alt={`${SITE.nom} (logo : poing levé violet et coquelicot rouge)`}
              width={140}
              height={156}
              priority
              className="h-auto w-32 sm:w-36"
            />
          </Link>
          <TexteEditableAdmin
            cle="footer.baseline"
            valeurInitiale={baseline.valeurMd}
            estAdmin={estAdmin}
            libelle="baseline du footer (sous le logo)"
            multilignes
            longueurMax={300}
          >
            {(t) => <p className="mt-2 text-sm text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>

        <nav aria-label="Rubriques du site" className="grid content-start gap-2 text-sm">
          <TexteEditableAdmin
            cle={CLE_SECTION_RUBRIQUES}
            valeurInitiale={sectionRubriques.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section Rubriques du footer"
            longueurMax={50}
          >
            {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
          </TexteEditableAdmin>
          {RUBRIQUES_MENU.map((rubrique) => (
            <Link key={rubrique.cle} href={rubrique.href} className="text-text-2 hover:text-brand">
              {rubrique.libelle}
            </Link>
          ))}
        </nav>

        <nav aria-label="Le mouvement" className="grid content-start gap-2 text-sm">
          <TexteEditableAdmin
            cle={SECTION_APROPOS.cleSection}
            valeurInitiale={sectionApropos.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section Le mouvement du footer"
            longueurMax={50}
          >
            {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
          </TexteEditableAdmin>
          {SECTION_APROPOS.liens.map((l) => (
            <TexteEditableAdmin
              key={l.cle}
              cle={l.cle}
              valeurInitiale={valeurLien(l.cle, l.fallback)}
              estAdmin={estAdmin}
              libelle={`libellé du lien ${l.href}`}
              longueurMax={80}
            >
              {(t) => (
                <Link href={l.href} className="text-text-2 hover:text-brand">
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>
          ))}
        </nav>

        <nav aria-label="Explorer le site" className="grid gap-2 text-sm">
          <TexteEditableAdmin
            cle={SECTION_EXPLORER.cleSection}
            valeurInitiale={sectionExplorer.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section Explorer du footer"
            longueurMax={50}
          >
            {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
          </TexteEditableAdmin>
          {SECTION_EXPLORER.liens.map((l) => (
            <TexteEditableAdmin
              key={l.cle}
              cle={l.cle}
              valeurInitiale={valeurLien(l.cle, l.fallback)}
              estAdmin={estAdmin}
              libelle={`libellé du lien ${l.href}`}
              longueurMax={80}
            >
              {(t) => (
                <Link href={l.href} className="text-text-2 hover:text-brand">
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>
          ))}
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-text-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <TexteEditableAdmin
            cle="footer.rgpd"
            valeurInitiale={rgpd.valeurMd}
            estAdmin={estAdmin}
            libelle="mention RGPD pied de page"
            multilignes
            longueurMax={500}
          >
            {(t) => <p>{t}</p>}
          </TexteEditableAdmin>
          <p>© {new Date().getFullYear()} Maintenant!</p>
        </div>
      </div>
    </footer>
  );
}
