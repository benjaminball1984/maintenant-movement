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

/** Libelles surchargeables admin via CMS (V2.4.154). */
export interface LibellesPosterMessage {
  labelMessage: string;
  placeholderMessage: string;
  ctaSubmit: string;
  ctaEnCours: string;
  erreurVide: string;
  /** Substitue `{n}` par la longueur maximale autorisée. */
  erreurTropLong: string;
  erreurEnvoiImpossible: string;
  /** Substitue `{n}` par le nombre restant. */
  compteurRestant: string;
  /** Substitue `{n}` par le nombre en trop. */
  compteurTrop: string;
}

const LIBELLES_DEFAUT: LibellesPosterMessage = {
  labelMessage: 'Message',
  placeholderMessage: 'Écris ton message au groupe…',
  ctaSubmit: 'Publier',
  ctaEnCours: 'Envoi…',
  erreurVide: 'Le message ne peut pas être vide.',
  erreurTropLong: 'Le message dépasse {n} caractères.',
  erreurEnvoiImpossible: 'Envoi impossible. Réessaie dans un instant.',
  compteurRestant: '{n} caractères restants',
  compteurTrop: '{n} caractères de trop',
};

interface FormulairePosterMessageProps {
  espaceType: EspaceTypeFil;
  espaceId: string;
  cheminRevalidation?: string;
  libelles?: LibellesPosterMessage;
}

export function FormulairePosterMessage({
  espaceType,
  espaceId,
  cheminRevalidation,
  libelles = LIBELLES_DEFAUT,
}: FormulairePosterMessageProps) {
  const [contenu, setContenu] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const soumettre = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const valeur = contenu.trim();
      if (valeur.length === 0) {
        setErreur(libelles.erreurVide);
        return;
      }
      if (valeur.length > LONGUEUR_MAX_MESSAGE) {
        setErreur(libelles.erreurTropLong.replace('{n}', String(LONGUEUR_MAX_MESSAGE)));
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
        setErreur(libelles.erreurEnvoiImpossible);
      } finally {
        setEnCours(false);
      }
    },
    [contenu, espaceType, espaceId, cheminRevalidation, libelles],
  );

  const compteurRestant = LONGUEUR_MAX_MESSAGE - contenu.length;

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-2">
      <label htmlFor="fil-groupe-contenu" className="sr-only">
        {libelles.labelMessage}
      </label>
      <textarea
        id="fil-groupe-contenu"
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        rows={3}
        disabled={enCours}
        placeholder={libelles.placeholderMessage}
        maxLength={LONGUEUR_MAX_MESSAGE + 100}
        className="resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-1 placeholder:text-text-4 focus:border-brand focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <span
          className={`text-xs ${compteurRestant < 0 ? 'text-danger' : 'text-text-3'}`}
          aria-live="polite"
        >
          {compteurRestant >= 0
            ? libelles.compteurRestant.replace('{n}', String(compteurRestant))
            : libelles.compteurTrop.replace('{n}', String(-compteurRestant))}
        </span>
        <Button
          type="submit"
          variant="primary"
          taille="sm"
          disabled={enCours || contenu.trim().length === 0 || contenu.length > LONGUEUR_MAX_MESSAGE}
        >
          <Send size={16} aria-hidden="true" />
          {enCours ? libelles.ctaEnCours : libelles.ctaSubmit}
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
