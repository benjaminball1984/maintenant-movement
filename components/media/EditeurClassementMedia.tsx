'use client';

import { Button } from '@/components/ui';
import { TAGS_BREVES } from '@/lib/import-breves/tags';
import type { TypeMedia } from '@/types/database';
import { Check, Tag, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { reclasserMedia, retirerMedia } from '../../app/(public)/s-informer/media/actions';

/**
 * Éditeur inline admin du CLASSEMENT d'un contenu (demande Ben 2026-06-14 :
 * « pouvoir modifier les types, les tags et catégories en mode admin
 * directement sur chaque contenu »). Affiché sur chaque carte de la revue de
 * presse / médias. Ne modifie QUE le type et les tags (action
 * `reclasserMedia`) : aucun risque d'effacer le titre, le corps, l'image ou
 * la source. À n'afficher qu'aux admins.
 */

/** Types proposés, dans l'ordre le plus utile pour la revue de presse. */
const TYPES: { valeur: TypeMedia; libelle: string }[] = [
  { valeur: 'breve', libelle: 'Brève' },
  { valeur: 'video', libelle: 'Vidéo' },
  { valeur: 'podcast', libelle: 'Podcast' },
  { valeur: 'dessin', libelle: 'Dessin' },
  { valeur: 'article', libelle: 'Article' },
  { valeur: 'edito', libelle: 'Édito' },
  { valeur: 'tribune', libelle: 'Tribune' },
  { valeur: 'newsletter', libelle: 'Newsletter' },
];

export function EditeurClassementMedia({
  mediaId,
  typeInitial,
  tagsInitial,
}: {
  mediaId: string;
  typeInitial: TypeMedia;
  tagsInitial: string[];
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [type, setType] = useState<TypeMedia>(typeInitial);
  const [tags, setTags] = useState<string[]>(tagsInitial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmRetrait, setConfirmRetrait] = useState(false);
  const [enCours, demarrer] = useTransition();

  function basculerTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function annuler() {
    setType(typeInitial);
    setTags(tagsInitial);
    setErreur(null);
    setOuvert(false);
  }

  function enregistrer() {
    setErreur(null);
    demarrer(async () => {
      const r = await reclasserMedia({ media_id: mediaId, type, tags });
      if (!r.ok) {
        setErreur(r.message);
        return;
      }
      setOuvert(false);
      router.refresh();
    });
  }

  // Modération inline (demande Ben 2026-06-14) : retirer un contenu de la
  // publication directement depuis la carte, sans passer par le dashboard.
  function retirer() {
    setErreur(null);
    demarrer(async () => {
      const r = await retirerMedia({
        media_id: mediaId,
        raison_retrait: 'Retiré en modération depuis le classement.',
      });
      if (!r.ok) {
        setErreur(r.message);
        return;
      }
      router.refresh();
    });
  }

  if (!ouvert) {
    return (
      <Button type="button" variant="outline" taille="sm" onClick={() => setOuvert(true)}>
        <Tag size={14} strokeWidth={1.5} className="mr-1.5" aria-hidden="true" />
        Classer
      </Button>
    );
  }

  return (
    <div className="mt-1 w-full rounded-md border border-brand/40 bg-surface-2 p-3">
      <div className="grid gap-3">
        <label className="grid gap-1 text-xs font-bold uppercase tracking-cap text-text-3">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TypeMedia)}
            className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm font-normal normal-case text-text-1"
          >
            {TYPES.map((t) => (
              <option key={t.valeur} value={t.valeur}>
                {t.libelle}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="grid gap-1.5">
          <legend className="text-xs font-bold uppercase tracking-cap text-text-3">
            Tags / catégories
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {TAGS_BREVES.map((t) => {
              const actif = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => basculerTag(t)}
                  aria-pressed={actif}
                  className={
                    actif
                      ? 'rounded-pill border border-brand bg-brand px-2 py-0.5 text-[11px] text-white'
                      : 'rounded-pill border border-border bg-surface px-2 py-0.5 text-[11px] text-text-2 hover:border-brand hover:text-text-1'
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
        </fieldset>

        {erreur !== null ? <p className="text-xs font-bold text-danger">{erreur}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="gradient"
            taille="sm"
            disabled={enCours}
            onClick={enregistrer}
          >
            <Check size={14} strokeWidth={2} className="mr-1.5" aria-hidden="true" />
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button type="button" variant="outline" taille="sm" disabled={enCours} onClick={annuler}>
            <X size={14} strokeWidth={1.5} className="mr-1.5" aria-hidden="true" />
            Annuler
          </Button>
        </div>

        {/* Modération : retirer le contenu sans passer par le dashboard. */}
        <div className="border-border border-t pt-2">
          {confirmRetrait ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-text-2 text-xs">Retirer ce contenu de la publication ?</span>
              <Button
                type="button"
                variant="ghost"
                taille="sm"
                disabled={enCours}
                onClick={retirer}
                className="text-danger"
              >
                <Trash2 size={14} strokeWidth={1.6} className="mr-1.5" aria-hidden="true" />
                {enCours ? 'Retrait…' : 'Oui, retirer'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                taille="sm"
                disabled={enCours}
                onClick={() => setConfirmRetrait(false)}
              >
                Non
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRetrait(true)}
              className="text-danger text-xs underline underline-offset-2 hover:opacity-80"
            >
              Retirer ce contenu (modération)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
