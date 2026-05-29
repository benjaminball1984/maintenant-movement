'use client';

import { Alert, Badge, Card } from '@/components/ui';
import type { MaSignature } from '@/lib/petitions/requetes';
import Link from 'next/link';
import { useState } from 'react';
import { definirRecontactSignature } from './actions';

interface ListeMesSignaturesProps {
  signatures: MaSignature[];
}

/**
 * Liste des pétitions signées par la personne, avec pour chacune un
 * interrupteur de consentement « la créatrice peut me recontacter »,
 * modifiable a posteriori (RGPD : consentement granulaire et réversible).
 */
export function ListeMesSignatures({ signatures }: ListeMesSignaturesProps) {
  return (
    <ul className="grid gap-3">
      {signatures.map((signature) => (
        <li key={signature.id}>
          <LigneSignature signature={signature} />
        </li>
      ))}
    </ul>
  );
}

/** Libellés humains pour l'affichage d'un statut de pétition (badge). */
const LIBELLE_STATUT: Record<string, string> = {
  brouillon: 'Brouillon',
  en_moderation: 'En modération',
  publiee: 'Publiée',
  rejetee: 'Rejetée',
  cloturee: 'Clôturée',
  archivee: 'Archivée',
};

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function LigneSignature({ signature }: { signature: MaSignature }) {
  // État optimiste local : on reflète tout de suite le choix, et on revient
  // en arrière si la Server Action échoue.
  const [autorise, setAutorise] = useState(signature.accepte_contact_createurice);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function basculer(valeur: boolean) {
    setErreur(null);
    setEnCours(true);
    const precedent = autorise;
    setAutorise(valeur);

    const resultat = await definirRecontactSignature({
      signature_id: signature.id,
      autorise: valeur,
    });
    setEnCours(false);

    if (!resultat.ok) {
      setAutorise(precedent);
      setErreur(resultat.message);
    }
  }

  const idCase = `recontact-${signature.id}`;

  return (
    <Card variant="ombre" className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-bold text-text-1">
          <Link
            href={`/mobiliser/petitions/${signature.petition_slug}`}
            className="underline-offset-4 hover:underline"
          >
            {signature.petition_titre}
          </Link>
        </p>
        <span className="text-xs text-text-3">
          Signée le {FORMAT_DATE.format(new Date(signature.signee_le))}
        </span>
      </div>

      {signature.petition_statut !== 'publiee' ? (
        <Badge variant="default">
          {LIBELLE_STATUT[signature.petition_statut] ?? signature.petition_statut}
        </Badge>
      ) : null}

      <label
        htmlFor={idCase}
        className="flex cursor-pointer items-start gap-3 rounded-xs p-1 hover:bg-surface-2"
      >
        <input
          id={idCase}
          type="checkbox"
          className="mt-1 h-4 w-4 rounded-xs accent-brand"
          checked={autorise}
          disabled={enCours}
          onChange={(evenement) => void basculer(evenement.target.checked)}
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-text-1">
            Autoriser la créatrice à me recontacter
          </span>
          <span className="text-xs text-text-3">
            Tu peux changer d'avis à tout moment. Ce choix vaut pour cette pétition uniquement.
          </span>
        </span>
      </label>

      {erreur !== null ? (
        <Alert variant="danger" titre="Modification impossible">
          {erreur}
        </Alert>
      ) : null}
    </Card>
  );
}
