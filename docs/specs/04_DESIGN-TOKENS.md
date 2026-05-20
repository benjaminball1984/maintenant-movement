# Design tokens — Site Maintenant!

**Statut** : validé par Lilou/Ben le 20 mai 2026. Palette définitive, à appliquer telle quelle.
**Source** : design system `maintenant-design` (sessions Claude Design avant migration vers Claude Code).
**Règle** : tout passe par CSS variables et Tailwind config. Modifier une couleur ne doit jamais nécessiter de refacto.

---

## 1. Parti pris esthétique

**Editorial · Photo-first · Professional · 2025.** Mouvement politique populaire, sérieux et chaleureux, qui revendique une esthétique soignée et moderne sans tomber dans le SaaS lisse ni le militantisme criard.

**Signature visuelle** : un **gradient violet → magenta → framboise** comme marqueur identitaire principal. On le retrouve sur les CTA majeurs, les badges, certains accents typographiques. Sur fond crème en mode clair, sur fond noir chaud en mode sombre, il claque dans les deux.

**Adjectifs guides** : moderne, vibrant, militant, professionnel, lisible, accessible.

**Adjectifs à éviter** : startup-clean, gradient-violet-AI cliché, corporate-bleu, militant-criard.

---

## 2. Couleurs — mode clair

```css
:root {
  /* Fonds */
  --bg:        #FAFAF9;   /* crème chaude (ivoire papier), fond principal */
  --surface:   #FFFFFF;   /* surfaces des cartes, modales */
  --surface-2: #F5F4F2;   /* surfaces secondaires, zones de respiration */

  /* Bordures */
  --border:      #E8E6E1;
  --border-dark: #D4D1CA;

  /* Texte (4 niveaux) */
  --text-1: #1A1A18;  /* noir profond chaud, texte principal */
  --text-2: #4A4840;  /* gris chaud foncé, sous-titres */
  --text-3: #6B6962;  /* gris moyen, métadonnées */
  --text-4: #9C9A93;  /* gris clair, hints, placeholders */

  /* Brand (les 3 couleurs cœur) */
  --brand:        #E11D74;  /* magenta vif — point central */
  --brand-dark:   #B91560;
  --brand-light:  #FDE9F2;  /* fond clair pour badges magenta */

  --accent:        #7C3AED;  /* violet — gauche du gradient */
  --accent-light:  #F3EBFE;

  --hue:           #DC2654;  /* framboise — droite du gradient */
  --hue-light:     #FCE7EE;

  /* Gradients signature */
  --grad:      linear-gradient(135deg, #7C3AED 0%, #E11D74 50%, #DC2654 100%);
  --grad-r:    linear-gradient(to right, #7C3AED, #E11D74, #DC2654);
  --grad-soft: linear-gradient(135deg, #F3EBFE 0%, #FDE9F2 50%, #FCE7EE 100%);
  --grad-dark: linear-gradient(135deg, #5B21B6 0%, #B91560 100%);

  /* Sémantique */
  --success:       #16A34A;
  --success-light: #F0FDF4;
  --info:          #0369A1;
  --info-light:    #EFF6FF;
  --warning:       #D97706;
  --warning-light: #FFFBEB;
  --danger:        #DC2626;
  --danger-light:  #FCEBEB;

  /* Focus ring (signature visuelle aussi : magenta à 18 % d'opacité) */
  --focus-ring: 0 0 0 3px rgba(225, 29, 116, 0.18);

  /* Sélection texte */
  --selection-bg: rgba(225, 29, 116, 0.20);
}
```

---

## 3. Couleurs — mode sombre

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Fonds (inversés vers noir chaud) */
    --bg:        #16161A;
    --surface:   #1F1F23;
    --surface-2: #28282E;

    /* Bordures */
    --border:      #2E2D30;
    --border-dark: #3D3C3F;

    /* Texte (inversé) */
    --text-1: #FAFAF9;
    --text-2: #C9C5BB;
    --text-3: #8E8A82;
    --text-4: #6D6B65;

    /* Brand — légèrement éclaircis pour rester vibrants sur fond sombre */
    --brand:        #F03388;
    --brand-dark:   #D02472;
    --brand-light:  #3A1827;   /* fond très sombre pour badges */

    --accent:       #9059F5;
    --accent-light: #251A3C;

    --hue:          #E84770;
    --hue-light:    #361822;

    /* Gradients (versions éclaircies) */
    --grad:      linear-gradient(135deg, #9059F5 0%, #F03388 50%, #E84770 100%);
    --grad-r:    linear-gradient(to right, #9059F5, #F03388, #E84770);
    --grad-soft: linear-gradient(135deg, #251A3C 0%, #3A1827 50%, #361822 100%);
    --grad-dark: linear-gradient(135deg, #7C3AED 0%, #E11D74 100%);

    /* Sémantique (versions plus vives pour fond sombre) */
    --success:       #22C55E;
    --success-light: #052E16;
    --info:          #3B82F6;
    --info-light:    #0C2A52;
    --warning:       #F59E0B;
    --warning-light: #2D1D06;
    --danger:        #EF4444;
    --danger-light:  #2C0A0A;

    --focus-ring: 0 0 0 3px rgba(240, 51, 136, 0.30);
    --selection-bg: rgba(240, 51, 136, 0.25);
  }
}
```

### Toggle manuel du dark mode

En plus du `prefers-color-scheme` automatique, on permet à la personne utilisatrice de forcer un mode via une classe sur `<html>` :

```css
html[data-theme="dark"] { /* mêmes overrides que ci-dessus */ }
html[data-theme="light"] { /* force le mode clair même si l'OS est en sombre */ }
```

Préférence stockée dans Supabase (table `personne.preferences_ui`), avec fallback localStorage si déconnecté·e.

---

## 4. Typographies

### Polices

| Rôle | Police | Pourquoi |
|---|---|---|
| **Display (titres, headings)** | **Sora** | Sans serif géométrique moderne, expressive en gras, libre. Google Fonts. |
| **Body (corps de texte)** | **Inter** | Sans serif neutre très lisible, optimisée pour l'écran. Libre. Google Fonts. |
| **Mono (code, données numériques)** | **JetBrains Mono** | Libre. Google Fonts. |

### Échelle typographique

```css
:root {
  --size-xs:   0.75rem;    /* 12px */
  --size-sm:   0.875rem;   /* 14px */
  --size-base: 1rem;       /* 16px */
  --size-lg:   1.125rem;   /* 18px */
  --size-xl:   1.25rem;    /* 20px */
  --size-2xl:  1.5rem;     /* 24px */
  --size-3xl:  1.875rem;   /* 30px */
  --size-4xl:  2.5rem;     /* 40px */
  --size-5xl:  3.5rem;     /* 56px */
  --size-6xl:  5rem;       /* 80px */

  --leading-tight:  1.15;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;

  --tracking-tight:  -0.02em;
  --tracking-normal: 0;
  --tracking-wide:   0.08em;
  --tracking-cap:    0.12em;
}
```

### Hiérarchie d'usage

- `<h1>` : Sora 800, taille-5xl (mobile : 3xl), leading-tight, tracking-tight.
- `<h2>` : Sora 800, taille-3xl.
- `<h3>` : Sora 600, taille-2xl.
- `<h4>` : Sora 600, taille-xl.
- `<h5>`, `<h6>` : Inter 700, taille-lg.
- Corps : Inter 400, taille-base, leading-normal.
- Petites capitales (labels, badges, micro) : Inter 700, taille-xs, uppercase, tracking-cap.
- Métadonnées (date, auteurice, tags) : Inter 400, taille-sm, color text-3.
- Code : JetBrains Mono 400, taille-sm.

---

## 5. Espacements

Système 4px :

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-24: 6rem;     /* 96px */
}
```

### Conventions

- Padding interne d'une carte : `--space-6`.
- Marge entre blocs majeurs : `--space-12`.
- Marge entre sections d'une page : `--space-24`.
- Cible tactile minimum : 44 px (boutons, liens cliquables sur mobile).

---

## 6. Border radius

```css
:root {
  --radius-xs:   6px;
  --radius-sm:   8px;
  --radius-md:   12px;   /* défaut pour inputs et boutons */
  --radius-lg:   16px;   /* défaut pour cartes */
  --radius-xl:   20px;   /* grandes cartes, modales */
  --radius-pill: 9999px; /* pilules, avatars */
}
```

---

## 7. Ombres

```css
:root {
  --shadow-xs:    0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm:    0 2px 8px rgba(0,0,0,0.05);
  --shadow-md:    0 6px 18px rgba(0,0,0,0.07);
  --shadow-lg:    0 14px 40px rgba(0,0,0,0.10);
  --shadow-focus: var(--focus-ring);
  --shadow-brand: 0 2px 8px rgba(225, 29, 116, 0.25);  /* CTA gradient */
}

@media (prefers-color-scheme: dark) {
  :root {
    --shadow-xs:    0 1px 2px rgba(0,0,0,0.30);
    --shadow-sm:    0 2px 8px rgba(0,0,0,0.40);
    --shadow-md:    0 6px 18px rgba(0,0,0,0.50);
    --shadow-lg:    0 14px 40px rgba(0,0,0,0.60);
    --shadow-brand: 0 2px 14px rgba(240, 51, 136, 0.40);
  }
}
```

---

## 8. Motion (animations)

```css
:root {
  --dur-fast: 0.12s;
  --dur:      0.18s;
  --dur-slow: 0.28s;

  --ease: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Principes

- **Pas d'animation gratuite.** Chaque transition sert un état.
- **Pas d'autoplay vidéo, jamais.**
- **Pas de parallax au scroll, pas de carousels automatiques.**
- **Bouton actif** : `transform: scale(0.97)` pendant le clic (effet pression léger).
- **Apparition de modale** : `--dur` `--ease` avec fade + scale légère.
- **Hover sur bouton** : `--dur-fast` `--ease`.

---

## 9. États interactifs

Pour chaque élément cliquable :

- **Default** : couleur de base.
- **Hover** (souris) : couleur d'accent plus foncée + transition `--dur-fast`.
- **Focus** (clavier) : `box-shadow: var(--focus-ring)` + outline none.
- **Active** (clic) : `transform: scale(0.97)`.
- **Disabled** : opacité 0.5, curseur `not-allowed`.

```css
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

---

## 10. Composants signature

### Badge gradient « ✨ Vous » (createurice du contenu)

```css
.badge-vous {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, var(--accent), var(--brand));
  color: #fff;
  font-size: var(--size-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: var(--tracking-cap);
  box-shadow: var(--shadow-brand);
}
```

### Bouton gradient (CTA principal)

```css
.btn-gradient {
  background: var(--grad);
  color: #fff;
  box-shadow: var(--shadow-brand);
  border: none;
  border-radius: var(--radius-md);
  padding: 12px 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: var(--size-sm);
  min-height: 44px;
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease), box-shadow var(--dur) var(--ease);
}
.btn-gradient:active { transform: scale(0.97); }
```

### Bouton ghost (action secondaire)

```css
.btn-ghost {
  background: var(--surface);
  color: var(--text-1);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  /* mêmes dimensions et transitions que ci-dessus */
}
```

### Bouton outline (action neutre)

```css
.btn-outline {
  background: transparent;
  color: var(--brand);
  border: 1.5px solid var(--brand);
  /* mêmes dimensions et transitions */
}
```

---

## 11. Configuration Tailwind

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
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
        success: 'var(--success)',
        info: 'var(--info)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      backgroundImage: {
        'grad': 'var(--grad)',
        'grad-r': 'var(--grad-r)',
        'grad-soft': 'var(--grad-soft)',
        'grad-dark': 'var(--grad-dark)',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
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
    },
  },
  plugins: [],
} satisfies Config
```

---

## 12. Iconographie

- **Pack** : `lucide-react` (libre, cohérent, léger).
- Style : `stroke-width: 1.5`, taille par défaut 18-20 px inline.
- Couleur : héritée du texte parent ou explicite.
- Pas d'emoji dans les icônes UI (sauf cas particuliers éditoriaux assumés, ex le badge ✨ « Vous »).

---

## 13. Imprimable (Maintenant Médias journal-affiche)

Le site génère des PDF print-ready via Paged.js + Puppeteer. CSS print spécifique :

```css
@media print {
  :root {
    --bg: #FFFFFF;
    /* Garder magenta/violet/framboise mais ajuster pour CMYK si besoin */
  }
  /* Marges 5mm bleed pour A3 et A4 */
}
```

---

## 14. Accessibilité

- Cible **WCAG 2.1 niveau AA minimum**.
- Tous les couples texte / fond vérifiés contraste ≥ 4.5:1 (texte normal), ≥ 3:1 (texte large) en mode clair ET en mode sombre.
- Labels ARIA sur tous les éléments interactifs sans texte visible.
- Navigation clavier complète (Tab, Shift+Tab, Entrée, Esc).
- `focus-visible` toujours visible (focus ring magenta).
- Cible tactile 44 px minimum.
- `prefers-reduced-motion: reduce` respecté.
- Police Inter optimisée écran, Sora avec optical sizing si disponible.

---

## 15. Conformité au design system source

Ce fichier est la **sélection validée** par Lilou/Ben à partir du design system `maintenant-design` (sessions Claude Design antérieures). Les éléments écartés explicitement :

- **11 hues différenciées par service** (pétitions magenta, mobilisations violet, cagnottes pourpre, etc.) : on garde la palette unifiée violet/magenta/framboise pour une identité plus cohérente.
- **Stack tech mentionnée dans le README du design system** (Vite + Resend + Vercel) : on garde **Next.js + Brevo + Cloudflare Pages** comme tranché en S6 et confirmé en mai 2026.
- **Composants exacts** (CreateModal, UserBadge React, etc.) : on garde l'esprit mais on reconstruit propre dans Next.js + shadcn/ui.
- **Wording des pages** : appartient au référentiel vocabulaire v2 (`03_VOCABULAIRE.md`), pas au design.
