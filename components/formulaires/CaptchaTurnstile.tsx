'use client';

import Script from 'next/script';
import { useEffect, useId, useRef } from 'react';

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
          appearance?: 'always' | 'execute' | 'interaction-only';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function CaptchaTurnstile({ onChange, onExpire, onError }: CaptchaTurnstileProps) {
  const provider = process.env.NEXT_PUBLIC_TURNSTILE_PROVIDER ?? 'mock';
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const conteneurId = useId();
  const widgetIdRef = useRef<string | null>(null);

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

  // Mode cloudflare : on monte le widget dès que l'API Turnstile est prête.
  //
  // On NE se repose PAS sur le seul `onLoad` du <Script> : il peut ne pas se
  // redéclencher en navigation interne (script déjà présent) ou se déclencher
  // avant que `window.turnstile` soit réellement utilisable. On interroge donc
  // l'API en boucle courte jusqu'à ce qu'elle réponde. Corrige le bug où le
  // widget n'apparaissait qu'après un rafraîchissement de la page.
  useEffect(() => {
    if (provider !== 'cloudflare') return;
    if (siteKey === undefined || siteKey === '') {
      onErrorRef.current?.('site-key-manquante');
      return;
    }
    // siteKey est désormais une chaîne non vide ; on la capture pour la closure.
    const cleSite = siteKey;

    let annule = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let essais = 0;
    const MAX_ESSAIS = 50; // ~7,5 s (50 x 150 ms) avant d'abandonner.

    function monterWidget() {
      if (annule || widgetIdRef.current !== null) return;
      if (window.turnstile === undefined) {
        essais += 1;
        if (essais > MAX_ESSAIS) {
          onErrorRef.current?.('script-non-charge');
          return;
        }
        timer = setTimeout(monterWidget, 150);
        return;
      }
      widgetIdRef.current = window.turnstile.render(`#${conteneurId.replace(/:/g, '\\:')}`, {
        sitekey: cleSite,
        callback: (token) => onChangeRef.current(token),
        'expired-callback': () => {
          onExpireRef.current?.();
          // Le jeton Turnstile expire au bout de ~5 minutes. Sans relance,
          // le formulaire garderait un jeton mort (soumission refusée côté
          // serveur) ou resterait bloqué « en attente ». On relance donc le
          // challenge : `callback` ci-dessus sera rappelé avec un jeton frais.
          if (widgetIdRef.current !== null) {
            window.turnstile?.reset(widgetIdRef.current);
          }
        },
        'error-callback': (code) => onErrorRef.current?.(code),
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
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [provider, siteKey, conteneurId]);

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
      <div id={conteneurId} />
    </>
  );
}
