import { SITE } from '@/config/site';
import Image from 'next/image';
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
          <Link
            href="/"
            className="flex items-center gap-3 font-display text-xl font-bold text-text-1 hover:text-brand"
          >
            <Image
              src="/logo/maintenant.png"
              alt={`Logo ${SITE.nom}`}
              width={40}
              height={45}
              priority
              className="h-auto w-9"
            />
            <span>{SITE.nom}</span>
          </Link>
          <Link href="/" className="text-sm text-text-3 hover:text-text-1">
            Retour à l'accueil
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          {/* Logo grand format au-dessus du formulaire — première chose vue
              par les nouvelles personnes qui découvrent Maintenant!. Le
              logo dans le header reste petit pour ne pas voler la vedette
              au contenu du formulaire qui suit. */}
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo/maintenant.png"
              alt=""
              width={120}
              height={134}
              priority
              className="h-auto w-24"
            />
          </div>
          {children}
        </div>
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
