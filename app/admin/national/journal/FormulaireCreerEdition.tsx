'use client';

import { creerEditionJournalAction } from '@/app/actions/journal';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { ChampImageObjet } from '@/components/ui/ChampImageObjet';
import { useState } from 'react';

/**
 * Formulaire client pour créer une édition de journal-affiche (V2.4.13).
 */
export function FormulaireCreerEdition({ numeroSuggere }: { numeroSuggere: number }) {
  const [titre, setTitre] = useState('');
  const [sousTitre, setSousTitre] = useState('');
  const [numero, setNumero] = useState(numeroSuggere);
  const [format, setFormat] = useState<'A3' | 'A4'>('A3');
  const [contenuMd, setContenuMd] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publier, setPublier] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  /** Message d'état pour lecteur d'écran (annonce du succès, sinon muet). */
  const [messageStatut, setMessageStatut] = useState('');

  const surSoumettre = async () => {
    if (titre.trim().length === 0 || numero <= 0) return;
    setEnCours(true);
    setErreur(null);
    setSucces(null);
    const r = await creerEditionJournalAction({
      titre: titre.trim(),
      sous_titre: sousTitre.trim() === '' ? undefined : sousTitre.trim(),
      numero,
      format,
      contenu_md: contenuMd.trim() === '' ? undefined : contenuMd,
      image_couverture_url: imageUrl.trim() === '' ? undefined : imageUrl.trim(),
      publier,
    });
    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setSucces(r.slug);
    setMessageStatut('Édition créée');
    setTitre('');
    setSousTitre('');
    setContenuMd('');
    setImageUrl('');
    setPublier(false);
    setNumero(numero + 1);
  };

  return (
    <div className="grid gap-3 rounded-md border border-border bg-surface p-4">
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {messageStatut}
      </span>
      {succes !== null ? (
        <Alert variant="success" titre="Édition créée">
          Slug : <code className="font-mono">{succes}</code>.
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="ed-titre" obligatoire>
          Titre
        </Label>
        <Input
          id="ed-titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex. Maintenant n°1 — automne 2026"
          maxLength={300}
        />
      </div>

      <div>
        <Label htmlFor="ed-sstitre">Sous-titre (optionnel)</Label>
        <Input
          id="ed-sstitre"
          value={sousTitre}
          onChange={(e) => setSousTitre(e.target.value)}
          maxLength={500}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="ed-num" obligatoire>
            Numéro
          </Label>
          <Input
            id="ed-num"
            type="number"
            min={1}
            value={numero}
            onChange={(e) => setNumero(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="ed-format">Format</Label>
          <select
            id="ed-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as 'A3' | 'A4')}
            className="w-full rounded-md border border-border bg-surface p-2"
          >
            <option value="A3">A3</option>
            <option value="A4">A4</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={publier}
              onChange={(e) => setPublier(e.target.checked)}
            />
            Publier immédiatement
          </label>
        </div>
      </div>

      <ChampImageObjet
        name="ed-img"
        libelle="Image de couverture (optionnelle)"
        prefixeChemin="journal-affiche"
        valeurInitiale={imageUrl}
        onChange={(url) => setImageUrl(url ?? '')}
      />

      <div>
        <Label htmlFor="ed-contenu">Contenu (Markdown)</Label>
        <Textarea
          id="ed-contenu"
          value={contenuMd}
          onChange={(e) => setContenuMd(e.target.value)}
          rows={8}
          maxLength={50000}
          placeholder="# Édito&#10;Lorem ipsum…"
        />
      </div>

      <div>
        <Button onClick={surSoumettre} disabled={enCours || titre.trim().length === 0}>
          {enCours ? 'Création…' : 'Créer l’édition'}
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
