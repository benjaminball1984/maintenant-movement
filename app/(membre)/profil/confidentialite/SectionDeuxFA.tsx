'use client';

import { Alert, Badge, Button } from '@/components/ui';
import Link from 'next/link';
import { useState } from 'react';
import { desactiverTotp } from '../actions';

interface SectionDeuxFAProps {
  /** Si non null, la 2FA TOTP est active : l'id du facteur. */
  factorId: string | null;
  /** Indique si on revient juste d'activer la 2FA (query `?2fa=active`). */
  vientDActiver: boolean;
}

/**
 * Section 2FA TOTP (RGPD §5F).
 *
 * Trois états :
 * - **Active** (factorId fourni) : badge + bouton désactiver.
 * - **Inactive** : explication + bouton « Activer » qui mène à
 *   `/profil/securite/2fa`.
 * - **Active après revenue du flux** : Alert de succès une seule fois.
 *
 * Pour les comptes admin (chantier 9.1), la 2FA sera obligatoire et un
 * middleware redirigera vers `/profil/securite/2fa` au login.
 */
export function SectionDeuxFA({ factorId, vientDActiver }: SectionDeuxFAProps) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function gererDesactivation() {
    if (factorId === null) return;
    setErreur(null);
    setEnCours(true);
    const resultat = await desactiverTotp(factorId);
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
    }
  }

  if (factorId !== null) {
    return (
      <div className="grid gap-3">
        {vientDActiver ? (
          <Alert variant="success" titre="2FA activée">
            Ton compte est maintenant protégé par un code à 6 chiffres en plus de ton mot de passe.
          </Alert>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">Active</Badge>
          <p className="text-sm text-text-2">Authentification à deux facteurs TOTP en place.</p>
        </div>
        {erreur !== null ? (
          <Alert variant="danger" titre="Désactivation impossible">
            {erreur}
          </Alert>
        ) : null}
        <Button variant="ghost" onClick={gererDesactivation} disabled={enCours}>
          {enCours ? 'Désactivation en cours...' : 'Désactiver la 2FA'}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-text-2">
        Renforce la sécurité de ton compte avec un code à 6 chiffres généré par une app (Google
        Authenticator, Aegis, Bitwarden, etc.). Optionnel pour les comptes standards, obligatoire
        pour les comptes d’administration.
      </p>
      <div>
        <Link
          href="/profil/securite/2fa"
          className="inline-flex h-11 items-center justify-center rounded-md bg-grad px-5 font-bold text-sm text-white shadow-brand transition hover:brightness-110"
        >
          Activer la 2FA
        </Link>
      </div>
    </div>
  );
}
