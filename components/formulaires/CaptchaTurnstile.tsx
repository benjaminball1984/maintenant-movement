'use client';

import Script from 'next/script';
import { useEffect, useId, useRef, useState } from 'react';

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
  const [scriptCharge, setScriptCharge] = useState(false);

  // Mode mock : on retourne immédiatement le token fictif.
  useEffect(() => {
    if (provider === 'mock') {
      onChange(TOKEN_MOCK_VALIDE);
    }
  }, [provider, onChange]);

  // Mode cloudflare : on monte le widget une fois le script chargé.
  useEffect(() => {
    if (provider !== 'cloudflare' || !scriptCharge) {
      return;
    }
    if (siteKey === undefined || siteKey === '') {
      onError?.('site-key-manquante');
      return;
    }
    if (window.turnstile === undefined) {
      return;
    }

    const id = window.turnstile.render(`#${conteneurId.replace(/:/g, '\\:')}`, {
      sitekey: siteKey,
      callback: onChange,
      'expired-callback': onExpire,
      'error-callback': onError,
    });
    widgetIdRef.current = id;

    return () => {
      if (widgetIdRef.current !== null && window.turnstile !== undefined) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [provider, siteKey, scriptCharge, conteneurId, onChange, onExpire, onError]);

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
        onLoad={() => setScriptCharge(true)}
      />
      <div id={conteneurId} />
    </>
  );
}
