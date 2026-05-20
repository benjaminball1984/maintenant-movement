import type { Config } from 'tailwindcss';

/**
 * Configuration Tailwind du site Maintenant!
 *
 * Les tokens (couleurs, typographie, espacements, rayons) sont injectés au
 * chantier 0.2 depuis `docs/specs/04_DESIGN-TOKENS.md` sous forme de
 * variables CSS, puis exposés ici via `theme.extend`.
 *
 * Pour ce chantier 0.1, seules les sources de contenu sont déclarées :
 * Tailwind compile les classes utilisées par les fichiers `.ts`/`.tsx` de
 * `app/` et `components/`.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
