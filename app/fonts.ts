import { Inter, JetBrains_Mono, Sora } from 'next/font/google';

/**
 * Polices du site Maintenant!.
 *
 * `next/font/google` télécharge les fichiers au moment du build et les
 * sert depuis notre propre origine : pas d'appel runtime à Google Fonts,
 * donc conforme à la doctrine RGPD minimale (pas de tiers tracker).
 *
 * Chaque police expose une variable CSS consommée par Tailwind via
 * `tailwind.config.ts` (`fontFamily.display`, `body`, `mono`).
 *
 * Source : docs/specs/04_DESIGN-TOKENS.md §4.
 */
export const fontDisplay = Sora({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '800'],
  display: 'swap',
  variable: '--font-display',
});

export const fontBody = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-body',
});

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-mono',
});
