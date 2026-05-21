'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button } from '@/components/ui';
import { useState } from 'react';

interface BoutonRejoindreCommuneProps {
  communeId: string;
  /** Palier déterminé côté serveur avant l'affichage du bouton. */
  palier: 'direct' | 'deuxieme' | 'troisieme' | 'refus';
  /** Indique si la personne est déjà membre (affiche « Quitter » alors). */
  dejaMembre: boolean;
  rejoindreCommune: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  quitterCommune: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
}

/**
 * Bouton « Rejoindre cette commune » qui respecte les paliers de la
 * spec §7B :
 *   - direct    : 1 clic, action immédiate (0 commune actuelle).
 *   - deuxieme  : confirmation in-form (1 commune actuelle).
 *   - troisieme : confirmation in-form, message plus alarmant
 *                 (2 communes actuelles).
 *   - refus     : bouton désactivé + message d'explication
 *                 (3 communes actuelles).
 */
export function BoutonRejoindreCommune({
  communeId,
  palier,
  dejaMembre,
  rejoindreCommune,
  quitterCommune,
}: BoutonRejoindreCommuneProps) {
  const [tokenTurnstile, setTokenTurnstile] = useState('');
  const [confirme, setConfirme] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  if (dejaMembre) {
    return (
      <div className="grid gap-3">
        <Alert variant="info" titre="Tu participes déjà à cette commune">
          Tu peux quitter cette commune si tu le souhaites. Anti-spam : une seule transition
          d'appartenance par mois est autorisée.
        </Alert>
        <Button
          variant="ghost"
          onClick={async () => {
            setEnCours(true);
            setErreur(null);
            const resultat = await quitterCommune({ commune_id: communeId });
            setEnCours(false);
            if (!resultat.ok) setErreur(resultat.message);
          }}
          disabled={enCours}
        >
          {enCours ? 'Sortie en cours...' : 'Quitter cette commune'}
        </Button>
        {erreur !== null ? (
          <Alert variant="danger" titre="Sortie impossible">
            {erreur}
          </Alert>
        ) : null}
      </div>
    );
  }

  if (palier === 'refus') {
    return (
      <Alert variant="warning" titre="Tu participes déjà à 3 communes">
        Maintenant! limite la participation simultanée à 3 communes (cf. doctrine §7B). Quitte une
        commune avant d'en rejoindre une nouvelle.
      </Alert>
    );
  }

  return (
    <div className="grid gap-3">
      {palier === 'deuxieme' ? (
        <Alert variant="info" titre="Es-tu sûr·e ?">
          Tu participes déjà à une commune. Tu peux en rejoindre une 2e ; nous t'invitons à
          réfléchir à la cohérence de tes engagements.
        </Alert>
      ) : null}
      {palier === 'troisieme' ? (
        <Alert variant="warning" titre="Tu participes déjà à 2 communes">
          Ce sera ta 3e (et dernière) commune. Anti-spam : une seule transition d'appartenance par
          mois est autorisée.
        </Alert>
      ) : null}
      {palier !== 'direct' ? (
        <label className="flex items-start gap-2 text-sm text-text-2">
          <input
            type="checkbox"
            checked={confirme}
            onChange={(e) => setConfirme(e.target.checked)}
            className="mt-0.5 accent-brand"
          />
          <span>Je confirme vouloir rejoindre cette commune supplémentaire.</span>
        </label>
      ) : null}
      <CaptchaTurnstile onChange={setTokenTurnstile} />
      <Button
        onClick={async () => {
          if (palier !== 'direct' && !confirme) {
            setErreur('Coche la confirmation pour continuer.');
            return;
          }
          setEnCours(true);
          setErreur(null);
          const resultat = await rejoindreCommune({
            commune_id: communeId,
            confirme: palier !== 'direct',
            token_turnstile: tokenTurnstile,
          });
          setEnCours(false);
          if (!resultat.ok) setErreur(resultat.message);
        }}
        disabled={enCours || tokenTurnstile === ''}
      >
        {enCours ? 'Adhésion en cours...' : 'Rejoindre cette commune'}
      </Button>
      {erreur !== null ? (
        <Alert variant="danger" titre="Adhésion impossible">
          {erreur}
        </Alert>
      ) : null}
    </div>
  );
}
