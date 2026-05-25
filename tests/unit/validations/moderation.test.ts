import {
  reafficherOrganisationSchema,
  retirerMomentSchema,
  retirerServiceSelSchema,
  retirerSondageSchema,
} from '@/lib/validations/moderation';
import { describe, expect, it } from 'vitest';

/**
 * Tests des schémas Zod de la modération active (chantier 13.2).
 *
 * Les actions de retrait partagent une même règle de raison (10 à 500
 * caractères) ; le réaffichage n'attend que l'identifiant de la cible.
 */

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const RAISON_OK = 'Contenu hors charte, signalé par plusieurs personnes.';

describe('schémas de retrait (raison obligatoire)', () => {
  const cas = [
    { nom: 'retirerMomentSchema', schema: retirerMomentSchema, champId: 'moment_id' },
    { nom: 'retirerSondageSchema', schema: retirerSondageSchema, champId: 'sondage_id' },
    { nom: 'retirerServiceSelSchema', schema: retirerServiceSelSchema, champId: 'service_id' },
  ] as const;

  for (const { nom, schema, champId } of cas) {
    describe(nom, () => {
      it('accepte un identifiant valide et une raison suffisante', () => {
        const r = schema.safeParse({ [champId]: UUID, raison: RAISON_OK });
        expect(r.success).toBe(true);
      });

      it('refuse une raison trop courte (< 10 caractères)', () => {
        const r = schema.safeParse({ [champId]: UUID, raison: 'trop' });
        expect(r.success).toBe(false);
      });

      it('refuse une raison trop longue (> 500 caractères)', () => {
        const r = schema.safeParse({ [champId]: UUID, raison: 'a'.repeat(501) });
        expect(r.success).toBe(false);
      });

      it('refuse un identifiant qui n’est pas un UUID', () => {
        const r = schema.safeParse({ [champId]: 'pas-un-uuid', raison: RAISON_OK });
        expect(r.success).toBe(false);
      });
    });
  }
});

describe('reafficherOrganisationSchema', () => {
  it('accepte un identifiant d’organisation valide', () => {
    const r = reafficherOrganisationSchema.safeParse({ organisation_id: UUID });
    expect(r.success).toBe(true);
  });

  it('refuse un identifiant manquant', () => {
    const r = reafficherOrganisationSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it('refuse un identifiant non UUID', () => {
    const r = reafficherOrganisationSchema.safeParse({ organisation_id: '123' });
    expect(r.success).toBe(false);
  });
});
