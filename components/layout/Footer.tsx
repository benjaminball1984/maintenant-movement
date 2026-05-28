import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { SITE } from '@/config/site';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import Link from 'next/link';

const FALLBACK_BASELINE = SITE.descriptionCourte;
const FALLBACK_RESEAUX =
  'Bientôt : Mastodon, Peertube, autres plateformes éthiques. Pas de Twitter / X, pas de Facebook / Meta.';
const FALLBACK_RGPD =
  'Données hébergées en région UE (Supabase Francfort). Pas de cookie publicitaire, pas de traceur tiers, pas de bandeau de consentement (cookies strictement techniques).';

// Définition des sections du footer avec leurs liens. Chaque libellé
// est éditable indépendamment via le CMS (clés `footer.section.X` et
// `footer.lien.X`). Les `href` restent en dur (changer une URL casse
// la navigation, on ne laisse pas ça à l'admin éditorial).
const SECTION_APROPOS = {
  cleSection: 'footer.section.apropos',
  fallbackSection: 'À propos',
  liens: [
    { cle: 'footer.lien.qui', href: '/a-propos', fallback: 'Qui sommes-nous' },
    { cle: 'footer.lien.mentions', href: '/mentions-legales', fallback: 'Mentions légales' },
    {
      cle: 'footer.lien.confidentialite',
      href: '/confidentialite',
      fallback: 'Politique de confidentialité',
    },
    { cle: 'footer.lien.contact', href: '/contact', fallback: 'Contact' },
  ],
};

const SECTION_EXPLORER = {
  cleSection: 'footer.section.explorer',
  fallbackSection: 'Explorer',
  liens: [
    { cle: 'footer.lien.recherche', href: '/recherche', fallback: 'Recherche globale' },
    { cle: 'footer.lien.agenda', href: '/agenda', fallback: 'Agenda (tous les événements)' },
    { cle: 'footer.lien.cartes', href: '/cartes', fallback: 'Cartes' },
    { cle: 'footer.lien.decider', href: '/s-informer/decider', fallback: 'Décider (réunions)' },
    { cle: 'footer.lien.journal', href: '/s-informer/journal', fallback: 'Maintenant Médias' },
  ],
};

const SECTION_RESEAUX = {
  cleSection: 'footer.section.reseaux',
  fallbackSection: 'Sur les réseaux',
};

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
  const [baseline, reseauxTxt, rgpd, sectionApropos, sectionExplorer, sectionReseaux, ...liens] =
    await Promise.all([
      lireContenuEditorial('footer.baseline', { valeurMd: FALLBACK_BASELINE }),
      lireContenuEditorial('footer.reseaux', { valeurMd: FALLBACK_RESEAUX }),
      lireContenuEditorial('footer.rgpd', { valeurMd: FALLBACK_RGPD }),
      lireContenuEditorial(SECTION_APROPOS.cleSection, {
        valeurMd: SECTION_APROPOS.fallbackSection,
      }),
      lireContenuEditorial(SECTION_EXPLORER.cleSection, {
        valeurMd: SECTION_EXPLORER.fallbackSection,
      }),
      lireContenuEditorial(SECTION_RESEAUX.cleSection, {
        valeurMd: SECTION_RESEAUX.fallbackSection,
      }),
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
          {/* Emplacement du logo officiel (poing levé + coquelicot).
              Tant que le SVG/PNG n'est pas fourni par Lilou/Ben, on affiche
              juste le wordmark stylisé avec le dégradé signature. Le
              remplacement se fait en collant l'image dans `public/logo/`
              et en remplaçant ce bloc par <Image src="/logo/maintenant.svg" ... />. */}
          <p
            className="bg-grad bg-clip-text font-display text-2xl font-extrabold text-transparent"
            aria-label={`${SITE.nom} (logo)`}
          >
            {SITE.nom}
          </p>
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

        <nav aria-label="Pages du site" className="grid gap-2 text-sm">
          <TexteEditableAdmin
            cle={SECTION_APROPOS.cleSection}
            valeurInitiale={sectionApropos.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section À propos du footer"
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

        <div className="grid gap-2 text-sm">
          <TexteEditableAdmin
            cle={SECTION_RESEAUX.cleSection}
            valeurInitiale={sectionReseaux.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section Sur les réseaux du footer"
            longueurMax={50}
          >
            {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
          </TexteEditableAdmin>
          <TexteEditableAdmin
            cle="footer.reseaux"
            valeurInitiale={reseauxTxt.valeurMd}
            estAdmin={estAdmin}
            libelle="texte colonne réseaux sociaux"
            multilignes
            longueurMax={500}
          >
            {(t) => <p className="text-text-3">{t}</p>}
          </TexteEditableAdmin>
        </div>
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
