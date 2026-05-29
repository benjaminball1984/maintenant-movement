'use client';

import { Alert, Button, Label, Textarea, type VariantBouton } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Contrôle de modération réutilisable pour les pages `/admin/moderation/*`.
 *
 * Une page (Server Component) ne peut transmettre qu'une *référence* de
 * Server Action à un composant client, jamais une closure. Ce composant
 * reçoit donc, pour chaque action :
 *   - la référence de Server Action à appeler ;
 *   - le nom du champ identifiant (ex. `media_id`) et sa valeur ;
 *   - éventuellement le nom du champ « raison » (ex. `raison_retrait`).
 * Il assemble la charge utile côté client et l'envoie.
 *
 * Comportement :
 *   - une action sans raison s'exécute au clic (cas non destructif :
 *     publier, rétablir, réafficher) ;
 *   - une action avec raison ouvre un champ de saisie puis demande
 *     confirmation (cas destructif : retirer, suspendre).
 */
export interface ActionModeration {
  /** Libellé du bouton, ex. « Retirer ». */
  libelle: string;
  /** Variante visuelle du bouton (défaut : `ghost`). */
  variant?: VariantBouton;
  /** Référence de Server Action à appeler. */
  action: (donnees: unknown) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Nom du champ identifiant attendu par l'action, ex. `media_id`. */
  champId: string;
  /** Valeur de l'identifiant. */
  id: string;
  /** Si présent, un champ « raison » est demandé sous ce nom, ex. `raison_retrait`. */
  champRaison?: string;
  /** La raison est-elle obligatoire (défaut : true quand `champRaison` est fourni) ? */
  raisonObligatoire?: boolean;
  /** Placeholder du champ raison. */
  placeholderRaison?: string;
  /** Message affiché après succès. */
  messageSucces: string;
}

export function ControleModeration({
  actions,
  libelleObjet,
}: {
  actions: ActionModeration[];
  /**
   * Titre lisible de l'objet concerné (ex. « Annonce : Vélo à donner »).
   * Si fourni, il enrichit l'`aria-label` de chaque bouton d'action pour
   * que le lecteur d'écran distingue les boutons répétés ligne par ligne.
   * Optionnel : sans lui, le comportement est inchangé.
   */
  libelleObjet?: string;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [raison, setRaison] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function executer(action: ActionModeration, raisonSaisie: string) {
    setErreur(null);
    setEnvoiEnCours(true);
    const charge: Record<string, unknown> = { [action.champId]: action.id };
    if (action.champRaison !== undefined) {
      charge[action.champRaison] = raisonSaisie;
    }
    const resultat = await action.action(charge);
    setEnvoiEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(action.messageSucces);
    setOuverte(null);
    setRaison('');
    router.refresh();
  }

  function cliquer(action: ActionModeration, index: number) {
    if (action.champRaison === undefined) {
      void executer(action, '');
      return;
    }
    setErreur(null);
    setOuverte(index);
  }

  if (succes !== null) {
    return (
      <Alert variant="success" titre="Action enregistrée">
        {succes}
      </Alert>
    );
  }

  return (
    <div className="grid gap-3">
      {erreur !== null ? (
        <Alert variant="danger" titre="Action impossible">
          {erreur}
        </Alert>
      ) : null}

      {actions.map((action, index) => {
        const estOuverte = ouverte === index;
        const obligatoire = action.raisonObligatoire ?? true;
        const champId = `raison-${action.champId}-${action.id}-${index}`;

        if (action.champRaison !== undefined && estOuverte) {
          return (
            <form
              key={action.libelle}
              noValidate
              onSubmit={(evenement) => {
                evenement.preventDefault();
                if (obligatoire && raison.trim().length < 10) {
                  setErreur('Indique une raison d’au moins 10 caractères.');
                  return;
                }
                void executer(action, raison);
              }}
              className="grid gap-2"
            >
              <Label htmlFor={champId} obligatoire={obligatoire}>
                Raison
              </Label>
              <Textarea
                id={champId}
                rows={3}
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                placeholder={action.placeholderRaison ?? 'Motif de la décision.'}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  taille="sm"
                  disabled={envoiEnCours}
                  aria-label={
                    libelleObjet
                      ? `Confirmer ${action.libelle.toLowerCase()} : ${libelleObjet}`
                      : undefined
                  }
                >
                  {envoiEnCours ? 'Envoi...' : `Confirmer : ${action.libelle.toLowerCase()}`}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  taille="sm"
                  onClick={() => {
                    setOuverte(null);
                    setRaison('');
                  }}
                  disabled={envoiEnCours}
                >
                  Annuler
                </Button>
              </div>
            </form>
          );
        }

        return (
          <div key={action.libelle}>
            <Button
              variant={action.variant ?? 'ghost'}
              taille="sm"
              onClick={() => cliquer(action, index)}
              disabled={envoiEnCours}
              aria-label={libelleObjet ? `${action.libelle} : ${libelleObjet}` : undefined}
            >
              {action.libelle}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
