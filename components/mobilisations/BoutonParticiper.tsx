'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button } from '@/components/ui';
import { useEffect, useState } from 'react';

interface BoutonParticiperProps {
  mobilisationId: string;
  /** Server Action à appeler pour participer. */
  participerMobilisation: (
    donnees: unknown,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** True si la personne connectée participe déjà (info Server, RLS). */
  dejaParticipanteConnectee: boolean;
  /** Compteur initial (rendu côté serveur). */
  compteurInitial: number;
}

/**
 * `<BoutonParticiper>` — bouton « Je participe » d'une mobilisation
 * (cf. composants réutilisables spec §11).
 *
 * Comportement :
 *   - Si la personne connectée a déjà participé : badge « Tu participes »
 *     non cliquable (l'action est idempotente, pas de toggle prévu en v1).
 *   - Sinon, bouton cliquable + Turnstile invisible.
 *   - Dédoublonnage anonyme : on pose un cookie `participe_<mobId>=1`
 *     pour ne pas réafficher le bouton à la même personne sur le même
 *     navigateur. Le compteur peut bouger de +1 par anonyme honnête,
 *     mais l'UI ne triche pas à elle-même.
 *
 * « Anonyme par défaut » : la modale ne demande aucune information.
 * Code postal + accord notifications sont optionnels et viendront dans
 * une variante « participation détaillée » plus tard (chantier polish).
 */
export function BoutonParticiper({
  mobilisationId,
  participerMobilisation,
  dejaParticipanteConnectee,
  compteurInitial,
}: BoutonParticiperProps) {
  const [aParticipe, setAParticipe] = useState(dejaParticipanteConnectee);
  const [compteur, setCompteur] = useState(compteurInitial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [tokenTurnstile, setTokenTurnstile] = useState('');

  // Lecture du cookie anonyme au montage (seulement si la personne
  // n'est pas connectée — pour la connectée, la BDD est la source).
  useEffect(() => {
    if (dejaParticipanteConnectee) return;
    if (typeof document === 'undefined') return;
    const flag = `participe_${mobilisationId}=1`;
    if (document.cookie.split('; ').includes(flag)) {
      setAParticipe(true);
    }
  }, [mobilisationId, dejaParticipanteConnectee]);

  async function participer() {
    if (tokenTurnstile === '') {
      setErreur('Vérification anti-bot en cours. Réessaie dans un instant.');
      return;
    }
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await participerMobilisation({
      mobilisation_id: mobilisationId,
      accepte_notifications: false,
      token_turnstile: tokenTurnstile,
    });
    setEnvoiEnCours(false);

    if (!resultat.ok) {
      // Cas spécial : déjà participé côté BDD → on aligne l'UI.
      if (resultat.message.includes('participes déjà')) {
        setAParticipe(true);
        return;
      }
      setErreur(resultat.message);
      return;
    }

    setAParticipe(true);
    setCompteur((n) => n + 1);
    // Cookie anonyme : 90 jours (au-delà, la personne peut re-cliquer
    // sans contrainte technique, cela reste de l'« honor system »).
    if (typeof document !== 'undefined') {
      const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `participe_${mobilisationId}=1; expires=${expires}; path=/; SameSite=Lax`;
    }
  }

  return (
    <div className="grid gap-3" data-testid="bouton-participer">
      {erreur !== null ? (
        <Alert variant="danger" titre="Participation impossible">
          {erreur}
        </Alert>
      ) : null}

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-text-1">{compteur}</span>
        <span className="text-sm text-text-3">
          participant·e{compteur > 1 ? 's' : ''} {aParticipe ? '(toi inclus·e)' : ''}
        </span>
      </div>

      {aParticipe ? (
        <Button variant="ghost" disabled>
          Tu participes ✓
        </Button>
      ) : (
        <>
          <CaptchaTurnstile onChange={setTokenTurnstile} />
          <Button onClick={participer} disabled={envoiEnCours}>
            {envoiEnCours ? 'Enregistrement...' : 'Je participe'}
          </Button>
          <p className="text-xs text-text-3">
            Un clic suffit. Anonyme par défaut (aucune information demandée).
          </p>
        </>
      )}
    </div>
  );
}
