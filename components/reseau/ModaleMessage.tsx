'use client';

import { envoyerMessage } from '@/app/(public)/s-informer/reseau/actions';
import { Alert, Button, IconButton, Label, Textarea } from '@/components/ui';
import type { VariantBouton } from '@/components/ui/Button';
import { MessageCircle, X } from 'lucide-react';
import { useRef, useState } from 'react';

/** Libelles surchargeables admin via CMS (V2.4.154). */
export interface LibellesModaleMessage {
  /** Substitue `{nom}` par le prénom/nom du·de la destinataire. */
  ariaLabel: string;
  surtitreA: string;
  alertSuccesTitre: string;
  /** Substitue `{nom}` par le prénom/nom du·de la destinataire. */
  alertSuccesCorps: string;
  ctaFermer: string;
  alertErreurTitre: string;
  labelMessage: string;
  /** Substitue `{nom}` par le prénom/nom du·de la destinataire. */
  placeholderMessage: string;
  ctaAnnuler: string;
  ctaSubmit: string;
  ctaEnCours: string;
  ariaFermer: string;
}

const LIBELLES_DEFAUT: LibellesModaleMessage = {
  ariaLabel: 'Envoyer un message à {nom}',
  surtitreA: 'Message à',
  alertSuccesTitre: 'Message envoyé.',
  alertSuccesCorps:
    '{nom} le verra dans sa messagerie. Tu retrouveras la conversation dans tes messages.',
  ctaFermer: 'Fermer',
  alertErreurTitre: 'Envoi impossible',
  labelMessage: 'Ton message',
  placeholderMessage: 'Écris à {nom}...',
  ctaAnnuler: 'Annuler',
  ctaSubmit: 'Envoyer',
  ctaEnCours: 'Envoi...',
  ariaFermer: 'Fermer',
};

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
  libelles = LIBELLES_DEFAUT,
}: {
  destinataireId: string;
  destinataireNom: string;
  libelleBouton?: string;
  variantBouton?: VariantBouton;
  libelles?: LibellesModaleMessage;
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
        aria-label={libelles.ariaLabel.replace('{nom}', destinataireNom)}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand"
              aria-hidden="true"
            >
              <MessageCircle size={18} strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-cap text-text-3">
                {libelles.surtitreA}
              </p>
              <p className="mt-0.5 font-bold text-text-1">{destinataireNom}</p>
            </div>
          </div>
          <IconButton aria-label={libelles.ariaFermer} onClick={fermer} taille="sm">
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </header>

        {envoye ? (
          <div className="grid gap-4 p-6 text-center">
            <p className="font-display text-xl font-bold text-text-1">
              {libelles.alertSuccesTitre}
            </p>
            <p className="text-text-2">
              {libelles.alertSuccesCorps.replace('{nom}', destinataireNom)}
            </p>
            <Button onClick={fermer} variant="ghost">
              {libelles.ctaFermer}
            </Button>
          </div>
        ) : (
          <form onSubmit={envoyer} className="grid gap-3 p-6">
            {erreur !== null ? (
              <Alert variant="danger" titre={libelles.alertErreurTitre}>
                {erreur}
              </Alert>
            ) : null}
            <Label htmlFor="message-texte" obligatoire>
              {libelles.labelMessage}
            </Label>
            <Textarea
              id="message-texte"
              rows={4}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder={libelles.placeholderMessage.replace('{nom}', destinataireNom)}
              maxLength={5000}
              className="resize-none"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-text-3">{texte.length}/5000</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={fermer}>
                  {libelles.ctaAnnuler}
                </Button>
                <Button type="submit" disabled={enCours || texte.trim() === ''}>
                  {enCours ? libelles.ctaEnCours : libelles.ctaSubmit}
                </Button>
              </div>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
