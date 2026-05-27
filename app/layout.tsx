import { ScriptInitTheme } from '@/components/ui/ThemeToggle';
import { SITE } from '@/config/site';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fontBody, fontDisplay, fontMono } from './fonts';
import './globals.css';

/**
 * Métadonnées globales du site.
 * Le titre par défaut est complété par `template` sur les sous-pages
 * (mécanisme `title.template` de Next.js App Router).
 */
export const metadata: Metadata = {
  title: {
    default: SITE.nom,
    template: `%s · ${SITE.nom}`,
  },
  description: SITE.descriptionCourte,
  metadataBase: new URL(SITE.urlProd),
  openGraph: {
    title: SITE.nom,
    description: SITE.descriptionCourte,
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};

/**
 * RootLayout : enveloppe toutes les routes du site.
 *
 * - Locale : français (lang="fr"). L'i18n viendra au chantier dédié, le
 *   français est la locale par défaut et publique de Maintenant!.
 * - Polices : exposées via variables CSS sur <html> et consommées par
 *   Tailwind (`font-display`, `font-body`, `font-mono`).
 * - `suppressHydrationWarning` est nécessaire car `ScriptInitTheme`
 *   modifie `data-theme` sur <html> avant l'hydratation React.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <head>
        <ScriptInitTheme />
      </head>
      <body className="bg-bg font-body text-text-1 antialiased">{children}</body>
    </html>
  );
}
