import { SITE } from '@/config/site';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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
};

/**
 * RootLayout : enveloppe toutes les routes du site.
 * Locale : français (lang="fr"). L'i18n viendra au chantier dédié, le
 * français est la locale par défaut et publique de Maintenant!.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
