/**
 * Validation pure des entrées des helpers `lib/caisse.ts` (cycle V2 V2.2.3).
 *
 * Extrait pour être testable sans Supabase. La règle métier la plus
 * importante est **D12bis** : aucune transaction sortante n'est validée
 * sans justificatif. La fonction `validerInitiationTransaction` met cette
 * règle en TypeScript pour un retour d'erreur structuré.
 */

import type { CanalCaisse, MimeJustificatif, TypeCaisse, TypeObjetCaisse } from './caisse';

const MIMES_AUTORISES: readonly MimeJustificatif[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export interface EntreeInitiationTransaction {
  caisseId: string;
  receptacleId: string;
  beneficiairePersonneId?: string | null;
  beneficiaireExterneNom?: string | null;
  montant: number;
  canal: CanalCaisse;
  motif: string;
  justificatifStoragePath: string;
  justificatifMimeType: string;
}

export type RaisonInvalideTransaction =
  | 'justificatif_manquant'
  | 'justificatif_mime_non_autorise'
  | 'montant_non_positif'
  | 'motif_trop_court'
  | 'beneficiaire_absent';

export type ResultatValidation = { ok: true } | { ok: false; raison: RaisonInvalideTransaction };

export function validerInitiationTransaction(
  entree: EntreeInitiationTransaction,
): ResultatValidation {
  // D12bis : justificatif obligatoire.
  if (entree.justificatifStoragePath.trim().length === 0) {
    return { ok: false, raison: 'justificatif_manquant' };
  }
  if (!MIMES_AUTORISES.includes(entree.justificatifMimeType as MimeJustificatif)) {
    return { ok: false, raison: 'justificatif_mime_non_autorise' };
  }
  if (entree.montant <= 0) {
    return { ok: false, raison: 'montant_non_positif' };
  }
  if (entree.motif.trim().length < 5) {
    return { ok: false, raison: 'motif_trop_court' };
  }
  const aBeneficiaireInterne =
    entree.beneficiairePersonneId !== null &&
    entree.beneficiairePersonneId !== undefined &&
    entree.beneficiairePersonneId !== '';
  const aBeneficiaireExterne =
    entree.beneficiaireExterneNom !== null &&
    entree.beneficiaireExterneNom !== undefined &&
    entree.beneficiaireExterneNom.trim().length > 0;
  if (!aBeneficiaireInterne && !aBeneficiaireExterne) {
    return { ok: false, raison: 'beneficiaire_absent' };
  }
  return { ok: true };
}

/**
 * Valide la cohérence d'une caisse de cagnotte (objet_type/id requis pour
 * type_caisse=cagnotte). Renvoie une erreur lisible si incohérent.
 */
export function validerCoherenceCaisse(options: {
  typeCaisse: TypeCaisse;
  objetType?: TypeObjetCaisse | null;
  objetId?: string | null;
}): { ok: true } | { ok: false; raison: 'cagnotte_sans_objet' | 'objet_partiel' } {
  if (options.typeCaisse === 'cagnotte') {
    if (
      options.objetType !== 'cagnotte' ||
      options.objetId === null ||
      options.objetId === undefined ||
      options.objetId === ''
    ) {
      return { ok: false, raison: 'cagnotte_sans_objet' };
    }
    return { ok: true };
  }
  // Pour les autres types, soit les deux sont remplis, soit aucun.
  const aType = options.objetType !== null && options.objetType !== undefined;
  const aId = options.objetId !== null && options.objetId !== undefined && options.objetId !== '';
  if (aType !== aId) {
    return { ok: false, raison: 'objet_partiel' };
  }
  return { ok: true };
}
