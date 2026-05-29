'use client';

import { mettreAJourContenuEditorialAction } from '@/app/actions/contenu-editorial';
import { Alert, Button, Textarea } from '@/components/ui';
import { Check, Edit2, X } from 'lucide-react';
import { useState } from 'react';

interface EditeurInlineCMSProps {
  cle: string;
  valeurInitiale: string;
  /** Chemin à revalider après sauvegarde (optionnel). */
  cheminRevalidation?: string;
  /** Callback appelé après sauvegarde réussie avec la nouvelle valeur. */
  onSauvegarde?: (nouvelleValeur: string) => void;
}

/**
 * Éditeur inline pour la console CMS (V2.5.21 — sous-chantier V2.5.15.b).
 *
 * Affiche un bouton « ✎ Éditer » en mode lecture. Au clic, déplie un
 * textarea + boutons « Enregistrer » et « Annuler ». Au succès, replie
 * et affiche un feedback bref.
 *
 * Pas de preview avant publication pour cette V2.5.21 — c'est V2.5.15.c
 * (mode brouillon) qui ajoutera ça. Pour l'instant la sauvegarde est
 * immédiate (la console CMS étant accessible uniquement aux admins +
 * CMS, le risque d'erreur publique est borné).
 */
export function EditeurInlineCMS({
  cle,
  valeurInitiale,
  cheminRevalidation,
  onSauvegarde,
}: EditeurInlineCMSProps) {
  const [ouvert, setOuvert] = useState(false);
  const [valeur, setValeur] = useState(valeurInitiale);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  function ouvrir() {
    setValeur(valeurInitiale);
    setErreur(null);
    setSucces(false);
    setOuvert(true);
  }

  function annuler() {
    setValeur(valeurInitiale);
    setOuvert(false);
    setErreur(null);
  }

  async function sauvegarder() {
    setErreur(null);
    setSucces(false);
    setEnCours(true);
    const r = await mettreAJourContenuEditorialAction({
      cle,
      valeurMd: valeur,
      cheminRevalidation,
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setSucces(true);
    onSauvegarde?.(valeur);
    setTimeout(() => {
      setSucces(false);
      setOuvert(false);
    }, 1200);
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={ouvrir}
        className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
      >
        <Edit2 size={11} strokeWidth={1.5} aria-hidden="true" />
        Éditer ici
      </button>
    );
  }

  return (
    <div className="mt-2 grid gap-2 rounded-md border border-brand/30 bg-brand-light/30 p-3">
      {erreur !== null ? (
        <Alert variant="danger" titre="Sauvegarde impossible">
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre="Enregistré">
          Modification publiée.
        </Alert>
      ) : null}
      <Textarea
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        rows={Math.min(10, Math.max(3, valeur.split('\n').length))}
        className="resize-y bg-surface font-mono text-xs"
        maxLength={50000}
        aria-label={`Édition de ${cle}`}
      />
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-text-3">{valeur.length}/50000</span>
        <div className="flex gap-2">
          <Button onClick={annuler} variant="ghost" taille="sm" type="button" disabled={enCours}>
            <X size={12} strokeWidth={1.5} className="mr-1" aria-hidden="true" />
            Annuler
          </Button>
          <Button onClick={sauvegarder} taille="sm" type="button" disabled={enCours}>
            <Check size={12} strokeWidth={1.5} className="mr-1" aria-hidden="true" />
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
