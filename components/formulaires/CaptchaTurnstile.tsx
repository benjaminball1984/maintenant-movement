'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Composant captcha anti-bot.
 *
 * Comportement selon `NEXT_PUBLIC_TURNSTILE_PROVIDER` (côté client) :
 *
 * - `mock` (défaut) : pas de widget Cloudflare. Le composant retourne
 *   immédiatement un token fictif `mock-valid-token` pour ne pas bloquer
 *   les tests locaux et l'UX en dev.
 *
 * - `cloudflare` : charge le script Cloudflare Turnstile, monte le widget
 *   et expose le token réel via `onChange`.
 *
 * Robustesse mobile (revue Ben 2026-06-13 : « le captcha ne fonctionne pas
 * sur mobile, je ne peux pas créer de compte ») : si le widget échoue à se
 * charger ou à rendre (fréquent sur Safari iOS avec la prévention du
 * pistage, ou sur réseau lent), le composant affiche un message clair et un
 * bouton « Réessayer » qui relance le challenge, AU LIEU de laisser
 * l'utilisateurice coincé·e avec un bouton de soumission grisé sans
 * explication.
 *
 * Dans tous les cas, **la vérification serveur passe par `TurnstileService`**
 * (cf. `lib/turnstile/`). Le mock retourne `success: true`, le réel
 * appelle Cloudflare siteverify.
 */

interface CaptchaTurnstileProps {
  /** Callback appelé à chaque obtention/renouvellement de token. */
  onChange: (token: string) => void;
  /** Optionnel : appelé en cas d'expiration du token. */
  onExpire?: () => void;
  /** Optionnel : appelé en cas d'erreur du widget. */
  onError?: (codeErreur: string) => void;
  /**
   * Compteur de réinitialisation : à CHAQUE changement de valeur (> 0), le
   * widget régénère un jeton frais. Indispensable après une soumission :
   * le jeton Turnstile est à USAGE UNIQUE et expire en 5 min ; sans reset,
   * toute nouvelle tentative est rejetée par le serveur (« timeout-or-
   * duplicate ») alors que le widget affiche encore « Succès » (bug signalé
   * par Ben 2026-06-13 : connexion impossible, vérification anti-bot
   * échouée, alors que le captcha est vert).
   */
  resetTrigger?: number;
}

/**
 * Token fictif retourné en mode mock. Doit être > vide pour passer la
 * validation Zod côté client. Le serveur `MockTurnstileService.verifier`
 * acceptera tous les tokens qui ne commencent pas par `mock-invalide-`.
 */
const TOKEN_MOCK_VALIDE = 'mock-valid-token';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (code: string) => void;
          'timeout-callback'?: () => void;
          appearance?: 'always' | 'execute' | 'interaction-only';
          retry?: 'auto' | 'never';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function CaptchaTurnstile({
  onChange,
  onExpire,
  onError,
  resetTrigger = 0,
}: CaptchaTurnstileProps) {
  const provider = process.env.NEXT_PUBLIC_TURNSTILE_PROVIDER ?? 'mock';
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const conteneurRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Incrémenté par « Réessayer » pour forcer un remontage propre du widget.
  const [tentative, setTentative] = useState(0);
  const [enErreur, setEnErreur] = useState(false);

  // Les callbacks sont gardés dans des refs pour que l'effet de montage du
  // widget ne dépende pas de leur identité. Les formulaires parents passent
  // souvent des fonctions inline, recréées à chaque rendu : sans ces refs,
  // l'effet se relancerait en boucle (démontage/remontage du widget).
  const onChangeRef = useRef(onChange);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onChangeRef.current = onChange;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

  // Mode mock : on retourne immédiatement le token fictif.
  useEffect(() => {
    if (provider === 'mock') {
      onChangeRef.current(TOKEN_MOCK_VALIDE);
    }
  }, [provider]);

  /** Réessayer : remonte le widget proprement (bouton après échec). */
  const reessayer = useCallback(() => {
    if (widgetIdRef.current !== null && window.turnstile?.remove !== undefined) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // widget déjà retiré : sans effet.
      }
    }
    widgetIdRef.current = null;
    setEnErreur(false);
    setTentative((n) => n + 1);
  }, []);

  // Réinitialisation déclenchée par le parent (après une soumission) : le
  // jeton précédent est consommé/expiré, on en régénère un frais.
  const premierRendu = useRef(true);
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    if (provider === 'mock') {
      onChangeRef.current(TOKEN_MOCK_VALIDE);
      return;
    }
    // Invalide le jeton côté formulaire (le bouton se rebloque) puis
    // remonte le widget Cloudflare pour obtenir un nouveau jeton.
    onChangeRef.current('');
    reessayer();
  }, [resetTrigger, provider, reessayer]);

  // Mode cloudflare : on monte le widget dès que l'API Turnstile est prête.
  //
  // On NE se repose PAS sur le seul `onLoad` du <Script> : il peut ne pas se
  // redéclencher en navigation interne (script déjà présent) ou se déclencher
  // avant que `window.turnstile` soit réellement utilisable. On interroge donc
  // l'API en boucle courte jusqu'à ce qu'elle réponde.
  useEffect(() => {
    if (provider !== 'cloudflare') return;
    if (siteKey === undefined || siteKey === '') {
      onErrorRef.current?.('site-key-manquante');
      setEnErreur(true);
      return;
    }
    const cleSite = siteKey;

    let annule = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let essais = 0;
    // Mobile lent : on patiente plus longtemps qu'avant (~20 s) avant
    // d'afficher le recours « Réessayer ».
    const MAX_ESSAIS = 130; // ~20 s (130 x 150 ms).

    function monterWidget() {
      if (annule || widgetIdRef.current !== null) return;
      const conteneur = conteneurRef.current;
      if (window.turnstile === undefined || conteneur === null) {
        essais += 1;
        if (essais > MAX_ESSAIS) {
          onErrorRef.current?.('script-non-charge');
          setEnErreur(true);
          return;
        }
        timer = setTimeout(monterWidget, 150);
        return;
      }
      // On passe l'ÉLÉMENT DOM (pas un sélecteur CSS) : plus robuste que
      // `#:r0:` généré par useId (deux-points à échapper, fragile selon les
      // navigateurs mobiles).
      widgetIdRef.current = window.turnstile.render(conteneur, {
        sitekey: cleSite,
        callback: (token) => {
          setEnErreur(false);
          onChangeRef.current(token);
        },
        'expired-callback': () => {
          onExpireRef.current?.();
          if (widgetIdRef.current !== null) {
            window.turnstile?.reset(widgetIdRef.current);
          }
        },
        'error-callback': (code) => {
          onErrorRef.current?.(code);
          setEnErreur(true);
        },
        'timeout-callback': () => {
          onErrorRef.current?.('timeout');
          setEnErreur(true);
        },
        // Laisse Cloudflare réessayer tout seul les erreurs transitoires.
        retry: 'auto',
        // Garde la case anti-robot toujours visible (et son état) plutôt que de
        // la laisser se valider en arrière-plan : l'utilisateurice voit toujours
        // qu'une vérification a lieu et quand elle est terminée.
        appearance: 'always',
      });
    }
    monterWidget();

    return () => {
      annule = true;
      if (timer !== undefined) clearTimeout(timer);
      if (widgetIdRef.current !== null && window.turnstile?.remove !== undefined) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // sans effet
        }
        widgetIdRef.current = null;
      }
    };
  }, [provider, siteKey, tentative]);

  if (provider === 'mock') {
    return (
      <p className="text-xs text-text-3" aria-live="polite">
        Captcha désactivé (mode mock).
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      {/* max-w pour ne pas déborder sur mobile étroit. */}
      <div ref={conteneurRef} className="min-h-[65px] w-full max-w-[300px]" />
      {enErreur ? (
        <div className="text-xs text-text-2" aria-live="assertive">
          <p className="text-danger">La vérification anti-robot n’a pas pu se charger.</p>
          <button
            type="button"
            onClick={reessayer}
            className="mt-1 font-bold text-brand underline underline-offset-2"
          >
            Réessayer la vérification
          </button>
          <p className="mt-1 text-text-3">
            Si le problème persiste sur mobile, désactive « Empêcher le suivi entre sites » (Safari)
            ou essaie un autre navigateur.
          </p>
        </div>
      ) : null}
    </>
  );
}
