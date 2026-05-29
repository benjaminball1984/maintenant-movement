'use client';

import { publierAuNomDeLEspaceAction } from '@/app/actions/reseau-espace';
import { Alert, Button, Label, Textarea } from '@/components/ui';
import type { TypeEspacePostable } from '@/lib/reseau/types-espace';
import { Megaphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ComposerPostEspaceProps {
  espaceType: TypeEspacePostable;
  espaceId: string;
  /** Nom affichable de l'espace (ex. « Commune de Argenteuil »). */
  espaceNom: string;
  /** Chemin à revalider après publication. */
  cheminRevalidation: string;
}

/**
 * Composer de publication AU NOM d'un espace collectif (V2.5.18, finition
 * Phase H sous-chantier V2.5.10.b).
 *
 * Affiché sur la page détail d'un espace (commune, GT, etc.) quand la
 * personne est membre actif·ve ou admin général. Permet de poster un
 * message qui apparaîtra dans le flux du réseau social avec le badge
 * « publié par [Nom de l'espace] » (cf. CartePost.tsx V2.5.11.a).
 *
 * Sobre, sans captation : pas de placeholder agressif, pas d'analytics,
 * pas de suggestion algorithmique.
 */
export function ComposerPostEspace({
  espaceType,
  espaceId,
  espaceNom,
  cheminRevalidation,
}: ComposerPostEspaceProps) {
  const router = useRouter();
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function publier(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setSucces(false);
    setEnCours(true);
    const resultat = await publierAuNomDeLEspaceAction({
      espaceType,
      espaceId,
      texte,
      cheminRevalidation,
    });
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(true);
    setTexte('');
    router.refresh();
  }

  return (
    <form
      onSubmit={publier}
      className="grid gap-3 rounded-lg border border-brand/30 bg-brand-light/30 p-4 transition focus-within:border-brand/50"
    >
      <div className="flex items-center gap-2 text-sm text-brand">
        <Megaphone size={16} strokeWidth={1.5} aria-hidden="true" />
        <span className="font-bold">Publier au nom de {espaceNom}</span>
      </div>
      <Label htmlFor="composer-espace-texte" className="sr-only">
        Message
      </Label>
      <Textarea
        id="composer-espace-texte"
        rows={3}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Annonce, compte-rendu, appel à mobilisation… Le message apparaîtra dans le flux du réseau social avec un badge à ton espace."
        maxLength={5000}
        className="resize-none bg-surface"
      />
      {erreur !== null ? (
        <Alert variant="danger" titre="Publication impossible">
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre="Publié">
          Le message est visible dans le flux du réseau social.
        </Alert>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-3">{texte.length}/5000 caractères</p>
        <Button type="submit" disabled={enCours || texte.trim().length < 5}>
          {enCours ? 'Publication…' : `Publier au nom de ${espaceNom}`}
        </Button>
      </div>
    </form>
  );
}
