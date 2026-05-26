import { validerCoherenceCaisse, validerInitiationTransaction } from '@/lib/caisse-validation';
import { describe, expect, it } from 'vitest';

const BASE_INITIATION = {
  caisseId: 'aaaa',
  receptacleId: 'bbbb',
  beneficiairePersonneId: 'cccc',
  montant: 100,
  canal: 'euro' as const,
  motif: 'Reversement à la famille Dupont',
  justificatifStoragePath: 'caisses/abc/justif.pdf',
  justificatifMimeType: 'application/pdf',
};

describe('validerInitiationTransaction — D12bis justificatif obligatoire', () => {
  it('accepte une initiation complète', () => {
    expect(validerInitiationTransaction(BASE_INITIATION)).toEqual({ ok: true });
  });

  it('refuse si justificatif vide (D12bis)', () => {
    const r = validerInitiationTransaction({ ...BASE_INITIATION, justificatifStoragePath: '' });
    expect(r).toEqual({ ok: false, raison: 'justificatif_manquant' });
  });

  it('refuse si justificatif uniquement composé d’espaces', () => {
    const r = validerInitiationTransaction({
      ...BASE_INITIATION,
      justificatifStoragePath: '   ',
    });
    expect(r).toEqual({ ok: false, raison: 'justificatif_manquant' });
  });

  it('refuse un MIME non autorisé', () => {
    const r = validerInitiationTransaction({
      ...BASE_INITIATION,
      justificatifMimeType: 'application/octet-stream',
    });
    expect(r).toEqual({ ok: false, raison: 'justificatif_mime_non_autorise' });
  });

  it('refuse un montant nul ou négatif', () => {
    expect(validerInitiationTransaction({ ...BASE_INITIATION, montant: 0 })).toEqual({
      ok: false,
      raison: 'montant_non_positif',
    });
    expect(validerInitiationTransaction({ ...BASE_INITIATION, montant: -10 })).toEqual({
      ok: false,
      raison: 'montant_non_positif',
    });
  });

  it('refuse un motif trop court', () => {
    expect(validerInitiationTransaction({ ...BASE_INITIATION, motif: 'a' })).toEqual({
      ok: false,
      raison: 'motif_trop_court',
    });
  });

  it('refuse si aucun bénéficiaire (ni interne ni externe)', () => {
    const r = validerInitiationTransaction({
      ...BASE_INITIATION,
      beneficiairePersonneId: null,
      beneficiaireExterneNom: null,
    });
    expect(r).toEqual({ ok: false, raison: 'beneficiaire_absent' });
  });

  it('accepte avec bénéficiaire externe seulement', () => {
    const r = validerInitiationTransaction({
      ...BASE_INITIATION,
      beneficiairePersonneId: null,
      beneficiaireExterneNom: 'Famille Dupont',
    });
    expect(r).toEqual({ ok: true });
  });
});

describe('validerCoherenceCaisse', () => {
  it('caisse cagnotte exige objet_type cagnotte + objet_id', () => {
    expect(
      validerCoherenceCaisse({
        typeCaisse: 'cagnotte',
        objetType: 'cagnotte',
        objetId: '1234',
      }),
    ).toEqual({ ok: true });
  });

  it('caisse cagnotte sans objet_id refusée', () => {
    expect(
      validerCoherenceCaisse({ typeCaisse: 'cagnotte', objetType: 'cagnotte', objetId: null }),
    ).toEqual({ ok: false, raison: 'cagnotte_sans_objet' });
  });

  it('caisse cagnotte avec mauvais objet_type refusée', () => {
    expect(
      validerCoherenceCaisse({
        typeCaisse: 'cagnotte',
        objetType: 'campagne',
        objetId: '1234',
      }),
    ).toEqual({ ok: false, raison: 'cagnotte_sans_objet' });
  });

  it('caisse adhesion sans objet → OK', () => {
    expect(validerCoherenceCaisse({ typeCaisse: 'adhesion' })).toEqual({ ok: true });
  });

  it('caisse don_general avec objet partiel refusée', () => {
    expect(
      validerCoherenceCaisse({ typeCaisse: 'don_general', objetType: 'campagne', objetId: null }),
    ).toEqual({ ok: false, raison: 'objet_partiel' });
  });
});
