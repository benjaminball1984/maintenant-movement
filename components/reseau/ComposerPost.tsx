'use client';

import { creerPost } from '@/app/(public)/s-informer/reseau/actions';
import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Label, Textarea } from '@/components/ui';
import { ChampImageObjet } from '@/components/ui/ChampImageObjet';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Zone de rédaction d'une publication (réseau social). Sobre, sans captation
 * d'attention. Réservée aux personnes connectées (le parent décide de l'afficher).
 */
export function ComposerPost() {
  const router = useRouter();
  const [texte, setTexte] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [token, setToken] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  // Message d'état annoncé aux lecteurs d'écran (région live masquée).
  const [messageStatut, setMessageStatut] = useState('');

  const publier = async (evenement: React.FormEvent) => {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    const resultat = await creerPost({
      texte,
      image_url: imageUrl,
      token_turnstile: token,
    });
    setEnCours(false);
    if (resultat.ok) {
      setTexte('');
      setImageUrl('');
      setMessageStatut('Publication envoyée');
      router.refresh();
    } else {
      setErreur(resultat.message);
      setMessageStatut(resultat.message);
    }
  };

  return (
    <form
      onSubmit={publier}
      className="grid gap-3 rounded-lg border border-border bg-surface p-5 shadow-sm transition focus-within:border-brand/40 focus-within:shadow-md"
    >
      <Label htmlFor="post-texte" className="font-display text-base text-text-1">
        Quoi de neuf ?
      </Label>
      <Textarea
        id="post-texte"
        rows={3}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Partage une nouvelle, une question, une victoire, un coup de gueule…"
        maxLength={5000}
        className="resize-none"
      />
      <ChampImageObjet
        name="post-image"
        libelle="Image (optionnel)"
        prefixeChemin="reseau"
        valeurInitiale={imageUrl}
        onChange={(url) => setImageUrl(url ?? '')}
      />
      {erreur !== null ? <Alert variant="danger">{erreur}</Alert> : null}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {messageStatut}
      </span>
      <CaptchaTurnstile onChange={setToken} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-3">{texte.length}/5000 caractères</p>
        <Button type="submit" disabled={enCours || texte.trim() === ''}>
          {enCours ? 'Publication...' : 'Publier'}
        </Button>
      </div>
    </form>
  );
}
