import type { Config } from 'tailwindcss';

/**
 * Configuration Tailwind du site Maintenant!.
 *
 * Toutes les couleurs, polices, rayons et ombres sont mappés sur des
 * variables CSS définies dans `styles/tokens.css` (cf. docs/specs/04_DESIGN-TOKENS.md).
 * Ce indirect permet le toggle light/dark sans recompilation Tailwind.
 *
 * Les classes utilitaires usuelles deviennent donc :
 * - `bg-bg`, `bg-surface`, `bg-surface-2`
 * - `text-text-1`, `text-text-2`, `text-text-3`, `text-text-4`
 * - `border-border`, `border-border-dark`
 * - `text-brand`, `bg-brand`, `bg-brand-light`, `text-accent`, etc.
 * - `bg-grad`, `bg-grad-r`, `bg-grad-soft`, `bg-grad-dark`
 * - `font-display`, `font-body`, `font-mono`
 * - `rounded-md`, `rounded-pill`, etc.
 * - `shadow-brand`, `shadow-focus`, etc.
 *
 * Les polices `font-display`/`font-body`/`font-mono` consomment les
 * variables CSS exposées par `next/font/google` dans `app/layout.tsx`
 * (--font-display, --font-body, --font-mono).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'border-dark': 'var(--border-dark)',
        'text-1': 'var(--text-1)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        'text-4': 'var(--text-4)',
        brand: {
          DEFAULT: 'var(--brand)',
          dark: 'var(--brand-dark)',
          light: 'var(--brand-light)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
        },
        hue: {
          DEFAULT: 'var(--hue)',
          light: 'var(--hue-light)',
        },
        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
        },
        info: {
          DEFAULT: 'var(--info)',
          light: 'var(--info-light)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light: 'var(--warning-light)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          light: 'var(--danger-light)',
        },
      },
      backgroundImage: {
        grad: 'var(--grad)',
        'grad-r': 'var(--grad-r)',
        'grad-soft': 'var(--grad-soft)',
        'grad-dark': 'var(--grad-dark)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        xs: 'var(--size-xs)',
        sm: 'var(--size-sm)',
        base: 'var(--size-base)',
        lg: 'var(--size-lg)',
        xl: 'var(--size-xl)',
        '2xl': 'var(--size-2xl)',
        '3xl': 'var(--size-3xl)',
        '4xl': 'var(--size-4xl)',
        '5xl': 'var(--size-5xl)',
        '6xl': 'var(--size-6xl)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        focus: 'var(--shadow-focus)',
        brand: 'var(--shadow-brand)',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        DEFAULT: '180ms',
        slow: '280ms',
      },
      letterSpacing: {
        tight: 'var(--tracking-tight)',
        normal: 'var(--tracking-normal)',
        wide: 'var(--tracking-wide)',
        cap: 'var(--tracking-cap)',
      },
      lineHeight: {
        tight: 'var(--leading-tight)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
      },
    },
  },
  plugins: [],
};

export default config;
