'use client';

import { Alert, Button } from '@/components/ui';
import { LIBELLES_PROVIDERS, PROVIDERS_GAFAM, type ProviderOAuth } from '@/lib/validations/auth';
import { useState } from 'react';
import { ouvrirOAuth } from '../actions';

/**
 * Boutons d'authentification OAuth (portes 3 et 4 sur 4).
 *
 * - **GAFAM** (Google / Apple / Microsoft) : supportés nativement par
 *   Supabase Auth. Nécessitent la configuration des credentials OAuth
 *   côté projet Supabase (dashboard > Auth > Providers).
 * - **Éthiques** (Mastodon / Framasoft / Solid) : prévus, mais retirés de
 *   l'affichage tant qu'ils ne fonctionnent pas (cf. commentaire en fin
 *   de composant).
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

      {/* Les portes « OAuth éthique » (Mastodon, Framasoft, Solid) étaient
          affichées ici en boutons désactivés marqués « (bientôt) ». Elles
          ont été retirées le 01/08/2026 : un bouton qui ne fait rien
          déçoit plus qu'il n'informe. Le code de branchement reste prévu
          dans `lib/validations/auth` (PROVIDERS_ETHIQUES) ; il suffira de
          rétablir ce bloc le jour où ces portes fonctionnent. */}
    </div>
  );
}
