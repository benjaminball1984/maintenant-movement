import {
  type LigneSignatureSource,
  projeterSignatureEnConsentements,
} from '@/lib/consentement-projection';
import { describe, expect, it } from 'vitest';

/**
 * Tests de la projection pure utilisée par `scripts/backfill-consentement.ts`
 * (cycle V2 V2.1.2). On vérifie les 4 combinaisons des deux booléens
 * `accepte_newsletter` × `accepte_contact_createurice`, plus les cas limites
 * (profil_unifie_id null, date / petition_id propagés correctement).
 */

const SIGNATURE_BASE: LigneSignatureSource = {
  petition_id: '11111111-1111-1111-1111-111111111111',
  profil_unifie_id: '22222222-2222-2222-2222-222222222222',
  accepte_newsletter: false,
  accepte_contact_createurice: false,
  created_at: '2026-05-26T12:34:56Z',
};

describe('projeterSignatureEnConsentements', () => {
  it('ne projette rien quand aucune case n’est cochée', () => {
    expect(projeterSignatureEnConsentements({ ...SIGNATURE_BASE })).toEqual([]);
  });

  it('projette un consentement newsletter_plateforme quand accepte_newsletter=true', () => {
    const resultat = projeterSignatureEnConsentements({
      ...SIGNATURE_BASE,
      accepte_newsletter: true,
    });
    expect(resultat).toHaveLength(1);
    expect(resultat[0]).toMatchObject({
      type_consentement: 'newsletter_plateforme',
      valeur: true,
      source: 'backfill_signature_v1',
      profil_unifie_id: SIGNATURE_BASE.profil_unifie_id,
      objet_type: null,
      objet_id: null,
      date_consentement: SIGNATURE_BASE.created_at,
    });
  });

  it('projette un consentement contact_createur quand accepte_contact_createurice=true', () => {
    const resultat = projeterSignatureEnConsentements({
      ...SIGNATURE_BASE,
      accepte_contact_createurice: true,
    });
    expect(resultat).toHaveLength(1);
    expect(resultat[0]).toMatchObject({
      type_consentement: 'contact_createur',
      valeur: true,
      source: 'backfill_signature_v1',
      objet_type: 'petition',
      objet_id: SIGNATURE_BASE.petition_id,
      date_consentement: SIGNATURE_BASE.created_at,
    });
  });

  it('projette les deux consentements quand les deux cases sont cochées', () => {
    const resultat = projeterSignatureEnConsentements({
      ...SIGNATURE_BASE,
      accepte_newsletter: true,
      accepte_contact_createurice: true,
    });
    expect(resultat).toHaveLength(2);
    expect(resultat.map((c) => c.type_consentement)).toEqual([
      'newsletter_plateforme',
      'contact_createur',
    ]);
  });

  it('ignore une signature sans profil_unifie_id', () => {
    const resultat = projeterSignatureEnConsentements({
      ...SIGNATURE_BASE,
      profil_unifie_id: null,
      accepte_newsletter: true,
      accepte_contact_createurice: true,
    });
    expect(resultat).toEqual([]);
  });

  it('utilise toujours la source backfill_signature_v1 et valeur=true', () => {
    const resultat = projeterSignatureEnConsentements({
      ...SIGNATURE_BASE,
      accepte_newsletter: true,
      accepte_contact_createurice: true,
    });
    for (const ligne of resultat) {
      expect(ligne.source).toBe('backfill_signature_v1');
      expect(ligne.valeur).toBe(true);
    }
  });

  it('rattache contact_createur à l’UUID exact de la pétition signée', () => {
    const petitionId = '99999999-9999-9999-9999-999999999999';
    const resultat = projeterSignatureEnConsentements({
      ...SIGNATURE_BASE,
      petition_id: petitionId,
      accepte_contact_createurice: true,
    });
    expect(resultat[0]?.objet_id).toBe(petitionId);
  });
});
