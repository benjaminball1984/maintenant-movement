'use client';

import { Alert, Button, Input, Label } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { mettreAJourMedia } from '../../../../(public)/s-informer/media/actions';

/**
 * Formulaire d'édition admin d'un média (demande Ben 2026-06-13 : « en
 * mode admin il faut pouvoir modifier tous les contenus »). Tous les
 * champs de contenu sont éditables. Validation serveur dans
 * `mettreAJourMedia` (réservé admin).
 */

const TYPES: Array<{ valeur: string; libelle: string }> = [
  { valeur: 'edito', libelle: 'Édito' },
  { valeur: 'tribune', libelle: 'Tribune' },
  { valeur: 'article', libelle: 'Article' },
  { valeur: 'breve', libelle: 'Brève' },
  { valeur: 'dessin', libelle: 'Dessin' },
  { valeur: 'podcast', libelle: 'Podcast' },
  { valeur: 'video', libelle: 'Vidéo' },
  { valeur: 'newsletter', libelle: 'Newsletter' },
];

export interface MediaEditable {
  id: string;
  slug: string;
  titre: string;
  corps: string;
  type: string;
  vignette_url: string | null;
  media_url: string | null;
  tags: string[] | null;
  provenance_externe: string | null;
  source_url: string | null;
}

export function FormulaireEditionMedia({ media }: { media: MediaEditable }) {
  const router = useRouter();
  const [titre, setTitre] = useState(media.titre);
  const [type, setType] = useState(media.type);
  const [corps, setCorps] = useState(media.corps);
  const [vignetteUrl, setVignetteUrl] = useState(media.vignette_url ?? '');
  const [mediaUrl, setMediaUrl] = useState(media.media_url ?? '');
  const [tags, setTags] = useState((media.tags ?? []).join(', '));
  const [provenance, setProvenance] = useState(media.provenance_externe ?? '');
  const [sourceUrl, setSourceUrl] = useState(media.source_url ?? '');
  const [erreur, setErreur] = useState<string | null>(null);
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'ok'>('idle');

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEtat('envoi');
    const r = await mettreAJourMedia({
      media_id: media.id,
      titre: titre.trim(),
      corps: corps.trim(),
      type,
      vignette_url: vignetteUrl.trim(),
      media_url: mediaUrl.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t !== ''),
      provenance_externe: provenance.trim(),
      source_url: sourceUrl.trim(),
    });
    if (!r.ok) {
      setErreur(r.message);
      setEtat('idle');
      return;
    }
    setEtat('ok');
    router.push(`/s-informer/media/${r.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={enregistrer} className="grid gap-4">
      {erreur !== null ? (
        <Alert variant="danger" titre="Modification impossible">
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="med-titre" obligatoire>
          Titre
        </Label>
        <Input id="med-titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="med-type" obligatoire>
          Type
        </Label>
        <select
          id="med-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text-1"
        >
          {TYPES.map((t) => (
            <option key={t.valeur} value={t.valeur}>
              {t.libelle}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="med-corps" obligatoire>
          Contenu
        </Label>
        <textarea
          id="med-corps"
          value={corps}
          onChange={(e) => setCorps(e.target.value)}
          rows={14}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-text-1"
        />
      </div>

      <div>
        <Label htmlFor="med-vignette">Image / affiche (URL)</Label>
        <Input
          id="med-vignette"
          value={vignetteUrl}
          onChange={(e) => setVignetteUrl(e.target.value)}
          placeholder="https://…"
        />
        {vignetteUrl.trim() !== '' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vignetteUrl}
            alt=""
            className="mt-2 h-32 w-auto rounded-md border border-border object-cover"
          />
        ) : null}
      </div>

      <div>
        <Label htmlFor="med-tags">Tags (séparés par des virgules)</Label>
        <Input id="med-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>

      <details className="rounded-md border border-border p-3">
        <summary className="cursor-pointer text-sm font-bold text-text-2">
          Champs revue de presse (média externe : audio/vidéo, source)
        </summary>
        <div className="mt-3 grid gap-4">
          <div>
            <Label htmlFor="med-media-url">URL audio / embed vidéo</Label>
            <Input
              id="med-media-url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div>
            <Label htmlFor="med-provenance">Nom du média source</Label>
            <Input
              id="med-provenance"
              value={provenance}
              onChange={(e) => setProvenance(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="med-source">Lien source</Label>
            <Input
              id="med-source"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={etat === 'envoi'}>
          {etat === 'envoi' ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </Button>
        <a
          href={`/s-informer/media/${media.slug}`}
          className="text-sm text-text-3 underline underline-offset-2 hover:text-text-1"
        >
          Annuler
        </a>
      </div>
    </form>
  );
}
