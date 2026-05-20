import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Système de design',
};

/**
 * Page placeholder du système de design.
 *
 * Sera complétée au chantier 0.2 :
 * - tokens CSS depuis 04_DESIGN-TOKENS.md (couleurs, typographie, espacements)
 * - polices Fraunces, Atkinson Hyperlegible, JetBrains Mono
 * - composants UI bas niveau (boutons, champs, modales)
 */
export default function PageDesignSystem() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Système de design</h1>
        <p className="text-lg text-neutral-700">
          Cette page sera complétée au chantier 0.2 : tokens CSS, polices (Fraunces, Atkinson
          Hyperlegible, JetBrains Mono), composants UI bas niveau.
        </p>
      </header>

      <nav aria-label="Navigation interne">
        <Link href="/" className="text-neutral-900 underline underline-offset-4 hover:no-underline">
          Retour à l'accueil
        </Link>
      </nav>
    </main>
  );
}
