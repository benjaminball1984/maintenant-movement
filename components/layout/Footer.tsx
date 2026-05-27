import { SITE } from '@/config/site';
import Link from 'next/link';

/**
 * Footer commun aux pages publiques (chantier 2.1).
 *
 * Liens (cf. 01_ARCHITECTURE.md §3) :
 *   - Qui sommes-nous → /a-propos
 *   - Mentions légales → /mentions-legales
 *   - Confidentialité → /confidentialite
 *   - Contact → /contact
 *   - Réseaux : placeholder pour les liens externes (Mastodon, etc.).
 *     Ne sont pas posés en 2.1 parce que pas de comptes officiels.
 *
 * Mention RGPD : on rappelle la souveraineté UE et l'absence de
 * traceurs tiers. C'est aussi un signal politique (CLAUDE.md).
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-lg font-bold text-text-1">{SITE.nom}</p>
          <p className="mt-2 text-sm text-text-2">{SITE.descriptionCourte}</p>
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
          <p className="text-text-3">
            Bientôt : Mastodon, Peertube, autres plateformes éthiques. Pas de Twitter / X, pas de
            Facebook / Meta.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-text-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            Données hébergées en région UE (Supabase Francfort). Pas de cookie publicitaire, pas de
            traceur tiers, pas de bandeau de consentement (cookies strictement techniques).
          </p>
          <p>© {new Date().getFullYear()} Maintenant!</p>
        </div>
      </div>
    </footer>
  );
}
