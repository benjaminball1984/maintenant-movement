'use client';

import { posterDansFilGroupe } from '@/app/actions/fil-groupe';
import { Button } from '@/components/ui';
import type { EspaceTypeFil } from '@/lib/fil-groupe';
import { LONGUEUR_MAX_MESSAGE } from '@/lib/fil-groupe-validation';
import { Send } from 'lucide-react';
import { type FormEvent, useCallback, useState } from 'react';

/**
 * Formulaire de saisie d'un message dans le fil de groupe (cycle V2 §18,
 * V2.2.1).
 *
 * Client Component minimaliste : un textarea + un bouton. Validation
 * côté client (longueur, non-vide) AVANT envoi pour éviter un aller-retour
 * réseau inutile ; la Server Action revalide côté serveur.
 */

interface FormulairePosterMessageProps {
  espaceType: EspaceTypeFil;
  espaceId: string;
  cheminRevalidation?: string;
}

export function FormulairePosterMessage({
  espaceType,
  espaceId,
  cheminRevalidation,
}: FormulairePosterMessageProps) {
  const [contenu, setContenu] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const soumettre = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const valeur = contenu.trim();
      if (valeur.length === 0) {
        setErreur('Le message ne peut pas être vide.');
        return;
      }
      if (valeur.length > LONGUEUR_MAX_MESSAGE) {
        setErreur(`Le message dépasse ${LONGUEUR_MAX_MESSAGE} caractères.`);
        return;
      }
      setEnCours(true);
      setErreur(null);
      try {
        const resultat = await posterDansFilGroupe({
          espaceType,
          espaceId,
          contenu: valeur,
          cheminRevalidation,
        });
        if (resultat.ok) {
          setContenu('');
        } else {
          setErreur(resultat.message);
        }
      } catch (_erreur) {
        setErreur('Envoi impossible. Réessaie dans un instant.');
      } finally {
        setEnCours(false);
      }
    },
    [contenu, espaceType, espaceId, cheminRevalidation],
  );

  const compteurRestant = LONGUEUR_MAX_MESSAGE - contenu.length;

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-2">
      <label htmlFor="fil-groupe-contenu" className="sr-only">
        Message
      </label>
      <textarea
        id="fil-groupe-contenu"
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        rows={3}
        disabled={enCours}
        placeholder="Écris ton message au groupe…"
        maxLength={LONGUEUR_MAX_MESSAGE + 100}
        className="resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1 placeholder:text-text-4 focus:border-brand focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <span
          className={`text-xs ${compteurRestant < 0 ? 'text-danger' : 'text-text-3'}`}
          aria-live="polite"
        >
          {compteurRestant >= 0
            ? `${compteurRestant} caractères restants`
            : `${-compteurRestant} caractères de trop`}
        </span>
        <Button
          type="submit"
          variant="primary"
          taille="sm"
          disabled={enCours || contenu.trim().length === 0 || contenu.length > LONGUEUR_MAX_MESSAGE}
        >
          <Send size={16} aria-hidden="true" />
          {enCours ? 'Envoi…' : 'Publier'}
        </Button>
      </div>
      {erreur !== null && (
        <p role="alert" className="text-danger text-sm">
          {erreur}
        </p>
      )}
    </form>
  );
}
