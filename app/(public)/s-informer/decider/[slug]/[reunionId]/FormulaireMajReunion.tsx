'use client';

import { mettreAJourReunionAction } from '@/app/actions/decider';
import { EditeurRicheAvecToolbar } from '@/components/rich-text/EditeurRicheAvecToolbar';
import { Alert, Button, Label, Textarea } from '@/components/ui';
import type { StatutReunion } from '@/lib/decider';
import { markdownLegerEnHtml } from '@/lib/rich-text/markdown-vers-html';
import { FileText, Sparkles } from 'lucide-react';
import { useState } from 'react';

const STATUTS: Array<{ value: StatutReunion; label: string }> = [
  { value: 'planifiee', label: 'Planifiée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'annulee', label: 'Annulée' },
];

type ModeContenu = 'markdown' | 'riche';

/** Switch de mode (Riche / Markdown) reutilise pour OJ et PV. */
function SwitchMode({
  mode,
  onChanger,
}: {
  mode: ModeContenu;
  onChanger: (m: ModeContenu) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border text-xs">
      <button
        type="button"
        onClick={() => onChanger('riche')}
        className={`inline-flex items-center gap-1 px-3 py-1 ${
          mode === 'riche' ? 'bg-brand text-white' : 'bg-surface text-text-2'
        }`}
        aria-pressed={mode === 'riche'}
      >
        <Sparkles size={11} aria-hidden="true" />
        Riche
      </button>
      <button
        type="button"
        onClick={() => onChanger('markdown')}
        className={`inline-flex items-center gap-1 border-border border-l px-3 py-1 ${
          mode === 'markdown' ? 'bg-brand text-white' : 'bg-surface text-text-2'
        }`}
        aria-pressed={mode === 'markdown'}
      >
        <FileText size={11} aria-hidden="true" />
        Markdown
      </button>
    </div>
  );
}

/**
 * Formulaire admin d'édition d'une réunion Décider (V2.4.18, V2.5.37
 * étend le rich text à OJ + PV).
 *
 * Permet de modifier indépendamment :
 *  - Statut (planifiée / en cours / terminée / annulée)
 *  - Ordre du jour : Markdown OU rich text
 *  - Procès-verbal : Markdown OU rich text
 *
 * Chaque champ a son switch de mode propre (OJ et PV peuvent être
 * dans des modes différents). Au bascule Markdown → Riche, le HTML
 * vide est pré-rempli avec la conversion du Markdown courant pour
 * ne pas perdre le contenu (cf. `markdownLegerEnHtml`).
 */
export function FormulaireMajReunion({
  reunionId,
  ordreJourInitial,
  ordreJourHtmlInitial = null,
  pvInitial,
  pvHtmlInitial = null,
  statutInitial,
}: {
  reunionId: string;
  ordreJourInitial: string;
  /** V2.5.37 — HTML riche initial de l'OJ (optionnel). */
  ordreJourHtmlInitial?: string | null;
  pvInitial: string;
  /** V2.5.37 — HTML riche initial du PV (optionnel). */
  pvHtmlInitial?: string | null;
  statutInitial: StatutReunion;
}) {
  const [ordreJour, setOrdreJour] = useState(ordreJourInitial);
  const [ordreJourHtml, setOrdreJourHtml] = useState(ordreJourHtmlInitial ?? '');
  const [modeOj, setModeOj] = useState<ModeContenu>(
    ordreJourHtmlInitial !== null && ordreJourHtmlInitial !== '' ? 'riche' : 'markdown',
  );
  const [pv, setPv] = useState(pvInitial);
  const [pvHtml, setPvHtml] = useState(pvHtmlInitial ?? '');
  const [modePv, setModePv] = useState<ModeContenu>(
    pvHtmlInitial !== null && pvHtmlInitial !== '' ? 'riche' : 'markdown',
  );
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
      ordre_jour_html: ordreJourHtml,
      pv_md: pv,
      pv_html: pvHtml,
      statut,
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setSucces(true);
  };

  const surBasculerOj = (m: ModeContenu) => {
    if (m === 'riche' && ordreJourHtml === '' && ordreJour.trim() !== '') {
      setOrdreJourHtml(markdownLegerEnHtml(ordreJour));
    }
    setModeOj(m);
  };
  const surBasculerPv = (m: ModeContenu) => {
    if (m === 'riche' && pvHtml === '' && pv.trim() !== '') {
      setPvHtml(markdownLegerEnHtml(pv));
    }
    setModePv(m);
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
        <div className="mb-2 flex items-center justify-between gap-2">
          <Label htmlFor="r-oj">Ordre du jour</Label>
          <SwitchMode mode={modeOj} onChanger={surBasculerOj} />
        </div>
        {modeOj === 'riche' ? (
          <>
            <EditeurRicheAvecToolbar
              contenuInitialHtml={ordreJourHtml}
              onChange={setOrdreJourHtml}
              placeholder="Liste des points à traiter, format libre…"
              hauteurMin={180}
              labelA11y="Ordre du jour (éditeur de texte riche)"
            />
            {ordreJourHtml !== '' ? (
              <p className="mt-1 text-right text-text-3 text-xs">
                <button
                  type="button"
                  onClick={() => setOrdreJourHtml('')}
                  className="text-danger hover:underline"
                >
                  Vider le HTML riche (retour Markdown)
                </button>
              </p>
            ) : null}
          </>
        ) : (
          <>
            <Textarea
              id="r-oj"
              value={ordreJour}
              onChange={(e) => setOrdreJour(e.target.value)}
              rows={6}
              maxLength={20000}
            />
            <p className="mt-1 text-text-3 text-xs">{ordreJour.length} / 20 000</p>
          </>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Label htmlFor="r-pv">Procès-verbal</Label>
          <SwitchMode mode={modePv} onChanger={surBasculerPv} />
        </div>
        {modePv === 'riche' ? (
          <>
            <EditeurRicheAvecToolbar
              contenuInitialHtml={pvHtml}
              onChange={setPvHtml}
              placeholder="Rédige le compte-rendu (présent·es, décisions, prochaines étapes)…"
              hauteurMin={280}
              labelA11y="Procès-verbal (éditeur de texte riche)"
            />
            {pvHtml !== '' ? (
              <p className="mt-1 text-right text-text-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPvHtml('')}
                  className="text-danger hover:underline"
                >
                  Vider le HTML riche (retour Markdown)
                </button>
              </p>
            ) : null}
          </>
        ) : (
          <>
            <Textarea
              id="r-pv"
              value={pv}
              onChange={(e) => setPv(e.target.value)}
              rows={10}
              maxLength={50000}
              placeholder="## Présent·es&#10;…&#10;&#10;## Décisions&#10;…"
            />
            <p className="mt-1 text-text-3 text-xs">{pv.length} / 50 000</p>
          </>
        )}
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
