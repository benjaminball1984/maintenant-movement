'use client';

import { envoyerMessage } from '@/app/(public)/s-informer/reseau/actions';
import { Alert, Button, IconButton, Label, Textarea } from '@/components/ui';
import type { VariantBouton } from '@/components/ui/Button';
import { X } from 'lucide-react';
import { useRef, useState } from 'react';

/**
 * Modal d'envoi d'un message direct (messagerie interne du réseau social).
 *
 * Réutilisable partout où l'on veut écrire à une personne : page profil réseau,
 * liste des membres d'une commune (décision A), etc. Utilise `<dialog>` natif
 * (accessible : focus trap, Échap, backdrop), cohérent avec les autres modales.
 */
export function ModaleMessage({
  destinataireId,
  destinataireNom,
  libelleBouton = 'Envoyer un message',
  variantBouton = 'outline',
}: {
  destinataireId: string;
  destinataireNom: string;
  libelleBouton?: string;
  variantBouton?: VariantBouton;
}) {
  const refDialog = useRef<HTMLDialogElement>(null);
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  const ouvrir = () => {
    setTexte('');
    setErreur(null);
    setEnvoye(false);
    refDialog.current?.showModal();
  };
  const fermer = () => refDialog.current?.close();

  const envoyer = async (evenement: React.FormEvent) => {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    const resultat = await envoyerMessage({ destinataire_id: destinataireId, texte });
    setEnCours(false);
    if (resultat.ok) {
      setEnvoye(true);
      setTexte('');
    } else {
      setErreur(resultat.message);
    }
  };

  return (
    <>
      <Button variant={variantBouton} taille="sm" onClick={ouvrir}>
        {libelleBouton}
      </Button>

      <dialog
        ref={refDialog}
        className="m-auto w-full max-w-md rounded-lg border border-border bg-surface p-0 shadow-lg backdrop:bg-black/40"
        aria-label={`Envoyer un message à ${destinataireNom}`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-cap text-text-3">Message à</p>
            <p className="mt-1 font-bold text-text-1">{destinataireNom}</p>
          </div>
          <IconButton aria-label="Fermer" onClick={fermer} taille="sm">
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </header>

        {envoye ? (
          <div className="grid gap-4 p-6 text-center">
            <p className="font-display text-xl font-bold text-text-1">Message envoyé.</p>
            <p className="text-text-2">
              {destinataireNom} le verra dans sa messagerie. Tu retrouveras la conversation dans tes
              messages.
            </p>
            <Button onClick={fermer} variant="ghost">
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={envoyer} className="grid gap-3 p-6">
            {erreur !== null ? (
              <Alert variant="danger" titre="Envoi impossible">
                {erreur}
              </Alert>
            ) : null}
            <Label htmlFor="message-texte" obligatoire>
              Ton message
            </Label>
            <Textarea
              id="message-texte"
              rows={4}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder={`Écris à ${destinataireNom}...`}
              maxLength={5000}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={fermer}>
                Annuler
              </Button>
              <Button type="submit" disabled={enCours || texte.trim() === ''}>
                {enCours ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
