'use client';

import { creerPost } from '@/app/(public)/s-informer/reseau/actions';
import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
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
      router.refresh();
    } else {
      setErreur(resultat.message);
    }
  };

  return (
    <form onSubmit={publier} className="grid gap-3 rounded-lg border border-border bg-surface p-4">
      <Label htmlFor="post-texte">Partager quelque chose</Label>
      <Textarea
        id="post-texte"
        rows={3}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Quoi de neuf dans le mouvement ?"
        maxLength={5000}
      />
      <Input
        type="url"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Lien d’une image (optionnel)"
      />
      {erreur !== null ? <Alert variant="danger">{erreur}</Alert> : null}
      <CaptchaTurnstile onChange={setToken} />
      <div className="flex justify-end">
        <Button type="submit" disabled={enCours || texte.trim() === ''}>
          {enCours ? 'Publication...' : 'Publier'}
        </Button>
      </div>
    </form>
  );
}
