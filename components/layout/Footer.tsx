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

/**
 * Footer commun aux pages publiques.
 *
 * 3 textes éditables par admin via le CMS (`contenu_editorial`) :
 * - `footer.baseline` (sous le logo Maintenant!)
 * - `footer.reseaux` (colonne « Sur les réseaux »)
 * - `footer.rgpd` (mention bas de page)
 */
export async function Footer() {
  const [estAdmin, baseline, reseaux, rgpd] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('footer.baseline', { valeurMd: FALLBACK_BASELINE }),
    lireContenuEditorial('footer.reseaux', { valeurMd: FALLBACK_RESEAUX }),
    lireContenuEditorial('footer.rgpd', { valeurMd: FALLBACK_RGPD }),
  ]);

  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-lg font-bold text-text-1">{SITE.nom}</p>
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
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">À propos</p>
          <Link href="/a-propos" className="text-text-2 hover:text-brand">
            Qui sommes-nous
          </Link>
          <Link href="/mentions-legales" className="text-text-2 hover:text-brand">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="text-text-2 hover:text-brand">
            Politique de confidentialité
          </Link>
          <Link href="/contact" className="text-text-2 hover:text-brand">
            Contact
          </Link>
        </nav>

        <nav aria-label="Explorer le site" className="grid gap-2 text-sm">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Explorer</p>
          <Link href="/recherche" className="text-text-2 hover:text-brand">
            Recherche globale
          </Link>
          <Link href="/agenda" className="text-text-2 hover:text-brand">
            Agenda (tous les événements)
          </Link>
          <Link href="/cartes" className="text-text-2 hover:text-brand">
            Cartes
          </Link>
          <Link href="/s-informer/decider" className="text-text-2 hover:text-brand">
            Décider (réunions)
          </Link>
          <Link href="/s-informer/journal" className="text-text-2 hover:text-brand">
            Maintenant Médias
          </Link>
        </nav>

        <div className="grid gap-2 text-sm">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Sur les réseaux</p>
          <TexteEditableAdmin
            cle="footer.reseaux"
            valeurInitiale={reseaux.valeurMd}
            estAdmin={estAdmin}
            libelle="colonne réseaux sociaux du footer"
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
