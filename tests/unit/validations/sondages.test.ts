import {
  creerSondageSchema,
  voterSondageSansCompteSchema,
  voterSondageSchema,
} from '@/lib/validations/sondages';
import { describe, expect, it } from 'vitest';

describe('creerSondageSchema', () => {
  const base = {
    titre: 'Sondage sur le quartier',
    question: 'Quelle priorité pour le quartier ?',
    options: ['Espaces verts', 'Sécurité', 'Transports', 'Logement'],
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un sondage minimal', () => {
    expect(creerSondageSchema.safeParse(base).success).toBe(true);
  });

  it('refuse moins de 2 options', () => {
    expect(creerSondageSchema.safeParse({ ...base, options: ['Une seule'] }).success).toBe(false);
  });

  it('accepte 20 options (revue 2026-06-12)', () => {
    expect(
      creerSondageSchema.safeParse({
        ...base,
        options: Array.from({ length: 20 }, (_, i) => `O${i}`),
      }).success,
    ).toBe(true);
  });

  it('refuse plus de 20 options', () => {
    expect(
      creerSondageSchema.safeParse({
        ...base,
        options: Array.from({ length: 21 }, (_, i) => `O${i}`),
      }).success,
    ).toBe(false);
  });

  it("refuse l'ancien champ mode (retiré : affichage automatique)", () => {
    expect(creerSondageSchema.safeParse({ ...base, mode: 'classique' }).success).toBe(false);
  });

  it('accepte des images d’options alignées (null = option sans image)', () => {
    expect(
      creerSondageSchema.safeParse({
        ...base,
        options_images: ['https://exemple.org/a.jpg', null, null, 'https://exemple.org/d.jpg'],
      }).success,
    ).toBe(true);
  });

  it('refuse des images d’options de longueur différente des options', () => {
    expect(
      creerSondageSchema.safeParse({
        ...base,
        options_images: ['https://exemple.org/a.jpg', null],
      }).success,
    ).toBe(false);
  });
});

describe('voterSondageSchema', () => {
  const base = {
    sondage_id: '11111111-1111-4111-8111-111111111111',
    option_index: 2,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un vote simple', () => {
    expect(voterSondageSchema.safeParse(base).success).toBe(true);
  });

  it('accepte option_index en CHAÎNE « 2 » (radios HTML) et la convertit en nombre', () => {
    const parse = voterSondageSchema.safeParse({ ...base, option_index: '2' });
    expect(parse.success).toBe(true);
    if (parse.success) expect(parse.data.option_index).toBe(2);
  });

  it('refuse un vote sans option choisie (option_index absent)', () => {
    const { option_index: _ignore, ...sansOption } = base;
    expect(voterSondageSchema.safeParse(sansOption).success).toBe(false);
  });

  it('refuse option_index négatif', () => {
    expect(voterSondageSchema.safeParse({ ...base, option_index: -1 }).success).toBe(false);
  });

  it('accepte option_index 19 (20 options possibles)', () => {
    expect(voterSondageSchema.safeParse({ ...base, option_index: 19 }).success).toBe(true);
  });

  it('refuse option_index 20 (hors plage)', () => {
    expect(voterSondageSchema.safeParse({ ...base, option_index: 20 }).success).toBe(false);
  });

  it('accepte une tranche d’âge', () => {
    expect(voterSondageSchema.safeParse({ ...base, tranche_age: '25_34' as const }).success).toBe(
      true,
    );
  });

  it('accepte une tranche d’âge VIDE (sélecteur non renseigné, bug du 2026-06-12)', () => {
    expect(voterSondageSchema.safeParse({ ...base, tranche_age: '' }).success).toBe(true);
  });

  it('refuse un code postal mal formé', () => {
    expect(voterSondageSchema.safeParse({ ...base, code_postal: '7507' }).success).toBe(false);
  });
});

describe('voterSondageSansCompteSchema (V2.6.141)', () => {
  const valide = {
    sondage_id: '3f6f6a1e-9c3a-4f0e-8a1f-2b7c9d0e5a41',
    option_index: '2',
    prenom: 'Camille',
    nom: 'Durand',
    email: 'camille.durand@example.org',
    code_postal: '95100',
    telephone: '',
    date_naissance: '1984-03-12',
    genre_declare: '',
    accepte_newsletter: true,
    token_turnstile: 'mock-valid-token',
  };

  it('accepte un vote sans téléphone : il est facultatif pour voter', () => {
    expect(voterSondageSansCompteSchema.safeParse(valide).success).toBe(true);
  });

  it('accepte un téléphone renseigné, et le valide quand même', () => {
    expect(
      voterSondageSansCompteSchema.safeParse({ ...valide, telephone: '0612345678' }).success,
    ).toBe(true);
    expect(voterSondageSansCompteSchema.safeParse({ ...valide, telephone: '12' }).success).toBe(
      false,
    );
  });

  it('refuse un vote sans option choisie', () => {
    const { option_index: _ignore, ...sansOption } = valide;
    expect(voterSondageSansCompteSchema.safeParse(sansOption).success).toBe(false);
  });

  it('refuse une personne de moins de 15 ans', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 14);
    expect(
      voterSondageSansCompteSchema.safeParse({
        ...valide,
        date_naissance: d.toISOString().slice(0, 10),
      }).success,
    ).toBe(false);
  });
});
