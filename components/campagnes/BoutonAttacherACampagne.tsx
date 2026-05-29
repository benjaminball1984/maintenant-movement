'use client';

import { attacherModule } from '@/app/(public)/mobiliser/campagnes/actions';
import { Alert, Button, IconButton } from '@/components/ui';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

/**
 * `<BoutonAttacherACampagne>` — UI admin pour intégrer un objet (pétition,
 * mobilisation, cagnotte, sondage) à une campagne existante. V2.5.11.b
 * (finalisation Master Plan V2.6 Phase G).
 *
 * Visible uniquement aux admins de plateforme : la page parente ne rend
 * pas le composant si `estAdmin === false`. La RLS de `module_campagne`
 * empêche de toute façon les écritures non-admin côté serveur.
 *
 * Comportement :
 *  1. Au clic, ouvre une `<dialog>` natif avec la liste des campagnes
 *     publiées dans un select.
 *  2. Au submit, appelle la Server Action `attacherModule` avec les
 *     bonnes données. Affiche une erreur en cas d'échec (ex. déjà
 *     attaché → message clair).
 *  3. Au succès, rafraîchit la page (la campagne montre désormais ce
 *     module) et ferme la modale.
 *
 * Pas de création à la volée pour cette première version : si la
 * campagne désirée n'existe pas, un lien « + Créer une nouvelle
 * campagne » renvoie vers `/mobiliser/campagnes/nouvelle`. Création
 * à la volée reportée à V2.5.11.c.
 */

export type TypeModuleAttachable = 'petition' | 'mobilisation' | 'cagnotte' | 'sondage';

interface CampagneOption {
  id: string;
  titre: string;
}

interface BoutonAttacherACampagneProps {
  typeModule: TypeModuleAttachable;
  cibleId: string;
  campagnes: CampagneOption[];
  /** Libellé sur le bouton déclencheur. Éditable CMS côté parent si besoin. */
  libelleBouton?: string;
}

export function BoutonAttacherACampagne({
  typeModule,
  cibleId,
  campagnes,
  libelleBouton = '+ Intégrer à une campagne',
}: BoutonAttacherACampagneProps) {
  const refDialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [campagneId, setCampagneId] = useState<string>(campagnes[0]?.id ?? '');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  function ouvrir() {
    setErreur(null);
    setSucces(false);
    setCampagneId(campagnes[0]?.id ?? '');
    refDialog.current?.showModal();
  }

  function fermer() {
    refDialog.current?.close();
  }

  async function attacher(e: React.FormEvent) {
    e.preventDefault();
    if (campagneId === '') {
      setErreur('Choisis une campagne dans la liste.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    const resultat = await attacherModule({
      campagne_id: campagneId,
      type_module: typeModule,
      cible_id: cibleId,
      ordre: 1,
    });
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(true);
    router.refresh();
    setTimeout(fermer, 1200);
  }

  if (campagnes.length === 0) {
    return (
      <p className="text-sm text-text-3">
        Aucune campagne publiée pour l'instant.{' '}
        <a href="/mobiliser/campagnes/nouvelle" className="text-brand hover:underline">
          + Créer une nouvelle campagne
        </a>
      </p>
    );
  }

  return (
    <>
      <Button onClick={ouvrir} variant="outline" taille="sm">
        {libelleBouton}
      </Button>

      <dialog
        ref={refDialog}
        className="m-auto w-full max-w-md rounded-lg border border-border bg-surface p-0 shadow-lg backdrop:bg-black/40"
        aria-label="Intégrer à une campagne"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-cap text-text-3">Admin</p>
            <p className="mt-1 font-bold text-text-1">Intégrer à une campagne</p>
          </div>
          <IconButton aria-label="Fermer" onClick={fermer} taille="sm">
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </header>

        <form onSubmit={attacher} className="grid gap-3 p-6">
          {erreur !== null ? (
            <Alert variant="danger" titre="Attachement impossible">
              {erreur}
            </Alert>
          ) : null}
          {succes ? (
            <Alert variant="success" titre="Module attaché">
              Le module est désormais visible sur la campagne.
            </Alert>
          ) : null}

          <label className="grid gap-1">
            <span className="text-sm font-bold text-text-1">Campagne</span>
            <select
              value={campagneId}
              onChange={(e) => setCampagneId(e.target.value)}
              className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-text-1"
              required
            >
              {campagnes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titre}
                </option>
              ))}
            </select>
          </label>

          <p className="text-xs text-text-3">
            Pour créer une nouvelle campagne :{' '}
            <a href="/mobiliser/campagnes/nouvelle" className="text-brand hover:underline">
              + Créer une nouvelle campagne
            </a>
          </p>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button onClick={fermer} variant="ghost" type="button" disabled={enCours}>
              Annuler
            </Button>
            <Button type="submit" disabled={enCours || succes}>
              {enCours ? 'Attachement...' : 'Attacher à cette campagne'}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
