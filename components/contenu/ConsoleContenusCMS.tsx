'use client';

import { Badge, Input } from '@/components/ui';
import { ChevronDown, ChevronRight, ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

/**
 * Console d'édition CMS organisée par espace (V2.5.15 — Master Plan V2.6 Phase K).
 *
 * Au lieu d'une liste plate de centaines de clés intransportables, on offre :
 *  1. **Une barre de recherche** qui filtre instantanément par clé OU par valeur.
 *  2. **Un regroupement automatique par espace** (préfixe avant le premier `.`) :
 *     `home.*` ensemble, `footer.*` ensemble, `s-entraider.*` ensemble, etc.
 *  3. **Des groupes pliables** avec compteurs visibles (« home (24) »).
 *  4. **Un aperçu de la valeur** (60 premiers caractères) pour identifier en un
 *     coup d'œil.
 *  5. **Un lien direct vers la page publique** où la clé est utilisée (quand
 *     elle est connue), pour aller éditer en place via le `<TexteEditableAdmin>`.
 *
 * Pour cette première version V2.5.15, l'édition reste sur les pages publiques
 * (cohérent avec le pattern « clique sur ✏️ dans le contexte »). La console
 * sert à TROUVER vite la clé à modifier. L'édition inline dans la console est
 * prévue pour V2.5.15.a.
 */

export interface ContenuListe {
  cle: string;
  valeurMd: string;
  updatedAt: string;
  /** Chemin public connu pour cette clé (le cas échéant). */
  cheminPublic?: string;
  /** Titre humain de la page (si connu). */
  titrePage?: string;
}

interface ConsoleContenusCMSProps {
  contenus: ContenuListe[];
  /** Pages connues qui n'ont pas encore de contenu personnalisé (à rédiger). */
  pagesNonEditees: Array<{ cle: string; chemin: string; titre: string }>;
}

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Extrait l'espace d'une clé : tout ce qui est avant le premier `.`. */
function extraireEspace(cle: string): string {
  const idx = cle.indexOf('.');
  return idx === -1 ? cle : cle.slice(0, idx);
}

/** Aperçu court de la valeur (60 chars max). */
function apercu(valeur: string, max = 60): string {
  const propre = valeur.trim().replace(/\s+/g, ' ');
  return propre.length <= max ? propre : `${propre.slice(0, max)}…`;
}

export function ConsoleContenusCMS({ contenus, pagesNonEditees }: ConsoleContenusCMSProps) {
  const [recherche, setRecherche] = useState('');
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({});

  // Filtrage + regroupement mémoïsés.
  const groupes = useMemo(() => {
    const requete = recherche.trim().toLowerCase();
    const filtres = contenus.filter((c) => {
      if (requete === '') return true;
      return (
        c.cle.toLowerCase().includes(requete) ||
        c.valeurMd.toLowerCase().includes(requete) ||
        (c.titrePage?.toLowerCase().includes(requete) ?? false)
      );
    });
    const parEspace = new Map<string, ContenuListe[]>();
    for (const c of filtres) {
      const e = extraireEspace(c.cle);
      if (!parEspace.has(e)) parEspace.set(e, []);
      parEspace.get(e)?.push(c);
    }
    // Tri : espace par ordre alphabétique, clés dans chaque groupe par updated_at desc
    return Array.from(parEspace.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([espace, items]) => ({
        espace,
        items: items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      }));
  }, [contenus, recherche]);

  const totalAffiches = groupes.reduce((sum, g) => sum + g.items.length, 0);

  function basculer(espace: string) {
    setOuverts((o) => ({ ...o, [espace]: !o[espace] }));
  }

  function toutOuvrir() {
    setOuverts(Object.fromEntries(groupes.map((g) => [g.espace, true])));
  }
  function toutFermer() {
    setOuverts({});
  }

  // Quand on recherche, on ouvre automatiquement les groupes qui contiennent des résultats
  const ouvertsEffectifs: Record<string, boolean> =
    recherche.trim() !== '' ? Object.fromEntries(groupes.map((g) => [g.espace, true])) : ouverts;

  return (
    <div className="grid gap-6">
      {/* Pages à rédiger en haut, signalées clairement */}
      {pagesNonEditees.length > 0 ? (
        <section className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="mb-2 font-bold text-text-1">
            {pagesNonEditees.length} page{pagesNonEditees.length > 1 ? 's' : ''} à rédiger
          </p>
          <p className="mb-3 text-sm text-text-2">
            Ces pages affichent encore le fallback par défaut. Va sur chacune et clique sur ✏️ pour
            personnaliser le contenu.
          </p>
          <ul className="grid gap-1.5">
            {pagesNonEditees.map((p) => (
              <li key={p.cle} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-text-1">{p.titre}</span>
                <Link
                  href={p.chemin}
                  className="inline-flex items-center gap-1 text-brand hover:underline"
                >
                  <ExternalLink size={12} aria-hidden="true" />
                  {p.chemin}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Barre de recherche */}
      <div className="grid gap-3">
        <label htmlFor="cms-recherche" className="grid gap-1">
          <span className="text-sm font-bold text-text-1">Rechercher dans les contenus CMS</span>
          <span className="relative">
            <Search
              size={16}
              strokeWidth={1.5}
              className="-translate-y-1/2 absolute top-1/2 left-3 text-text-3"
              aria-hidden="true"
            />
            <Input
              id="cms-recherche"
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Tape une clé (ex. home, footer) ou un mot de la valeur…"
              className="pl-9"
            />
          </span>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-3">
          <p>
            <strong className="text-text-1">{totalAffiches}</strong> contenu
            {totalAffiches > 1 ? 's' : ''} en base · <strong>{groupes.length}</strong> espace
            {groupes.length > 1 ? 's' : ''}
            {recherche.trim() !== '' ? ` · filtre actif sur « ${recherche} »` : ''}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={toutOuvrir} className="text-brand hover:underline">
              Tout ouvrir
            </button>
            <button type="button" onClick={toutFermer} className="text-brand hover:underline">
              Tout fermer
            </button>
          </div>
        </div>
      </div>

      {/* Liste des groupes par espace */}
      <div className="grid gap-3">
        {groupes.length === 0 ? (
          <p className="rounded-md border border-border bg-surface-2 p-4 text-center text-sm text-text-3">
            Aucun contenu ne correspond à « {recherche} ».
          </p>
        ) : (
          groupes.map(({ espace, items }) => {
            const ouvert = ouvertsEffectifs[espace] === true;
            return (
              <section
                key={espace}
                className="overflow-hidden rounded-md border border-border bg-surface"
              >
                <button
                  type="button"
                  onClick={() => basculer(espace)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-surface-2"
                  aria-expanded={ouvert}
                >
                  <span className="flex items-center gap-2">
                    {ouvert ? (
                      <ChevronDown size={16} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={16} aria-hidden="true" />
                    )}
                    <code className="font-mono font-bold text-text-1">{espace}.*</code>
                    <Badge variant="default">{items.length}</Badge>
                  </span>
                </button>
                {ouvert ? (
                  <ul className="divide-y divide-border border-t border-border">
                    {items.map((c) => (
                      <li key={c.cle} className="px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <code className="break-all font-mono text-xs text-text-2">{c.cle}</code>
                            <p className="mt-1 text-sm text-text-1">{apercu(c.valeurMd)}</p>
                            <p className="mt-0.5 text-xs text-text-3">
                              {c.valeurMd.length} caractères · modifié le{' '}
                              {FORMATEUR_DATE.format(new Date(c.updatedAt))}
                              {c.titrePage !== undefined ? ` · ${c.titrePage}` : ''}
                            </p>
                          </div>
                          {c.cheminPublic !== undefined ? (
                            <Link
                              href={c.cheminPublic}
                              className="inline-flex shrink-0 items-center gap-1 text-brand text-sm hover:underline"
                            >
                              <ExternalLink size={12} aria-hidden="true" />
                              Éditer en place
                            </Link>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
