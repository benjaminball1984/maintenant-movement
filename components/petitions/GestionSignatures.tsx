'use client';

import { Alert, Button, Card, Heading, Input, Label } from '@/components/ui';
import type { SignatureAGerer } from '@/lib/petitions/gestion-signatures';
import { cn } from '@/lib/utils';
import {
  CATEGORIES_ORGANISATION,
  LIBELLES_CATEGORIE_ORGANISATION,
} from '@/lib/validations/petition';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Gestion des signatures d'une pétition ou d'un appel (V2.6.139).
 *
 * Demande de Lilou/Ben : « pouvoir supprimer ou éditer des signatures,
 * directement en cliquant dessus ». Le bloc reprend donc l'apparence des
 * pastilles publiques — mêmes noms, même mise en page — mais chaque pastille
 * est cliquable et ouvre, sur place, de quoi corriger ou retirer.
 *
 * Visible uniquement par l'administration et par la personne qui a lancé le
 * texte. Le composant ne décide de rien : c'est la page serveur qui ne le
 * rend qu'aux ayants droit, et chaque action revérifie le droit côté serveur.
 */

type Resultat = { ok: true } | { ok: false; message: string };

export interface GestionSignaturesProps {
  signatures: SignatureAGerer[];
  /** Vrai pour l'administration : emails en clair, suppression définitive. */
  estAdministration: boolean;
  modifierSignature: (donnees: unknown) => Promise<Resultat>;
  retirerSignature: (donnees: unknown) => Promise<Resultat>;
  restaurerSignature: (donnees: unknown) => Promise<Resultat>;
  supprimerSignatureDefinitivement: (donnees: unknown) => Promise<Resultat>;
}

/** Nom lisible d'une signature, quel que soit son type. */
function identiteAffichee(signature: SignatureAGerer): string {
  if (signature.type_signataire === 'organisation') {
    return signature.organisation_nom ?? 'Organisation sans nom';
  }
  if (signature.pseudonyme !== null && signature.pseudonyme.trim() !== '') {
    return signature.pseudonyme;
  }
  const complet = [signature.prenom, signature.nom]
    .filter((partie) => partie !== null && partie.trim() !== '')
    .join(' ');
  return complet === '' ? 'Signature sans nom' : complet;
}

/** Date courte, sans l'heure : la minute exacte n'aide pas à décider. */
function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function GestionSignatures({
  signatures,
  estAdministration,
  modifierSignature,
  retirerSignature,
  restaurerSignature,
  supprimerSignatureDefinitivement,
}: GestionSignaturesProps) {
  const router = useRouter();
  const [ouverte, setOuverte] = useState<string | null>(null);

  if (signatures.length === 0) {
    return null;
  }

  const organisations = signatures.filter((s) => s.type_signataire === 'organisation');
  const individus = signatures.filter((s) => s.type_signataire !== 'organisation');

  return (
    <section className="grid gap-4 rounded-lg border border-dashed border-border p-4">
      <header className="grid gap-1">
        <Heading niveau={2} apparenceComme={3}>
          Gérer les signatures
        </Heading>
        <p className="text-sm text-text-3">
          Visible par toi seul·e. Clique sur une signature pour corriger son nom ou la retirer. Une
          signature retirée ne compte plus et n’apparaît plus, mais elle reste réparable.
          {estAdministration
            ? ' En tant qu’équipe, tu vois les adresses email et tu peux supprimer définitivement.'
            : ' Les adresses email sont masquées : lancer un texte ne donne pas accès au carnet d’adresses des signataires.'}
        </p>
      </header>

      {organisations.length > 0 ? (
        <GroupeSignatures
          titre={`Organisations (${organisations.length})`}
          signatures={organisations}
          ouverte={ouverte}
          setOuverte={setOuverte}
          estAdministration={estAdministration}
          modifierSignature={modifierSignature}
          retirerSignature={retirerSignature}
          restaurerSignature={restaurerSignature}
          supprimerSignatureDefinitivement={supprimerSignatureDefinitivement}
          rafraichir={() => router.refresh()}
        />
      ) : null}

      {individus.length > 0 ? (
        <GroupeSignatures
          titre={`Personnes (${individus.length})`}
          signatures={individus}
          ouverte={ouverte}
          setOuverte={setOuverte}
          estAdministration={estAdministration}
          modifierSignature={modifierSignature}
          retirerSignature={retirerSignature}
          restaurerSignature={restaurerSignature}
          supprimerSignatureDefinitivement={supprimerSignatureDefinitivement}
          rafraichir={() => router.refresh()}
        />
      ) : null}
    </section>
  );
}

interface GroupeProps extends Omit<GestionSignaturesProps, 'signatures'> {
  titre: string;
  signatures: SignatureAGerer[];
  ouverte: string | null;
  setOuverte: (id: string | null) => void;
  rafraichir: () => void;
}

function GroupeSignatures({
  titre,
  signatures,
  ouverte,
  setOuverte,
  ...actions
}: GroupeProps & { rafraichir: () => void }) {
  return (
    <div className="grid gap-2">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">{titre}</p>
      <ul className="flex flex-wrap gap-2">
        {signatures.map((signature) => (
          <li key={signature.id} className={ouverte === signature.id ? 'w-full' : undefined}>
            {ouverte === signature.id ? (
              <PanneauSignature
                signature={signature}
                fermer={() => setOuverte(null)}
                {...actions}
              />
            ) : (
              <button
                type="button"
                onClick={() => setOuverte(signature.id)}
                className={cn(
                  'rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm shadow-sm transition',
                  'hover:border-brand hover:shadow-brand focus-visible:border-brand',
                  signature.retiree_le !== null && 'opacity-50 line-through',
                )}
                aria-label={`Gérer la signature de ${identiteAffichee(signature)}`}
              >
                <span className="font-bold text-text-1">{identiteAffichee(signature)}</span>
                <span className="ml-2 text-text-3">{dateCourte(signature.signee_le)}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PanneauProps extends Omit<GestionSignaturesProps, 'signatures'> {
  signature: SignatureAGerer;
  fermer: () => void;
  rafraichir: () => void;
}

/**
 * Panneau ouvert au clic sur une signature : correction des champs, retrait,
 * restauration, et pour l'administration seulement, suppression définitive.
 */
function PanneauSignature({
  signature,
  fermer,
  rafraichir,
  estAdministration,
  modifierSignature,
  retirerSignature,
  restaurerSignature,
  supprimerSignatureDefinitivement,
}: PanneauProps) {
  const estOrganisation = signature.type_signataire === 'organisation';
  const signeSousPseudonyme =
    !estOrganisation && signature.pseudonyme !== null && signature.pseudonyme.trim() !== '';

  const [prenom, setPrenom] = useState(signature.prenom ?? '');
  const [nom, setNom] = useState(signature.nom ?? '');
  const [pseudonyme, setPseudonyme] = useState(signature.pseudonyme ?? '');
  const [organisationNom, setOrganisationNom] = useState(signature.organisation_nom ?? '');
  const [organisationCategorie, setOrganisationCategorie] = useState(
    signature.organisation_categorie ?? '',
  );
  const [organisationTerritoire, setOrganisationTerritoire] = useState(
    signature.organisation_territoire ?? '',
  );
  const [affichagePublic, setAffichagePublic] = useState(signature.organisation_affichage_public);

  const [raison, setRaison] = useState('');
  const [demandeRetrait, setDemandeRetrait] = useState(false);
  const [demandeSuppression, setDemandeSuppression] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /** Exécute une action serveur, affiche l'erreur ou rafraîchit la page. */
  async function executer(action: () => Promise<Resultat>): Promise<void> {
    setErreur(null);
    setEnCours(true);
    const resultat = await action();
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    fermer();
    rafraichir();
  }

  return (
    <Card variant="ombre" className="grid w-full gap-3 border-brand/40">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-bold text-text-1">{identiteAffichee(signature)}</p>
        <p className="text-xs text-text-3">
          Signé le {dateCourte(signature.signee_le)} · {signature.email_affiche} ·{' '}
          {signature.code_postal}
        </p>
      </header>

      {erreur !== null ? (
        <Alert variant="danger" titre="Action impossible">
          {erreur}
        </Alert>
      ) : null}

      {signature.retiree_le !== null ? (
        <Alert variant="warning" titre="Signature retirée">
          Retirée le {dateCourte(signature.retiree_le)}
          {signature.raison_retrait !== null ? ` : ${signature.raison_retrait}` : '.'} Elle ne
          compte plus et n’apparaît nulle part.
        </Alert>
      ) : null}

      {/* --- Correction de l'identité ------------------------------------ */}
      {estOrganisation ? (
        <div className="grid gap-3">
          <div>
            <Label htmlFor={`org-nom-${signature.id}`} obligatoire>
              Nom de l’organisation
            </Label>
            <Input
              id={`org-nom-${signature.id}`}
              value={organisationNom}
              onChange={(e) => setOrganisationNom(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`org-cat-${signature.id}`} obligatoire>
                Type
              </Label>
              <select
                id={`org-cat-${signature.id}`}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-1"
                value={organisationCategorie}
                onChange={(e) => setOrganisationCategorie(e.target.value)}
              >
                <option value="">Choisir…</option>
                {CATEGORIES_ORGANISATION.map((categorie) => (
                  <option key={categorie} value={categorie}>
                    {LIBELLES_CATEGORIE_ORGANISATION[categorie]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={`org-terr-${signature.id}`}>Territoire (optionnel)</Label>
              <Input
                id={`org-terr-${signature.id}`}
                value={organisationTerritoire}
                onChange={(e) => setOrganisationTerritoire(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`org-prenom-${signature.id}`} obligatoire>
                Prénom de la personne référente
              </Label>
              <Input
                id={`org-prenom-${signature.id}`}
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`org-personne-nom-${signature.id}`} obligatoire>
                Nom de la personne référente
              </Label>
              <Input
                id={`org-personne-nom-${signature.id}`}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
          </div>
          <label
            htmlFor={`org-public-${signature.id}`}
            className="flex cursor-pointer items-start gap-2 text-sm text-text-2"
          >
            <input
              id={`org-public-${signature.id}`}
              type="checkbox"
              className="mt-1 h-4 w-4 rounded-xs accent-brand"
              checked={affichagePublic}
              onChange={(e) => setAffichagePublic(e.target.checked)}
            />
            <span>Le nom de l’organisation figure dans la liste publique des signataires.</span>
          </label>
        </div>
      ) : signeSousPseudonyme ? (
        <div>
          <Label htmlFor={`pseudo-${signature.id}`} obligatoire>
            Pseudonyme
          </Label>
          <Input
            id={`pseudo-${signature.id}`}
            value={pseudonyme}
            onChange={(e) => setPseudonyme(e.target.value)}
          />
          <p className="mt-1 text-xs text-text-3">
            Cette personne a choisi de ne pas donner son identité civile.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`prenom-${signature.id}`} obligatoire>
              Prénom
            </Label>
            <Input
              id={`prenom-${signature.id}`}
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`nom-${signature.id}`} obligatoire>
              Nom
            </Label>
            <Input
              id={`nom-${signature.id}`}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* --- Retrait : motif obligatoire --------------------------------- */}
      {demandeRetrait ? (
        <div className="grid gap-2 rounded-md border border-border bg-surface-2 p-3">
          <Label htmlFor={`raison-${signature.id}`} obligatoire>
            Pourquoi retirer cette signature ?
          </Label>
          <Input
            id={`raison-${signature.id}`}
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            placeholder="Doublon, insulte, demande de la personne…"
          />
          <p className="text-xs text-text-3">
            Le motif n’est jamais affiché publiquement. Il sert à expliquer le geste plus tard.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={enCours || raison.trim().length < 3}
              onClick={() =>
                executer(() => retirerSignature({ signature_id: signature.id, raison }))
              }
            >
              Confirmer le retrait
            </Button>
            <Button variant="ghost" onClick={() => setDemandeRetrait(false)} disabled={enCours}>
              Annuler
            </Button>
          </div>
        </div>
      ) : null}

      {/* --- Suppression définitive : administration seulement ------------ */}
      {demandeSuppression ? (
        <Alert variant="danger" titre="Suppression définitive, sans retour">
          <p className="mb-2">
            La ligne sera effacée de la base. À réserver à une demande d’effacement de la part de la
            personne. Dans tous les autres cas, le retrait suffit et se répare.
          </p>
          <span className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={enCours}
              onClick={() =>
                executer(() => supprimerSignatureDefinitivement({ signature_id: signature.id }))
              }
            >
              Supprimer définitivement
            </Button>
            <Button variant="ghost" onClick={() => setDemandeSuppression(false)} disabled={enCours}>
              Annuler
            </Button>
          </span>
        </Alert>
      ) : null}

      {/* --- Barre d'actions --------------------------------------------- */}
      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        <Button
          disabled={enCours}
          onClick={() =>
            executer(() =>
              modifierSignature({
                signature_id: signature.id,
                prenom,
                nom,
                pseudonyme: signeSousPseudonyme ? pseudonyme : undefined,
                organisation_nom: estOrganisation ? organisationNom : undefined,
                organisation_categorie: estOrganisation ? organisationCategorie : undefined,
                organisation_territoire: estOrganisation ? organisationTerritoire : undefined,
                organisation_affichage_public: estOrganisation ? affichagePublic : undefined,
              }),
            )
          }
        >
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </Button>

        {signature.retiree_le === null ? (
          <Button
            variant="ghost"
            disabled={enCours}
            onClick={() => setDemandeRetrait((actif) => !actif)}
          >
            Retirer
          </Button>
        ) : (
          <Button
            variant="ghost"
            disabled={enCours}
            onClick={() => executer(() => restaurerSignature({ signature_id: signature.id }))}
          >
            Restaurer
          </Button>
        )}

        {estAdministration ? (
          <Button
            variant="ghost"
            disabled={enCours}
            onClick={() => setDemandeSuppression((actif) => !actif)}
          >
            Supprimer définitivement
          </Button>
        ) : null}

        <Button variant="ghost" onClick={fermer} disabled={enCours}>
          Fermer
        </Button>
      </div>
    </Card>
  );
}
