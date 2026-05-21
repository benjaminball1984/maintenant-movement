import {
  calculerFraisEuros,
  calculerFraisT99CP,
  formaterEuros,
  formaterT99CP,
} from '@/lib/marche/config';
import {
  acheterProduitSchema,
  creerBoutiqueSchema,
  creerMinimarcheSchema,
  creerProduitMarcheSchema,
  marquerVenduSchema,
  noterVendeureuseSchema,
} from '@/lib/validations/marche';
import { describe, expect, it } from 'vitest';

const UUID = '11111111-1111-4111-8111-111111111111';
const AUTRE_UUID = '22222222-2222-4222-8222-222222222222';

describe('creerProduitMarcheSchema', () => {
  const baseVente = {
    titre: 'Vélo enfant 6-8 ans',
    description: 'Vélo enfant en très bon état, peu utilisé. Couleur bleue, taille 20 pouces.',
    mode: 'vente' as const,
    prix_euros_centimes: 4500,
    prix_t99cp_unites: '0',
    lieu: 'Saint-Denis',
    remise_main_propre: true,
    envoi_postal: false,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte une vente en euros', () => {
    expect(creerProduitMarcheSchema.safeParse(baseVente).success).toBe(true);
  });

  it('accepte une vente en T99CP uniquement', () => {
    expect(
      creerProduitMarcheSchema.safeParse({
        ...baseVente,
        prix_euros_centimes: 0,
        prix_t99cp_unites: '4500000000000000000000',
      }).success,
    ).toBe(true);
  });

  it('refuse une vente sans aucun prix', () => {
    expect(
      creerProduitMarcheSchema.safeParse({
        ...baseVente,
        prix_euros_centimes: 0,
        prix_t99cp_unites: '0',
      }).success,
    ).toBe(false);
  });

  it('accepte un don avec prix à 0', () => {
    expect(
      creerProduitMarcheSchema.safeParse({
        ...baseVente,
        mode: 'don',
        prix_euros_centimes: 0,
        prix_t99cp_unites: '0',
      }).success,
    ).toBe(true);
  });

  it('refuse un don avec prix EUR > 0', () => {
    expect(
      creerProduitMarcheSchema.safeParse({
        ...baseVente,
        mode: 'don',
        prix_euros_centimes: 100,
      }).success,
    ).toBe(false);
  });

  it('refuse aucun mode de retrait sélectionné', () => {
    expect(
      creerProduitMarcheSchema.safeParse({
        ...baseVente,
        remise_main_propre: false,
        envoi_postal: false,
      }).success,
    ).toBe(false);
  });

  it('refuse latitude sans longitude', () => {
    expect(
      creerProduitMarcheSchema.safeParse({ ...baseVente, latitude: 48.85, longitude: null })
        .success,
    ).toBe(false);
  });
});

describe('noterVendeureuseSchema', () => {
  const base = {
    produit_id: UUID,
    etoiles: 5,
    commentaire: 'Très bonne transaction, contact agréable.',
    token_turnstile: 'mock-valid-token',
  };

  it('accepte 5 étoiles', () => {
    expect(noterVendeureuseSchema.safeParse(base).success).toBe(true);
  });

  it('refuse 0 étoile', () => {
    expect(noterVendeureuseSchema.safeParse({ ...base, etoiles: 0 }).success).toBe(false);
  });

  it('refuse 6 étoiles', () => {
    expect(noterVendeureuseSchema.safeParse({ ...base, etoiles: 6 }).success).toBe(false);
  });

  it('accepte un commentaire vide', () => {
    expect(noterVendeureuseSchema.safeParse({ ...base, commentaire: '' }).success).toBe(true);
  });
});

describe('marquerVenduSchema', () => {
  it('refuse si acheteureuse_id manquant', () => {
    expect(marquerVenduSchema.safeParse({ produit_id: UUID }).success).toBe(false);
  });

  it('accepte un couple cohérent', () => {
    expect(
      marquerVenduSchema.safeParse({ produit_id: UUID, acheteureuse_id: AUTRE_UUID }).success,
    ).toBe(true);
  });
});

describe('creerBoutiqueSchema', () => {
  const base = {
    nom: 'Vide-grenier Saint-Denis',
    description: 'Vide-grenier mensuel du collectif Saint-Denis. Brocante, vintage, livres.',
    sens: 'propose' as const,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte une boutique permanente', () => {
    expect(creerBoutiqueSchema.safeParse(base).success).toBe(true);
  });

  it('accepte une boutique éphémère avec les 2 dates', () => {
    expect(
      creerBoutiqueSchema.safeParse({
        ...base,
        ouverte_du: '2026-06-01T09:00:00.000Z',
        ouverte_au: '2026-06-01T18:00:00.000Z',
      }).success,
    ).toBe(true);
  });

  it('refuse une seule des deux dates', () => {
    expect(
      creerBoutiqueSchema.safeParse({
        ...base,
        ouverte_du: '2026-06-01T09:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('refuse une fin avant le début', () => {
    expect(
      creerBoutiqueSchema.safeParse({
        ...base,
        ouverte_du: '2026-06-01T18:00:00.000Z',
        ouverte_au: '2026-06-01T09:00:00.000Z',
      }).success,
    ).toBe(false);
  });
});

describe('creerMinimarcheSchema', () => {
  const base = {
    titre: 'Minimarché solidaire Belleville',
    description: 'Marché solidaire mensuel à Belleville, 4 monnaies acceptées.',
    lieu: 'Place du marché, 75020 Paris',
    commence_le: '2026-06-01T09:00:00.000Z',
    termine_le: '2026-06-01T17:00:00.000Z',
    monnaies_acceptees: ['T99CP' as const, 'EUR' as const],
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un minimarché complet (T99CP, EUR)', () => {
    expect(creerMinimarcheSchema.safeParse(base).success).toBe(true);
  });

  it('accepte les 4 monnaies', () => {
    expect(
      creerMinimarcheSchema.safeParse({
        ...base,
        monnaies_acceptees: ['T99CP', 'EUR', 'G1', 'MNLC'],
      }).success,
    ).toBe(true);
  });

  it('refuse une liste vide de monnaies', () => {
    expect(creerMinimarcheSchema.safeParse({ ...base, monnaies_acceptees: [] }).success).toBe(
      false,
    );
  });

  it('refuse une monnaie hors catalogue', () => {
    expect(
      creerMinimarcheSchema.safeParse({
        ...base,
        monnaies_acceptees: ['BTC' as unknown as 'EUR'],
      }).success,
    ).toBe(false);
  });

  it('refuse une fin avant le début', () => {
    expect(
      creerMinimarcheSchema.safeParse({
        ...base,
        commence_le: '2026-06-01T17:00:00.000Z',
        termine_le: '2026-06-01T09:00:00.000Z',
      }).success,
    ).toBe(false);
  });
});

describe('acheterProduitSchema', () => {
  const base = {
    produit_id: UUID,
    monnaie: 'EUR' as const,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte EUR sans tx_hash', () => {
    expect(acheterProduitSchema.safeParse(base).success).toBe(true);
  });

  it('refuse T99CP sans tx_hash', () => {
    expect(acheterProduitSchema.safeParse({ ...base, monnaie: 'T99CP' as const }).success).toBe(
      false,
    );
  });

  it('accepte T99CP avec tx_hash', () => {
    expect(
      acheterProduitSchema.safeParse({
        ...base,
        monnaie: 'T99CP' as const,
        tx_hash: `0x${'a'.repeat(64)}`,
      }).success,
    ).toBe(true);
  });
});

describe('helpers monnaie (lib/marche/config)', () => {
  it('calculerFraisEuros = 5 %', () => {
    expect(calculerFraisEuros(10_000)).toBe(500);
    expect(calculerFraisEuros(0)).toBe(0);
  });

  it('calculerFraisT99CP = 0n', () => {
    expect(calculerFraisT99CP(10n ** 18n)).toBe(0n);
  });

  it('formaterEuros affiche un nombre format français', () => {
    expect(formaterEuros(1250)).toContain('12,50');
    expect(formaterEuros(0)).toBe('');
    expect(formaterEuros(null)).toBe('');
  });

  it('formaterT99CP traite la sentinelle 0', () => {
    expect(formaterT99CP('0')).toBe('');
    expect(formaterT99CP(null)).toBe('');
    expect(formaterT99CP('1000000000000000000')).toBe('1 99-coin');
  });
});
