'use client';

import { Alert, Button, Input, Label } from '@/components/ui';
import { useEffect, useState } from 'react';
import { demarrerEnrollementTotp, verifierEnrollementTotp } from '../../actions';

type Etat =
  | { type: 'chargement' }
  | { type: 'erreur'; message: string }
  | { type: 'pret'; factorId: string; uri: string; qr: string };

/**
 * Flux d'activation 2FA TOTP en deux étapes :
 *
 * 1. Au montage, on appelle `demarrerEnrollementTotp` qui retourne un
 *    secret + un QR code (data URL SVG).
 * 2. La personne scanne le QR avec son authenticator app.
 * 3. Elle saisit le code à 6 chiffres généré, on appelle
 *    `verifierEnrollementTotp` qui finalise l'enrôlement et redirige
 *    vers /profil/confidentialite?2fa=active.
 */
export function FormulaireEnrollementTotp() {
  const [etat, setEtat] = useState<Etat>({ type: 'chargement' });
  const [code, setCode] = useState('');
  const [erreurVerif, setErreurVerif] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    let annule = false;
    demarrerEnrollementTotp().then((resultat) => {
      if (annule) return;
      if (!resultat.ok) {
        setEtat({ type: 'erreur', message: resultat.message });
      } else {
        setEtat({
          type: 'pret',
          factorId: resultat.factorId,
          uri: resultat.uri,
          qr: resultat.qr,
        });
      }
    });
    return () => {
      annule = true;
    };
  }, []);

  async function gererVerification(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (etat.type !== 'pret') return;
    setErreurVerif(null);
    setEnCours(true);
    const resultat = await verifierEnrollementTotp({
      factor_id: etat.factorId,
      code,
    });
    setEnCours(false);
    if (!resultat.ok) {
      setErreurVerif(resultat.message);
    }
    // Succès : la Server Action redirige (`never`).
  }

  if (etat.type === 'chargement') {
    return <p className="text-text-3">Génération du QR code en cours...</p>;
  }

  if (etat.type === 'erreur') {
    return (
      <Alert variant="danger" titre="Activation impossible">
        {etat.message}
      </Alert>
    );
  }

  return (
    <div className="grid gap-6">
      <ol className="grid list-decimal gap-3 pl-6 text-sm text-text-2">
        <li>Ouvre ton app d'authentification (Google Authenticator, Aegis, Bitwarden, etc.).</li>
        <li>Scanne le QR code ci-dessous (ou saisis manuellement le secret).</li>
        <li>Tape le code à 6 chiffres généré dans le champ ci-dessous.</li>
      </ol>

      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6">
        <div
          // Le QR est retourné par Supabase au format SVG inline.
          // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG contrôlé venant du serveur Supabase.
          dangerouslySetInnerHTML={{ __html: etat.qr }}
          aria-label="QR code TOTP"
          // Fond blanc volontaire (bg-white) en mode clair comme en mode
          // sombre : le QR a besoin d'un contraste maximal sur clair pour
          // rester scannable par les apps d'authentification. La bordure
          // rounded-sm le détoure du conteneur surface.
          className="rounded-sm bg-white p-2"
        />
        <details className="w-full">
          <summary className="cursor-pointer text-sm text-text-3">
            Saisir manuellement à la place
          </summary>
          <p className="mt-2 break-all font-mono text-xs text-text-2">{etat.uri}</p>
        </details>
      </div>

      <form onSubmit={gererVerification} className="grid gap-3" aria-label="Vérification TOTP">
        <div>
          <Label htmlFor="totp-code" obligatoire>
            Code à 6 chiffres
          </Label>
          <Input
            id="totp-code"
            inputMode="numeric"
            maxLength={6}
            pattern="\d{6}"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            autoComplete="one-time-code"
          />
        </div>
        {erreurVerif !== null ? (
          <Alert variant="danger" titre="Code refusé">
            {erreurVerif}
          </Alert>
        ) : null}
        <Button type="submit" disabled={code.length !== 6 || enCours}>
          {enCours ? 'Vérification...' : 'Activer la 2FA'}
        </Button>
      </form>
    </div>
  );
}
