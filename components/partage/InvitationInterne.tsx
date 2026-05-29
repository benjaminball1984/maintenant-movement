'use client';

import { inviterReseauAction, listerMesSuivisAction } from '@/app/actions/invitation-interne';
import { AvatarReseau } from '@/components/reseau/AvatarReseau';
import { Alert, Button, IconButton, Textarea } from '@/components/ui';
import { Send, UserPlus, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface Suivi {
  personneId: string;
  nom: string | null;
  prenom: string | null;
  photoUrl: string | null;
  numero: string | null;
}

interface InvitationInterneProps {
  /** Texte du message pré-rempli (ex. "Je viens de signer cette pétition, …"). */
  messagePrerempli: string;
  /** URL à inclure dans le message (ajoutée à la fin). */
  url: string;
}

/**
 * `<InvitationInterne>` — voie interne d'invitation via la messagerie réseau
 * (V2.5.20 — Master Plan V2.6 Phase F sous-chantier V2.5.7.a).
 *
 * Complément de `<BoutonsPartage>` (voie externe WhatsApp/Email/etc.). Cette
 * voie interne permet d'inviter directement les personnes qu'on suit déjà
 * sur le réseau social Maintenant!. Pas de spam : cap 30 destinataires par
 * envoi, et seulement les personnes que l'utilisateur·rice suit (relation
 * unilatérale).
 *
 * Modale `<dialog>` natif. Charge la liste des suivis à l'ouverture. Cases
 * à cocher pour chaque personne. Message éditable pré-rempli. Compteur
 * destinataires + caractères. Feedback succès/erreur.
 */
export function InvitationInterne({ messagePrerempli, url }: InvitationInterneProps) {
  const refDialog = useRef<HTMLDialogElement>(null);
  const [suivis, setSuivis] = useState<Suivi[] | null>(null);
  const [coches, setCoches] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<number | null>(null);

  // Charge les suivis la première fois qu'on ouvre la modale.
  async function ouvrir() {
    setErreur(null);
    setSucces(null);
    setCoches(new Set());
    setMessage(`${messagePrerempli}\n\n${url}`);
    refDialog.current?.showModal();
    if (suivis === null) {
      const liste = await listerMesSuivisAction();
      setSuivis(liste);
    }
  }
  function fermer() {
    refDialog.current?.close();
  }

  function basculerCoche(id: string) {
    setCoches((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (coches.size === 0) {
      setErreur('Choisis au moins une personne à inviter.');
      return;
    }
    setErreur(null);
    setEnCours(true);
    const r = await inviterReseauAction({
      destinataires: Array.from(coches),
      message,
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setSucces(r.envoyes);
    setCoches(new Set());
  }

  function nomAffiche(s: Suivi): string {
    const n = [s.prenom, s.nom].filter((v) => v !== null && v.trim() !== '').join(' ');
    return n !== '' ? n : (s.numero ?? 'Personne');
  }

  return (
    <>
      <Button onClick={ouvrir} variant="outline" taille="sm">
        <UserPlus size={14} strokeWidth={1.5} className="mr-1.5" aria-hidden="true" />
        Inviter mes contacts Maintenant!
      </Button>

      <dialog
        ref={refDialog}
        className="m-auto w-full max-w-lg rounded-lg border border-border bg-surface p-0 shadow-lg backdrop:bg-black/40"
        aria-label="Inviter mes contacts du réseau Maintenant!"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-cap text-text-3">Invitation</p>
            <p className="mt-1 font-bold text-text-1">À mes contacts du réseau Maintenant!</p>
          </div>
          <IconButton aria-label="Fermer" onClick={fermer} taille="sm">
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </header>

        <form onSubmit={envoyer} className="grid gap-4 p-5">
          {erreur !== null ? (
            <Alert variant="danger" titre="Envoi impossible">
              {erreur}
            </Alert>
          ) : null}
          {succes !== null ? (
            <Alert variant="success" titre="Envoyé">
              {succes} message{succes > 1 ? 's' : ''} envoyé{succes > 1 ? 's' : ''}.
            </Alert>
          ) : null}

          {/* Liste des suivis */}
          <div className="grid gap-1.5">
            <p className="font-bold text-sm text-text-1">Choisis qui inviter ({coches.size}/30)</p>
            {suivis === null ? (
              <p className="text-sm text-text-3">Chargement de tes contacts...</p>
            ) : suivis.length === 0 ? (
              <p className="text-sm text-text-3">
                Tu ne suis encore personne sur le réseau Maintenant!. Va sur{' '}
                <a href="/s-informer/reseau" className="text-brand hover:underline">
                  le réseau
                </a>{' '}
                pour découvrir des profils.
              </p>
            ) : (
              <ul className="max-h-64 overflow-y-auto rounded-md border border-border bg-surface-2 p-2">
                {suivis.map((s) => {
                  const coche = coches.has(s.personneId);
                  return (
                    <li key={s.personneId}>
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 transition hover:bg-surface ${
                          coche ? 'bg-brand-light/50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={coche}
                          onChange={() => basculerCoche(s.personneId)}
                          className="h-4 w-4 accent-brand"
                        />
                        <AvatarReseau nom={nomAffiche(s)} photoUrl={s.photoUrl} taillePx={28} />
                        <span className="text-sm text-text-1">{nomAffiche(s)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Zone message */}
          <div className="grid gap-1.5">
            <label htmlFor="invit-message" className="font-bold text-sm text-text-1">
              Message
            </label>
            <Textarea
              id="invit-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              className="resize-none"
            />
            <p className="text-right text-xs text-text-3">{message.length}/5000</p>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button onClick={fermer} variant="ghost" type="button" disabled={enCours}>
              Fermer
            </Button>
            <Button type="submit" disabled={enCours || coches.size === 0}>
              <Send size={14} strokeWidth={1.5} className="mr-1.5" aria-hidden="true" />
              {enCours
                ? 'Envoi...'
                : `Envoyer à ${coches.size} personne${coches.size > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
