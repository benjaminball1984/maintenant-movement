'use client';

import { mettreAJourReunionAction } from '@/app/actions/decider';
import { Alert, Button, Label, Textarea } from '@/components/ui';
import type { StatutReunion } from '@/lib/decider';
import { useState } from 'react';

const STATUTS: Array<{ value: StatutReunion; label: string }> = [
  { value: 'planifiee', label: 'Planifiée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'annulee', label: 'Annulée' },
];

/**
 * Formulaire admin d'édition d'une réunion Décider (V2.4.18) :
 * modifie l'ordre du jour, le PV, le statut.
 */
export function FormulaireMajReunion({
  reunionId,
  ordreJourInitial,
  pvInitial,
  statutInitial,
}: {
  reunionId: string;
  ordreJourInitial: string;
  pvInitial: string;
  statutInitial: StatutReunion;
}) {
  const [ordreJour, setOrdreJour] = useState(ordreJourInitial);
  const [pv, setPv] = useState(pvInitial);
  const [statut, setStatut] = useState<StatutReunion>(statutInitial);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const surEnregistrer = async () => {
    setEnCours(true);
    setErreur(null);
    setSucces(false);
    const r = await mettreAJourReunionAction({
      id: reunionId,
      ordre_jour_md: ordreJour,
      pv_md: pv,
      statut,
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setSucces(true);
  };

  return (
    <div className="mt-3 grid gap-3 rounded-md border border-brand bg-surface p-4">
      {succes ? (
        <Alert variant="success" titre="Réunion mise à jour">
          Les modifications sont enregistrées et visibles sur cette page.
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="r-statut">Statut</Label>
        <select
          id="r-statut"
          value={statut}
          onChange={(e) => setStatut(e.target.value as StatutReunion)}
          className="w-full rounded-md border border-border bg-surface p-2"
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="r-oj">Ordre du jour (Markdown)</Label>
        <Textarea
          id="r-oj"
          value={ordreJour}
          onChange={(e) => setOrdreJour(e.target.value)}
          rows={6}
          maxLength={20000}
        />
        <p className="mt-1 text-text-3 text-xs">{ordreJour.length} / 20 000</p>
      </div>

      <div>
        <Label htmlFor="r-pv">Procès-verbal (Markdown)</Label>
        <Textarea
          id="r-pv"
          value={pv}
          onChange={(e) => setPv(e.target.value)}
          rows={10}
          maxLength={50000}
          placeholder="## Présent·es&#10;…&#10;&#10;## Décisions&#10;…"
        />
        <p className="mt-1 text-text-3 text-xs">{pv.length} / 50 000</p>
      </div>

      <div>
        <Button onClick={surEnregistrer} disabled={enCours}>
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>

      {erreur !== null && (
        <p role="alert" className="text-danger text-sm">
          {erreur}
        </p>
      )}
    </div>
  );
}
