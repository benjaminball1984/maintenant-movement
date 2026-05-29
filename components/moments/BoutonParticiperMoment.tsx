'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label } from '@/components/ui';
import { useState } from 'react';

interface BoutonParticiperMomentProps {
  momentId: string;
  participerMoment: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
}

export function BoutonParticiperMoment({
  momentId,
  participerMoment,
}: BoutonParticiperMomentProps) {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [token, setToken] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function envoyer() {
    setErreur(null);
    setEnCours(true);
    const resultat = await participerMoment({
      moment_id: momentId,
      prenom,
      email,
      telephone,
      token_turnstile: token,
    });
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(true);
  }

  if (succes) {
    return (
      <Alert variant="success" titre="Inscription enregistrée">
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          Participation enregistrée
        </span>
        Tes coordonnées sont visibles par l'organisateurice du moment uniquement.
      </Alert>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-text-3">
        Pas d'obligation : tu peux participer sans laisser tes coordonnées. Mais elles permettent à
        l'organisateurice de te recontacter en cas d'imprévu.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="part-prenom">Prénom (optionnel)</Label>
          <Input id="part-prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="part-email">Email (optionnel)</Label>
          <Input
            id="part-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="part-tel">Téléphone (optionnel)</Label>
          <Input
            id="part-tel"
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
          />
        </div>
      </div>
      <CaptchaTurnstile onChange={setToken} />
      {erreur !== null ? (
        <Alert variant="danger" titre="Inscription impossible">
          {erreur}
        </Alert>
      ) : null}
      <Button onClick={envoyer} disabled={enCours || token === ''}>
        {enCours ? 'Envoi...' : 'Je participe'}
      </Button>
    </div>
  );
}
