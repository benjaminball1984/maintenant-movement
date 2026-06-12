'use client';

import { Button, Card } from '@/components/ui';
import type { QuestionQualification } from '@/lib/sondages/qualification';
import { useState } from 'react';

/** Libellés surchargeables admin via CMS (pattern V2.4.151). */
export interface LibellesQualification {
  chapo: string;
  ctaStop: string;
  ctaValider: string;
  merciFin: string;
  merciStop: string;
  enregistrementEnCours: string;
}

const LIBELLES_DEFAUT: LibellesQualification = {
  chapo:
    'Pour fiabiliser les sondages, tu peux compléter ton profil. Ces réponses restent privées : elles ne servent qu’au redressement statistique (méthode des quotas), jamais à autre chose.',
  ctaStop: 'C’est tout pour aujourd’hui',
  ctaValider: 'Valider',
  merciFin: 'Ton profil est complet : merci, chaque réponse fiabilise les sondages.',
  merciStop: 'Merci ! Tu pourras continuer à compléter ton profil au prochain vote.',
  enregistrementEnCours: 'Enregistrement…',
};

interface QualificationProgressiveProps {
  /** Première question à proposer (tirée côté serveur), ou null si épuisé. */
  questionInitiale: QuestionQualification | null;
  repondre: (
    donnees: unknown,
  ) => Promise<
    { ok: true; question_suivante: QuestionQualification | null } | { ok: false; message: string }
  >;
  libelles?: LibellesQualification;
}

/**
 * Qualification progressive du profil après un vote (sondages V2 §6,
 * précisée par Ben le 2026-06-12) : une question s'affiche immédiatement
 * sous le merci, chaque réponse enchaîne automatiquement sur la suivante
 * (aucun « voulez-vous une autre question ? » : ce serait une friction),
 * et un bouton « C'est tout pour aujourd'hui » permet de s'arrêter.
 */
export function QualificationProgressive({
  questionInitiale,
  repondre,
  libelles = LIBELLES_DEFAUT,
}: QualificationProgressiveProps) {
  const [question, setQuestion] = useState<QuestionQualification | null>(questionInitiale);
  const [arret, setArret] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [choixMultiples, setChoixMultiples] = useState<string[]>([]);
  const [reponsePrincipale, setReponsePrincipale] = useState<string | null>(null);
  const [reponseSecondaire, setReponseSecondaire] = useState('');
  const [aRepondu, setARepondu] = useState(false);

  if (questionInitiale === null && !aRepondu) {
    // Panel déjà épuisé : rien à proposer, on ne montre rien.
    return null;
  }

  async function envoyer(reponse: string | string[], secondaire?: string) {
    if (question === null) return;
    setEnCours(true);
    setErreur(null);
    const resultat = await repondre({
      question_cle: question.cle,
      reponse,
      ...(secondaire !== undefined && secondaire !== '' ? { reponse_secondaire: secondaire } : {}),
    });
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setARepondu(true);
    setQuestion(resultat.question_suivante);
    setChoixMultiples([]);
    setReponsePrincipale(null);
    setReponseSecondaire('');
  }

  if (arret) {
    return <p className="text-sm text-text-2">{libelles.merciStop}</p>;
  }
  if (question === null) {
    return <p className="text-sm text-text-2">{libelles.merciFin}</p>;
  }

  const secondaireRequise =
    question.secondaire !== undefined && reponsePrincipale === question.secondaire.requisSi;

  return (
    <Card variant="eleve" className="grid gap-4" aria-live="polite">
      <p className="text-sm text-text-3">{libelles.chapo}</p>
      <p className="font-bold text-text-1">{question.intitule}</p>

      {erreur !== null ? <p className="text-sm text-danger">{erreur}</p> : null}

      {question.type === 'choix_unique' ? (
        <div className="flex flex-wrap gap-2">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={enCours}
              onClick={() => envoyer(option)}
              className="rounded-pill border border-border bg-surface px-4 py-2 text-sm text-text-1 transition-colors hover:border-brand hover:bg-surface-2 disabled:opacity-50"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}

      {question.type === 'choix_multiple' ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {question.options.map((option) => {
              const coche = choixMultiples.includes(option);
              return (
                <label
                  key={option}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-sm transition-colors ${
                    coche
                      ? 'border-brand bg-surface-2 text-text-1'
                      : 'border-border bg-surface text-text-1'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand"
                    checked={coche}
                    onChange={() =>
                      setChoixMultiples((courant) =>
                        coche ? courant.filter((c) => c !== option) : [...courant, option],
                      )
                    }
                  />
                  {option}
                </label>
              );
            })}
          </div>
          <Button
            type="button"
            disabled={enCours || choixMultiples.length === 0}
            onClick={() => envoyer(choixMultiples)}
          >
            {enCours ? libelles.enregistrementEnCours : libelles.ctaValider}
          </Button>
        </div>
      ) : null}

      {question.type === 'double' && question.secondaire !== undefined ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {question.options.map((option) => (
              <label
                key={option}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-sm transition-colors ${
                  reponsePrincipale === option
                    ? 'border-brand bg-surface-2 text-text-1'
                    : 'border-border bg-surface text-text-1'
                }`}
              >
                <input
                  type="radio"
                  name={`qualification-${question.cle}`}
                  className="h-4 w-4 accent-brand"
                  checked={reponsePrincipale === option}
                  onChange={() => setReponsePrincipale(option)}
                />
                {option}
              </label>
            ))}
          </div>
          {secondaireRequise ? (
            <div>
              <p className="mb-1 text-sm font-medium text-text-2">{question.secondaire.intitule}</p>
              <select
                value={reponseSecondaire}
                onChange={(e) => setReponseSecondaire(e.target.value)}
                className="w-full rounded-sm border border-border bg-surface p-2 text-sm"
              >
                <option value="">—</option>
                {question.secondaire.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <Button
            type="button"
            disabled={
              enCours ||
              reponsePrincipale === null ||
              (secondaireRequise && reponseSecondaire === '')
            }
            onClick={() => {
              if (reponsePrincipale !== null) {
                void envoyer(reponsePrincipale, secondaireRequise ? reponseSecondaire : undefined);
              }
            }}
          >
            {enCours ? libelles.enregistrementEnCours : libelles.ctaValider}
          </Button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setArret(true)}
        className="justify-self-start text-sm text-text-3 underline underline-offset-4 hover:text-text-1"
      >
        {libelles.ctaStop}
      </button>
    </Card>
  );
}
