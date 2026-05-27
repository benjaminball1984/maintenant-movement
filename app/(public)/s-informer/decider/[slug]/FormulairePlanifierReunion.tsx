'use client';

import { creerReunionAction } from '@/app/actions/decider';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { useState } from 'react';

const MODES = [
  { value: 'consensus', label: 'Consensus' },
  { value: 'levee_objections', label: "Levée d'objections" },
  { value: 'jugement_majoritaire', label: 'Jugement majoritaire' },
] as const;

/**
 * Formulaire client pour planifier une réunion sur une salle Décider
 * (V2.4.15). Visible uniquement en admin (le parent garde la condition).
 * Server Action validera de toute façon les droits.
 */
export function FormulairePlanifierReunion({ salleId }: { salleId: string }) {
  const [titre, setTitre] = useState('');
  const [ordreJour, setOrdreJour] = useState('');
  const [debutLe, setDebutLe] = useState('');
  const [finLe, setFinLe] = useState('');
  const [mode, setMode] = useState<(typeof MODES)[number]['value']>('consensus');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const surSoumettre = async () => {
    if (titre.trim().length === 0 || debutLe === '') return;
    setEnCours(true);
    setErreur(null);
    setSucces(false);
    const r = await creerReunionAction({
      salle_id: salleId,
      titre: titre.trim(),
      ordre_jour_md: ordreJour.trim() === '' ? undefined : ordreJour,
      debut_le: new Date(debutLe).toISOString(),
      fin_le: finLe === '' ? undefined : new Date(finLe).toISOString(),
      mode_decision: mode,
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setSucces(true);
    setTitre('');
    setOrdreJour('');
    setDebutLe('');
    setFinLe('');
  };

  return (
    <div className="mt-3 grid gap-3 rounded-md border border-brand bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-cap text-brand">Admin : planifier</p>

      {succes ? (
        <Alert variant="success" titre="Réunion planifiée">
          La réunion a été créée et apparaît dans la liste.
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="r-titre" obligatoire>
          Titre
        </Label>
        <Input
          id="r-titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          maxLength={300}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="r-debut" obligatoire>
            Début
          </Label>
          <Input
            id="r-debut"
            type="datetime-local"
            value={debutLe}
            onChange={(e) => setDebutLe(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="r-fin">Fin (optionnelle)</Label>
          <Input
            id="r-fin"
            type="datetime-local"
            value={finLe}
            onChange={(e) => setFinLe(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="r-mode">Mode de décision</Label>
        <select
          id="r-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as (typeof MODES)[number]['value'])}
          className="w-full rounded-md border border-border bg-surface p-2"
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="r-oj">Ordre du jour (Markdown, optionnel)</Label>
        <Textarea
          id="r-oj"
          value={ordreJour}
          onChange={(e) => setOrdreJour(e.target.value)}
          rows={6}
          maxLength={20000}
          placeholder="- Point 1&#10;- Point 2…"
        />
      </div>

      <div>
        <Button
          onClick={surSoumettre}
          disabled={enCours || titre.trim().length === 0 || debutLe === ''}
        >
          {enCours ? 'Création…' : 'Planifier la réunion'}
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
