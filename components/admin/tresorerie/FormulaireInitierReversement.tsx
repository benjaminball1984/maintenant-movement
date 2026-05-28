'use client';

import { initierTransactionSortanteAction } from '@/app/actions/transaction-sortante';
import { Alert, Button, Input, Label, Textarea } from '@/components/ui';
import { ChampDocument } from '@/components/ui/ChampDocument';
import { useState } from 'react';

/**
 * Formulaire client pour initier un reversement depuis une caisse
 * (cycle V2 V2.3.33). Réservé aux admins (vérifié côté Server Action).
 *
 * UX : champs obligatoires en haut (bénéficiaire, montant, motif),
 * `ChampDocument` pour le justificatif obligatoire (D12bis), bouton
 * « Initier le reversement » désactivé tant que le document n'est pas
 * téléversé.
 *
 * Pas de submit HTML standard : `onClick` appelle la Server Action
 * avec un objet typé (pas FormData) pour rester aligné avec le pattern
 * `app/actions/`.
 */

/** Libelles surchargeables admin via CMS (V2.4.153). */
export interface LibellesInitierReversement {
  alertSansReceptacleTitre: string;
  alertSansReceptacleCorps: string;
  rappelD12bis: string;
  alertSuccesTitre: string;
  alertSuccesCorps: string;
  labelReceptacle: string;
  legendeBeneficiaire: string;
  optionExterne: string;
  optionInterne: string;
  placeholderNomExterne: string;
  placeholderIban: string;
  placeholderWallet: string;
  placeholderUuidInterne: string;
  labelMontantEur: string;
  labelMontantCoin: string;
  labelMotif: string;
  ctaSubmit: string;
  ctaEnCours: string;
  hintIncomplet: string;
}

const LIBELLES_DEFAUT: LibellesInitierReversement = {
  alertSansReceptacleTitre: 'Aucun réceptacle actif',
  alertSansReceptacleCorps:
    'Cette caisse n’a aucun réceptacle ouvert. Pose d’abord un réceptacle (canal euro ou 99-coin) pour pouvoir initier un reversement.',
  rappelD12bis:
    'Rappel D12bis : tout reversement exige un justificatif obligatoire (PDF ou image). Une transaction reste au statut « initiée » jusqu’à confirmation comptable séparée.',
  alertSuccesTitre: 'Reversement initié',
  alertSuccesCorps:
    'La transaction est enregistrée au statut « initiée ». Tu peux en initier un autre.',
  labelReceptacle: 'Réceptacle source',
  legendeBeneficiaire: 'Bénéficiaire',
  optionExterne: 'Externe',
  optionInterne: 'Membre interne',
  placeholderNomExterne: 'Nom du bénéficiaire (organisation, famille…)',
  placeholderIban: 'IBAN (optionnel)',
  placeholderWallet: 'Adresse wallet (optionnel)',
  placeholderUuidInterne: 'UUID du compte interne',
  labelMontantEur: 'Montant (EUR)',
  labelMontantCoin: 'Montant (99-coin)',
  labelMotif: 'Motif (5 à 1000 caractères)',
  ctaSubmit: 'Initier le reversement',
  ctaEnCours: 'Envoi…',
  hintIncomplet: 'Remplis tous les champs et téléverse un justificatif pour activer.',
};

interface ReceptacleChoix {
  id: string;
  canal: 'euro' | '99_coin';
  identifiantReceptacle: string;
}

interface Props {
  caisseId: string;
  receptaclesActifs: ReceptacleChoix[];
  libelles?: LibellesInitierReversement;
}

export function FormulaireInitierReversement({
  caisseId,
  receptaclesActifs,
  libelles = LIBELLES_DEFAUT,
}: Props) {
  const [receptacleId, setReceptacleId] = useState(receptaclesActifs[0]?.id ?? '');
  const [typeBeneficiaire, setTypeBeneficiaire] = useState<'interne' | 'externe'>('externe');
  const [beneficiairePersonneId, setBeneficiairePersonneId] = useState('');
  const [beneficiaireNom, setBeneficiaireNom] = useState('');
  const [beneficiaireIban, setBeneficiaireIban] = useState('');
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [justificatif, setJustificatif] = useState<{
    chemin: string;
    nomOriginal: string;
    mimeType: string;
    taille: number;
  } | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const receptacleSelectionne = receptaclesActifs.find((r) => r.id === receptacleId);
  const canal = receptacleSelectionne?.canal ?? 'euro';

  const peutSoumettre =
    justificatif !== null &&
    motif.trim().length >= 5 &&
    Number(montant) > 0 &&
    receptacleId !== '' &&
    (typeBeneficiaire === 'interne'
      ? beneficiairePersonneId.length > 0
      : beneficiaireNom.trim().length > 0);

  const surSoumettre = async () => {
    if (!peutSoumettre || justificatif === null) return;
    setEnCours(true);
    setErreur(null);

    const r = await initierTransactionSortanteAction({
      caisse_id: caisseId,
      receptacle_id: receptacleId,
      beneficiaire_personne_id: typeBeneficiaire === 'interne' ? beneficiairePersonneId : null,
      beneficiaire_externe_nom: typeBeneficiaire === 'externe' ? beneficiaireNom.trim() : null,
      beneficiaire_externe_iban_ou_wallet:
        typeBeneficiaire === 'externe' && beneficiaireIban.trim() !== ''
          ? beneficiaireIban.trim()
          : null,
      montant: Number(montant),
      canal,
      motif: motif.trim(),
      justificatif_chemin: justificatif.chemin,
      justificatif_nom_original: justificatif.nomOriginal,
      justificatif_mime_type: justificatif.mimeType,
    });

    setEnCours(false);
    if (!r.ok) {
      setErreur(r.message);
      return;
    }
    setSucces(true);
    // Reset pour permettre un autre reversement.
    setMontant('');
    setMotif('');
    setBeneficiaireNom('');
    setBeneficiaireIban('');
    setBeneficiairePersonneId('');
    setJustificatif(null);
  };

  if (receptaclesActifs.length === 0) {
    return (
      <Alert variant="warning" titre={libelles.alertSansReceptacleTitre}>
        {libelles.alertSansReceptacleCorps}
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <p className="text-sm text-text-2">{libelles.rappelD12bis}</p>

      {succes ? (
        <Alert variant="success" titre={libelles.alertSuccesTitre}>
          {libelles.alertSuccesCorps}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="receptacle">{libelles.labelReceptacle}</Label>
        <select
          id="receptacle"
          value={receptacleId}
          onChange={(e) => setReceptacleId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface p-2"
        >
          {receptaclesActifs.map((r) => (
            <option key={r.id} value={r.id}>
              [{r.canal === 'euro' ? '€' : '99c'}] {r.identifiantReceptacle.slice(0, 60)}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-2 font-medium text-sm text-text-1">
          {libelles.legendeBeneficiaire}
        </legend>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={typeBeneficiaire === 'externe'}
              onChange={() => setTypeBeneficiaire('externe')}
            />
            {libelles.optionExterne}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={typeBeneficiaire === 'interne'}
              onChange={() => setTypeBeneficiaire('interne')}
            />
            {libelles.optionInterne}
          </label>
        </div>
        {typeBeneficiaire === 'externe' ? (
          <div className="mt-2 flex flex-col gap-2">
            <Input
              placeholder={libelles.placeholderNomExterne}
              value={beneficiaireNom}
              onChange={(e) => setBeneficiaireNom(e.target.value)}
            />
            <Input
              placeholder={canal === 'euro' ? libelles.placeholderIban : libelles.placeholderWallet}
              value={beneficiaireIban}
              onChange={(e) => setBeneficiaireIban(e.target.value)}
            />
          </div>
        ) : (
          <Input
            className="mt-2"
            placeholder={libelles.placeholderUuidInterne}
            value={beneficiairePersonneId}
            onChange={(e) => setBeneficiairePersonneId(e.target.value)}
          />
        )}
      </fieldset>

      <div>
        <Label htmlFor="montant">
          {canal === 'euro' ? libelles.labelMontantEur : libelles.labelMontantCoin}{' '}
          <span className="text-danger">*</span>
        </Label>
        <Input
          id="montant"
          type="number"
          step="0.01"
          min="0"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="motif">
          {libelles.labelMotif} <span className="text-danger">*</span>
        </Label>
        <Textarea
          id="motif"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          rows={3}
          maxLength={1000}
        />
        <p className="mt-1 text-text-3 text-xs">{motif.trim().length} / 1000</p>
      </div>

      <ChampDocument
        name="justificatif"
        prefixeChemin={`transactions/${caisseId}`}
        onChange={(v) => setJustificatif(v)}
      />

      <div className="flex items-center gap-2">
        <Button onClick={surSoumettre} disabled={!peutSoumettre || enCours}>
          {enCours ? libelles.ctaEnCours : libelles.ctaSubmit}
        </Button>
        {!peutSoumettre && <p className="text-text-3 text-xs">{libelles.hintIncomplet}</p>}
      </div>

      {erreur !== null && (
        <p role="alert" className="text-danger text-sm">
          {erreur}
        </p>
      )}
    </div>
  );
}
