import { SITE } from '@/config/site';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Layout du groupe d'auth (inscription / connexion / vérification email).
 *
 * Design dédié, centré, sans header principal du site : la personne n'est
 * pas distraite par la nav pendant un flux d'authentification. Le lien
 * retour vers `/` reste visible en haut pour ne pas piéger.
 *
 * Le footer note la souveraineté UE (Supabase Francfort) et la politique
 * RGPD minimale (cf. 05_RGPD.md). Le lien vers /confidentialite arrive
 * au chantier 2.2 (pages utilitaires).
 */
export default function LayoutAuth({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-display text-xl font-bold text-text-1 hover:text-brand">
            {SITE.nom}
          </Link>
          <Link href="/" className="text-sm text-text-3 hover:text-text-1">
            Retour à l'accueil
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="border-t border-border bg-surface-2">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs text-text-3">
            Tes données restent en région UE (Supabase Francfort). Politique RGPD minimale légale,
            pas de cookie publicitaire, pas de traceur tiers.
          </p>
        </div>
      </footer>
    </div>
  );
}
