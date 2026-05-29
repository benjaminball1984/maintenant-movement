'use client';

import { Alert, Button } from '@/components/ui';
import {
  LIBELLES_PROVIDERS,
  PROVIDERS_ETHIQUES,
  PROVIDERS_GAFAM,
  type ProviderOAuth,
} from '@/lib/validations/auth';
import { useState } from 'react';
import { ouvrirOAuth } from '../actions';

/**
 * Boutons d'authentification OAuth (portes 3 et 4 sur 4).
 *
 * - **GAFAM** (Google / Apple / Microsoft) : supportés nativement par
 *   Supabase Auth. Nécessitent la configuration des credentials OAuth
 *   côté projet Supabase (dashboard > Auth > Providers).
 * - **Éthiques** (Mastodon / Framasoft / Solid) : posés en UI désactivée
 *   avec infobulle, branchement à un chantier dédié (OAuth custom via
 *   Supabase ou couche Keycloak intermédiaire). Voir MANIFEST 1.2.
 */
export function BoutonsOAuth() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<ProviderOAuth | null>(null);

  async function gererClic(provider: ProviderOAuth) {
    setErreur(null);
    setEnCours(provider);
    const resultat = await ouvrirOAuth(provider);
    setEnCours(null);

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    if (resultat.redirectVers !== undefined) {
      window.location.assign(resultat.redirectVers);
    }
  }

  return (
    <div className="grid gap-3">
      {erreur !== null ? (
        <Alert variant="warning" titre="OAuth indisponible">
          {erreur}
        </Alert>
      ) : null}

      <div>
        <p
          id="oauth-gafam-titre"
          className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3"
        >
          OAuth GAFAM
        </p>
        {/* biome-ignore lint/a11y/useSemanticElements: groupe de boutons relié à son titre via aria-labelledby ; un <fieldset> imposerait un <legend> et un style par défaut indésirables. */}
        <div className="grid gap-2" role="group" aria-labelledby="oauth-gafam-titre">
          {PROVIDERS_GAFAM.map((provider) => (
            <Button
              key={provider}
              type="button"
              variant="outline"
              onClick={() => gererClic(provider)}
              disabled={enCours !== null}
            >
              {enCours === provider
                ? 'Redirection en cours...'
                : `Continuer avec ${LIBELLES_PROVIDERS[provider]}`}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p
          id="oauth-ethique-titre"
          className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3"
        >
          OAuth éthique (à brancher au chantier dédié)
        </p>
        {/* biome-ignore lint/a11y/useSemanticElements: groupe de boutons relié à son titre via aria-labelledby ; un <fieldset> imposerait un <legend> et un style par défaut indésirables. */}
        <div className="grid gap-2" role="group" aria-labelledby="oauth-ethique-titre">
          {PROVIDERS_ETHIQUES.map((provider) => (
            <Button
              key={provider}
              type="button"
              variant="outline"
              disabled
              title={`Cette porte d'authentification sera branchée à un chantier dédié (${LIBELLES_PROVIDERS[provider]}).`}
            >
              {LIBELLES_PROVIDERS[provider]} (bientôt)
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
