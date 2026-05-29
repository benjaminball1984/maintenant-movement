'use client';

import { Alert, Button, Input, Label } from '@/components/ui';
import { useState } from 'react';
import { annulerSuppression, demanderSuppression } from '../actions';

interface SectionSuppressionProps {
  email: string;
  /** Date de demande si déjà en cours, sinon null. */
  suppressionDemandeeLe: string | null;
}

/**
 * Suppression différée 30 jours (RGPD §5A).
 *
 * Trois états :
 * 1. **Statut actif** : on propose le bouton « Supprimer mon compte ».
 *    Cliquer ouvre un formulaire de confirmation qui demande de retaper
 *    son email.
 * 2. **En cours de suppression** (statut `pending_deletion`) : on affiche
 *    la date butoir + le bouton « Annuler la suppression ».
 * 3. (état `anonymise` n'arrive jamais ici : la personne ne peut plus
 *    se reconnecter pour atteindre cette page.)
 */
export function SectionSuppression({ email, suppressionDemandeeLe }: SectionSuppressionProps) {
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [emailSaisi, setEmailSaisi] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  if (suppressionDemandeeLe !== null) {
    const dateDemande = new Date(suppressionDemandeeLe);
    const dateButoir = new Date(dateDemande);
    dateButoir.setDate(dateButoir.getDate() + 30);

    async function gererAnnulation() {
      setErreur(null);
      setEnCours(true);
      const resultat = await annulerSuppression();
      setEnCours(false);
      if (!resultat.ok) {
        setErreur(resultat.message);
      }
    }

    return (
      <div className="grid gap-3">
        <Alert variant="warning" titre="Suppression programmée">
          Demandée le{' '}
          {dateDemande.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
          . Ton compte sera définitivement anonymisé le{' '}
          {dateButoir.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
          .
        </Alert>
        {erreur !== null ? (
          <Alert variant="danger" titre="Annulation impossible">
            {erreur}
          </Alert>
        ) : null}
        <Button variant="outline" onClick={gererAnnulation} disabled={enCours}>
          {enCours ? 'Annulation en cours...' : 'Annuler la suppression'}
        </Button>
      </div>
    );
  }

  async function gererDemande(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    const resultat = await demanderSuppression({ confirmation_email: emailSaisi });
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
    }
    // En cas de succès, la page se re-render via revalidatePath dans la
    // Server Action. L'état passe à `pending_deletion` et la branche
    // ci-dessus prend la main.
  }

  if (!confirmationOuverte) {
    return (
      <Button
        variant="outline"
        className="border-danger text-danger hover:bg-danger-light"
        onClick={() => setConfirmationOuverte(true)}
      >
        Supprimer mon compte
      </Button>
    );
  }

  return (
    <form onSubmit={gererDemande} className="grid gap-3">
      <Alert variant="danger" titre="Suppression définitive après 30 jours">
        Une fois confirmée, tu as 30 jours pour annuler en te reconnectant. Passé ce délai, ton
        compte est anonymisé sans retour possible : tes contributions restent (sous « Membre anonyme
        »), ton identité disparaît.
      </Alert>
      <div>
        <Label htmlFor="supp-email" obligatoire>
          Pour confirmer, retape ton email
        </Label>
        <Input
          id="supp-email"
          type="email"
          value={emailSaisi}
          onChange={(e) => setEmailSaisi(e.target.value)}
          placeholder={email}
          aria-invalid={erreur !== null ? true : undefined}
          aria-describedby={
            erreur !== null ? 'supp-email-aide supp-email-erreur' : 'supp-email-aide'
          }
        />
        <p id="supp-email-aide" className="mt-1 text-xs text-text-3">
          Doit correspondre exactement à l’email de ton compte.
        </p>
      </div>
      {erreur !== null ? (
        <Alert id="supp-email-erreur" variant="danger" titre="Demande refusée">
          {erreur}
        </Alert>
      ) : null}
      <div className="flex gap-3">
        <Button
          type="submit"
          variant="outline"
          className="border-danger text-danger hover:bg-danger-light"
          disabled={enCours}
        >
          {enCours ? 'Envoi en cours...' : 'Confirmer la suppression'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setConfirmationOuverte(false);
            setEmailSaisi('');
            setErreur(null);
          }}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
