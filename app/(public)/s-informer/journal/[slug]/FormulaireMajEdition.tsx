'use client';

import { mettreAJourEditionAction } from '@/app/actions/journal';
import { EditeurRicheAvecToolbar } from '@/components/rich-text/EditeurRicheAvecToolbar';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { ChampImageObjet } from '@/components/ui/ChampImageObjet';
import { markdownLegerEnHtml } from '@/lib/rich-text/markdown-vers-html';
import { FileText, Sparkles } from 'lucide-react';
import { useState } from 'react';

/**
 * Formulaire admin d'édition d'une édition existante du journal-affiche
 * (V2.4.19). Inline sur la page publique de l'édition.
 */
type ModeContenu = 'markdown' | 'riche';

export function FormulaireMajEdition({
  id,
  titreInitial,
  sousTitreInitial,
  contenuInitial,
  contenuHtmlInitial = null,
  imageInitial,
  numeroInitial,
  formatInitial,
}: {
  id: string;
  titreInitial: string;
  sousTitreInitial: string;
  contenuInitial: string;
  /** V2.5.33 — HTML riche initial (optionnel). */
  contenuHtmlInitial?: string | null;
  imageInitial: string;
  numeroInitial: number;
  formatInitial: 'A3' | 'A4';
}) {
  const [titre, setTitre] = useState(titreInitial);
  const [sousTitre, setSousTitre] = useState(sousTitreInitial);
  const [contenu, setContenu] = useState(contenuInitial);
  const [contenuHtml, setContenuHtml] = useState(contenuHtmlInitial ?? '');
  const [mode, setMode] = useState<ModeContenu>(
    contenuHtmlInitial !== null && contenuHtmlInitial !== '' ? 'riche' : 'markdown',
  );
  const [imageUrl, setImageUrl] = useState(imageInitial);
  const [numero, setNumero] = useState(numeroInitial);
  const [format, setFormat] = useState<'A3' | 'A4'>(formatInitial);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const surEnregistrer = async () => {
    if (titre.trim().length === 0) return;
    setEnCours(true);
    setErreur(null);
    setSucces(false);
    const r = await mettreAJourEditionAction({
      id,
      titre: titre.trim(),
      sous_titre: sousTitre.trim() === '' ? null : sousTitre.trim(),
      contenu_md: contenu,
      // V2.5.33 — envoie aussi le HTML riche (vide = efface côté serveur,
      // retour au Markdown). Sanitization côté Server Action.
      contenu_html: contenuHtml,
      image_couverture_url: imageUrl.trim() === '' ? null : imageUrl.trim(),
      numero,
      format,
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
        <Alert variant="success" titre="Édition mise à jour">
          Les modifications sont enregistrées et visibles sur cette page.
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="ej-titre" obligatoire>
          Titre
        </Label>
        <Input
          id="ej-titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          maxLength={300}
        />
      </div>

      <div>
        <Label htmlFor="ej-sstitre">Sous-titre</Label>
        <Input
          id="ej-sstitre"
          value={sousTitre}
          onChange={(e) => setSousTitre(e.target.value)}
          maxLength={500}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="ej-num" obligatoire>
            Numéro
          </Label>
          <Input
            id="ej-num"
            type="number"
            min={1}
            value={numero}
            onChange={(e) => setNumero(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="ej-format">Format</Label>
          <select
            id="ej-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as 'A3' | 'A4')}
            className="w-full rounded-md border border-border bg-surface p-2"
          >
            <option value="A3">A3</option>
            <option value="A4">A4</option>
          </select>
        </div>
      </div>

      <ChampImageObjet
        name="ej-img"
        libelle="Image de couverture"
        prefixeChemin="journal-affiche"
        valeurInitiale={imageUrl}
        onChange={(url) => setImageUrl(url ?? '')}
      />

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Label htmlFor="ej-contenu">Contenu</Label>
          <div className="inline-flex overflow-hidden rounded-md border border-border text-xs">
            <button
              type="button"
              onClick={() => {
                // V2.5.33 — bascule vers Riche pré-remplit avec la conversion
                // du Markdown si le HTML est vide (pour ne pas perdre le contenu).
                if (contenuHtml === '' && contenu.trim() !== '') {
                  setContenuHtml(markdownLegerEnHtml(contenu));
                }
                setMode('riche');
              }}
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
              onClick={() => setMode('markdown')}
              className={`inline-flex items-center gap-1 border-border border-l px-3 py-1 ${
                mode === 'markdown' ? 'bg-brand text-white' : 'bg-surface text-text-2'
              }`}
              aria-pressed={mode === 'markdown'}
            >
              <FileText size={11} aria-hidden="true" />
              Markdown
            </button>
          </div>
        </div>
        {mode === 'riche' ? (
          <>
            <EditeurRicheAvecToolbar
              contenuInitialHtml={contenuHtml}
              onChange={setContenuHtml}
              placeholder="Rédige ton article (couleurs, polices, listes, citations, lien, image, YouTube…)"
              hauteurMin={320}
              labelA11y="Contenu de l’article (éditeur de texte riche)"
            />
            <p className="mt-1 flex items-center justify-between text-text-3 text-xs">
              <span>HTML sanitizé à l'enregistrement (anti-XSS).</span>
              {contenuHtml !== '' ? (
                <button
                  type="button"
                  onClick={() => setContenuHtml('')}
                  className="text-danger hover:underline"
                >
                  Vider le HTML riche (retour Markdown)
                </button>
              ) : null}
            </p>
          </>
        ) : (
          <>
            <Textarea
              id="ej-contenu"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              rows={12}
              maxLength={50000}
            />
            <p className="mt-1 text-text-3 text-xs">{contenu.length} / 50 000</p>
          </>
        )}
      </div>

      <div>
        <Button onClick={surEnregistrer} disabled={enCours || titre.trim().length === 0}>
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
