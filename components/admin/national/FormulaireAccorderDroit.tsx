'use client';

import {
  type CommuneRecherche,
  accorderDroit,
  chercherCommunes,
  chercherPersonnes,
} from '@/app/admin/national/droits/actions';
import { Alert, Button, Card, Heading, Input, Label } from '@/components/ui';
import type { BeneficiaireDroit } from '@/lib/admin/national/droits';
import {
  LIBELLES_ONGLET,
  NIVEAUX_DROIT,
  ONGLETS_MODERATION,
  type OngletModeration,
} from '@/lib/validations/droit-admin';
import type { NiveauDroitAdmin } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Formulaire d'attribution d'un droit d'administration (console nationale).
 *
 * Trois temps :
 *   1. choisir la personne bénéficiaire (recherche email/nom/prénom) ;
 *   2. choisir le niveau de droit ;
 *   3. selon le niveau, préciser le périmètre (onglets de modération) ou
 *      la commune (animation).
 *
 * La validation finale et la journalisation sont faites côté serveur par
 * `accorderDroit`. Ici on assure surtout le confort de saisie.
 */
export function FormulaireAccorderDroit() {
  const router = useRouter();

  const [beneficiaire, setBeneficiaire] = useState<BeneficiaireDroit | null>(null);
  const [niveau, setNiveau] = useState<NiveauDroitAdmin>('moderation');
  const [onglets, setOnglets] = useState<OngletModeration[]>([]);
  const [commune, setCommune] = useState<CommuneRecherche | null>(null);

  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  function reinitialiser() {
    setBeneficiaire(null);
    setNiveau('moderation');
    setOnglets([]);
    setCommune(null);
  }

  function basculerOnglet(onglet: OngletModeration) {
    setOnglets((actuels) =>
      actuels.includes(onglet) ? actuels.filter((o) => o !== onglet) : [...actuels, onglet],
    );
  }

  async function soumettre() {
    setErreur(null);
    setSucces(false);

    if (beneficiaire === null) {
      setErreur('Choisis d’abord une personne.');
      return;
    }
    if (niveau === 'animation' && commune === null) {
      setErreur('Choisis une commune pour un droit d’animation.');
      return;
    }

    setEnvoiEnCours(true);
    const resultat = await accorderDroit({
      personne_id: beneficiaire.id,
      niveau,
      perimetre_onglet: niveau === 'moderation' ? onglets : undefined,
      scope_commune_id: niveau === 'animation' ? (commune?.id ?? null) : undefined,
    });
    setEnvoiEnCours(false);

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setSucces(true);
    reinitialiser();
    router.refresh();
  }

  return (
    <Card variant="ombre" className="grid gap-5">
      <Heading niveau={2} apparenceComme={3}>
        Accorder un droit
      </Heading>

      {erreur !== null ? (
        <Alert variant="danger" titre="Attribution impossible">
          {erreur}
        </Alert>
      ) : null}
      {succes ? (
        <Alert variant="success" titre="Droit accordé">
          Le droit a été attribué et consigné dans le journal d’audit.
        </Alert>
      ) : null}

      {/* 1. Bénéficiaire */}
      <div className="grid gap-2">
        <p className="font-body text-sm font-medium text-text-2">Personne bénéficiaire</p>
        {beneficiaire === null ? (
          <RechercheBeneficiaire onChoix={setBeneficiaire} />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-4 py-2.5">
            <span className="text-sm text-text-1">
              {nomAffiche(beneficiaire)}{' '}
              {beneficiaire.email !== null ? (
                <span className="text-text-3">· {beneficiaire.email}</span>
              ) : null}
            </span>
            <Button variant="ghost" taille="sm" onClick={() => setBeneficiaire(null)}>
              Changer
            </Button>
          </div>
        )}
      </div>

      {/* 2. Niveau */}
      <div className="grid gap-2">
        <Label htmlFor="niveau-droit">Niveau de droit</Label>
        <select
          id="niveau-droit"
          value={niveau}
          onChange={(evenement) => {
            setNiveau(evenement.target.value as NiveauDroitAdmin);
            setOnglets([]);
            setCommune(null);
          }}
          className="block w-full rounded-md border border-border bg-surface px-4 py-2.5 font-body text-base text-text-1 hover:border-border-dark"
        >
          {NIVEAUX_DROIT.map((option) => (
            <option key={option.valeur} value={option.valeur}>
              {option.libelle}
            </option>
          ))}
        </select>
        <p className="text-xs text-text-3">
          {NIVEAUX_DROIT.find((n) => n.valeur === niveau)?.description}
        </p>
      </div>

      {/* 3a. Périmètre de modération */}
      {niveau === 'moderation' ? (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-bold text-text-2">Onglets de modération</legend>
          <p className="text-xs text-text-3">Aucun coché = accès à tous les onglets.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ONGLETS_MODERATION.map((onglet) => (
              <label key={onglet} className="flex items-center gap-2 text-sm text-text-1">
                <input
                  type="checkbox"
                  checked={onglets.includes(onglet)}
                  onChange={() => basculerOnglet(onglet)}
                  className="size-4 rounded border-border text-brand focus:ring-brand"
                />
                {LIBELLES_ONGLET[onglet]}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {/* 3b. Commune d'animation */}
      {niveau === 'animation' ? (
        <div className="grid gap-2">
          <p className="font-body text-sm font-medium text-text-2">Commune animée</p>
          {commune === null ? (
            <RechercheCommune onChoix={setCommune} />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-4 py-2.5">
              <span className="text-sm text-text-1">
                {commune.nom}
                {commune.departement !== null ? (
                  <span className="text-text-3"> · {commune.departement}</span>
                ) : null}
              </span>
              <Button variant="ghost" taille="sm" onClick={() => setCommune(null)}>
                Changer
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <div>
        <Button onClick={soumettre} disabled={envoiEnCours}>
          {envoiEnCours ? 'Attribution...' : 'Accorder le droit'}
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// Sous-composants de recherche (combobox asynchrones)
// ============================================================

/** Nom affichable d'un·e bénéficiaire (fallback sur l'email puis « Sans nom »). */
function nomAffiche(personne: BeneficiaireDroit): string {
  const complet = [personne.prenom, personne.nom].filter((s) => s && s.trim() !== '').join(' ');
  if (complet !== '') return complet;
  return personne.email ?? 'Sans nom';
}

/** Petit hook de recherche débouncée et générique. */
function useRechercheDebouncee<T>(
  rechercher: (saisie: string) => Promise<T[]>,
  delaiMs = 300,
): { saisie: string; setSaisie: (v: string) => void; resultats: T[]; enCours: boolean } {
  const [saisie, setSaisie] = useState('');
  const [resultats, setResultats] = useState<T[]>([]);
  const [enCours, setEnCours] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    if (saisie.trim().length < 2) {
      setResultats([]);
      return;
    }
    setEnCours(true);
    timer.current = setTimeout(async () => {
      const liste = await rechercher(saisie);
      setResultats(liste);
      setEnCours(false);
    }, delaiMs);

    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [saisie, delaiMs, rechercher]);

  return { saisie, setSaisie, resultats, enCours };
}

function RechercheBeneficiaire({ onChoix }: { onChoix: (p: BeneficiaireDroit) => void }) {
  const { saisie, setSaisie, resultats, enCours } = useRechercheDebouncee(chercherPersonnes);

  return (
    <div className="grid gap-1">
      <Input
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        placeholder="Email, nom ou prénom (2 caractères minimum)"
        aria-label="Rechercher une personne bénéficiaire"
        autoComplete="off"
      />
      {enCours ? <p className="text-xs text-text-3">Recherche...</p> : null}
      {resultats.length > 0 ? (
        <ul className="grid gap-1 rounded-md border border-border bg-surface p-1">
          {resultats.map((personne) => (
            <li key={personne.id}>
              <button
                type="button"
                onClick={() => onChoix(personne)}
                className="block w-full rounded-sm px-3 py-2 text-left text-sm text-text-1 hover:bg-surface-2"
              >
                {nomAffiche(personne)}
                {personne.email !== null ? (
                  <span className="text-text-3"> · {personne.email}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function RechercheCommune({ onChoix }: { onChoix: (c: CommuneRecherche) => void }) {
  const { saisie, setSaisie, resultats, enCours } = useRechercheDebouncee(chercherCommunes);

  return (
    <div className="grid gap-1">
      <Input
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        placeholder="Nom de commune ou code postal"
        aria-label="Rechercher une commune"
        autoComplete="off"
      />
      {enCours ? <p className="text-xs text-text-3">Recherche...</p> : null}
      {resultats.length > 0 ? (
        <ul className="grid gap-1 rounded-md border border-border bg-surface p-1">
          {resultats.map((commune) => (
            <li key={commune.id}>
              <button
                type="button"
                onClick={() => onChoix(commune)}
                className="block w-full rounded-sm px-3 py-2 text-left text-sm text-text-1 hover:bg-surface-2"
              >
                {commune.nom}
                {commune.code_postal_principal !== null ? (
                  <span className="text-text-3"> · {commune.code_postal_principal}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
