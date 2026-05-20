'use client';

import { cn } from '@/lib/utils';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/**
 * Trois modes de thème supportés :
 * - `auto` : suit `prefers-color-scheme` (aucun `data-theme` posé sur <html>).
 * - `light` : force le mode clair.
 * - `dark` : force le mode sombre.
 *
 * La préférence est persistée dans `localStorage` sous la clé `theme`.
 * Tant que l'auth n'est pas en place (chantier 1.2), c'est le seul lieu
 * de stockage. À partir du chantier 1.3, la préférence connectée sera
 * miroitée dans `personne.preferences_ui` (cf. 04_DESIGN-TOKENS.md §3).
 */
export type ModeTheme = 'auto' | 'light' | 'dark';

const CLE_STOCKAGE = 'theme';

/**
 * Lit la préférence stockée. Retourne `auto` si rien ou valeur invalide.
 * Exporté pour le script anti-FOUC.
 */
function lirePreference(): ModeTheme {
  if (typeof window === 'undefined') return 'auto';
  const valeur = window.localStorage.getItem(CLE_STOCKAGE);
  if (valeur === 'light' || valeur === 'dark') return valeur;
  return 'auto';
}

/**
 * Pose (ou retire) l'attribut `data-theme` sur <html>.
 * `auto` retire l'attribut pour redonner la main à `prefers-color-scheme`.
 */
function appliquerTheme(mode: ModeTheme): void {
  const html = document.documentElement;
  if (mode === 'auto') {
    html.removeAttribute('data-theme');
  } else {
    html.setAttribute('data-theme', mode);
  }
}

/**
 * Composant bouton qui fait cycler le thème : auto -> light -> dark -> auto.
 * L'icône affichée correspond au mode actuel.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ModeTheme>('auto');
  const [monte, setMonte] = useState(false);

  useEffect(() => {
    setMode(lirePreference());
    setMonte(true);
  }, []);

  const basculer = useCallback(() => {
    setMode((courant) => {
      const suivant: ModeTheme =
        courant === 'auto' ? 'light' : courant === 'light' ? 'dark' : 'auto';
      if (suivant === 'auto') {
        window.localStorage.removeItem(CLE_STOCKAGE);
      } else {
        window.localStorage.setItem(CLE_STOCKAGE, suivant);
      }
      appliquerTheme(suivant);
      return suivant;
    });
  }, []);

  const libelle =
    mode === 'auto' ? 'thème automatique' : mode === 'light' ? 'thème clair' : 'thème sombre';
  const libelleSuivant =
    mode === 'auto' ? 'thème clair' : mode === 'light' ? 'thème sombre' : 'thème automatique';
  const Icone = mode === 'auto' ? Monitor : mode === 'light' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={`Basculer vers le ${libelleSuivant}. Actuel : ${libelle}.`}
      title={`Thème : ${libelle}`}
      data-mode={monte ? mode : 'auto'}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-md',
        'border border-border bg-surface text-text-1',
        'transition-[transform,box-shadow,background-color] duration-fast',
        'hover:bg-surface-2 active:scale-[0.97]',
        className,
      )}
    >
      <Icone size={18} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

/**
 * Script bloquant injecté dans <head> qui applique la préférence stockée
 * AVANT le premier rendu, pour éviter le flash de thème incorrect (FOUC).
 *
 * Server Component : génère du HTML statique, pas d'hydratation. C'est
 * pour cela que le layout passe `suppressHydrationWarning` sur <html>.
 */
export function ScriptInitTheme() {
  const script = `(function(){try{var v=localStorage.getItem('${CLE_STOCKAGE}');if(v==='dark'||v==='light'){document.documentElement.setAttribute('data-theme',v);}}catch(e){}})();`;
  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: script anti-FOUC contrôlé en dur.
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
