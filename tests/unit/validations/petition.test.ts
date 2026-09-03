import { inscriptionSchema } from '@/lib/validations/auth';
import {
  CATEGORIES_ORGANISATION,
  LIBELLES_CATEGORIE_ORGANISATION,
  editerPetitionSchema,
  signerPetitionSchema,
} from '@/lib/validations/petition';
import { describe, expect, it } from 'vitest';

/**
 * Tests du schéma de signature de pétition (chantier 2.1).
 *
 * Garantit que la modale de signature et la Server Action partagent
 * exactement la même validation : minimum nom/prenom/email/code_postal +
 * cases booléennes + token Turnstile.
 */
describe('signerPetitionSchema', () => {
  // UUID v4 conforme RFC (Zod 4 valide strictement la version + le variant).
  const valide = {
    petition_id: '11111111-1111-4111-8111-111111111111',
    nom: 'Ball',
    prenom: 'Camille',
    email: 'camille@exemple.fr',
    code_postal: '75011',
    telephone: '',
    accepte_newsletter: false,
    accepte_contact_createurice: false,
    token_turnstile: 'mock-valid-token',
  } as const;

  it('accepte une signature minimale', () => {
    expect(signerPetitionSchema.safeParse(valide).success).toBe(true);
  });

  it('refuse un petition_id non UUID', () => {
    const r = signerPetitionSchema.safeParse({ ...valide, petition_id: 'pas-un-uuid' });
    expect(r.success).toBe(false);
  });

  it('refuse un email invalide', () => {
    const r = signerPetitionSchema.safeParse({ ...valide, email: 'pas-un-email' });
    expect(r.success).toBe(false);
  });

  it('refuse un code postal à 4 chiffres', () => {
    const r = signerPetitionSchema.safeParse({ ...valide, code_postal: '7501' });
    expect(r.success).toBe(false);
  });

  it('accepte un téléphone français valide', () => {
    expect(signerPetitionSchema.safeParse({ ...valide, telephone: '0612345678' }).success).toBe(
      true,
    );
  });

  it('accepte les cases cochées', () => {
    expect(
      signerPetitionSchema.safeParse({
        ...valide,
        accepte_newsletter: true,
        accepte_contact_createurice: true,
      }).success,
    ).toBe(true);
  });

  it('refuse un token Turnstile vide', () => {
    expect(signerPetitionSchema.safeParse({ ...valide, token_turnstile: '' }).success).toBe(false);
  });
});

/**
 * Tests du schéma d'édition d'une pétition par l'équipe (chantier 13.2).
 *
 * Couvre surtout la règle croisée sur les dates (échéance >= lancement), qui
 * reflète la contrainte SQL `petition_dates_coherentes`, et la tolérance des
 * dates optionnelles (chaîne vide ou absente).
 */
describe('editerPetitionSchema', () => {
  const valide = {
    petition_id: '11111111-1111-4111-8111-111111111111',
    titre: 'Pour une cantine bio dans toutes les écoles',
    texte: 'a'.repeat(120),
    destinataire: 'Le conseil municipal',
    image_url: '',
    objectif: 5000,
    date_lancement: '',
    date_echeance: '',
  } as const;

  it('accepte une édition sans dates', () => {
    expect(editerPetitionSchema.safeParse(valide).success).toBe(true);
  });

  it('accepte une échéance postérieure au lancement', () => {
    const r = editerPetitionSchema.safeParse({
      ...valide,
      date_lancement: '2026-01-01',
      date_echeance: '2026-06-01',
    });
    expect(r.success).toBe(true);
  });

  it('refuse une échéance antérieure au lancement', () => {
    const r = editerPetitionSchema.safeParse({
      ...valide,
      date_lancement: '2026-06-01',
      date_echeance: '2026-01-01',
    });
    expect(r.success).toBe(false);
  });

  it('accepte une seule des deux dates', () => {
    expect(editerPetitionSchema.safeParse({ ...valide, date_echeance: '2026-06-01' }).success).toBe(
      true,
    );
  });

  it('refuse un objectif sous le minimum', () => {
    expect(editerPetitionSchema.safeParse({ ...valide, objectif: 10 }).success).toBe(false);
  });

  it('refuse un texte trop court', () => {
    expect(editerPetitionSchema.safeParse({ ...valide, texte: 'trop court' }).success).toBe(false);
  });
});

/**
 * Tests de la signature au nom d'une organisation (V2.6.134).
 *
 * L'appel « Faisons Front par la Rue ! » est ouvert à la signature des
 * assemblées, collectifs, syndicats et organisations. Ces tests fixent le
 * contrat côté schéma : une organisation doit se nommer et se ranger dans
 * l'une des quatre familles, sans quoi la signature est refusée ; et une
 * signature qui n'annonce rien reste une signature individuelle, exactement
 * comme avant.
 */
describe('signerPetitionSchema — signature au nom d’une organisation', () => {
  const base = {
    petition_id: '11111111-1111-4111-8111-111111111111',
    nom: 'Ball',
    prenom: 'Camille',
    email: 'camille@exemple.fr',
    code_postal: '75011',
    accepte_newsletter: false,
    accepte_contact_createurice: false,
    token_turnstile: 'mock-valid-token',
  } as const;

  it('reste une signature individuelle quand rien n’est précisé', () => {
    const r = signerPetitionSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.type_signataire).toBeUndefined();
    }
  });

  it('accepte une organisation nommée et catégorisée', () => {
    const r = signerPetitionSchema.safeParse({
      ...base,
      type_signataire: 'organisation',
      organisation_nom: 'Assemblée populaire de Saint-Denis',
      organisation_categorie: 'assemblee',
      organisation_territoire: 'Saint-Denis (93)',
      signataire_fonction: 'co-secrétaire',
      organisation_affichage_public: true,
    });
    expect(r.success).toBe(true);
  });

  it('refuse une organisation sans nom', () => {
    const r = signerPetitionSchema.safeParse({
      ...base,
      type_signataire: 'organisation',
      organisation_nom: '',
      organisation_categorie: 'syndicat',
    });
    expect(r.success).toBe(false);
  });

  it('refuse une organisation sans catégorie choisie', () => {
    const r = signerPetitionSchema.safeParse({
      ...base,
      type_signataire: 'organisation',
      organisation_nom: 'Collectif des quartiers',
      organisation_categorie: '',
    });
    expect(r.success).toBe(false);
  });

  it('refuse une catégorie hors des quatre familles de l’appel', () => {
    const r = signerPetitionSchema.safeParse({
      ...base,
      type_signataire: 'organisation',
      organisation_nom: 'Un parti',
      organisation_categorie: 'parti',
    });
    expect(r.success).toBe(false);
  });

  it('n’exige rien de plus quand on signe en son nom', () => {
    const r = signerPetitionSchema.safeParse({
      ...base,
      type_signataire: 'individu',
    });
    expect(r.success).toBe(true);
  });

  it('couvre les quatre familles nommées par l’appel', () => {
    expect([...CATEGORIES_ORGANISATION]).toEqual([
      'assemblee',
      'collectif',
      'syndicat',
      'organisation',
    ]);
    for (const categorie of CATEGORIES_ORGANISATION) {
      expect(LIBELLES_CATEGORIE_ORGANISATION[categorie]).toBeTruthy();
    }
  });
});

/**
 * Tests de la signature sous pseudonyme (V2.6.138).
 *
 * Demande de Lilou/Ben : on ne peut pas exiger un nom civil pour signer un
 * texte politique. Ces tests fixent la regle des deux cotes : le pseudonyme
 * remplace prenom et nom pour un individu, et il est refuse pour une
 * organisation, qui doit rester joignable nommement.
 */
describe('signerPetitionSchema — signature sous pseudonyme', () => {
  const base = {
    petition_id: '11111111-1111-4111-8111-111111111111',
    email: 'camille@exemple.fr',
    code_postal: '75011',
    accepte_newsletter: false,
    accepte_contact_createurice: false,
    token_turnstile: 'mock-valid-token',
  } as const;

  it('accepte un pseudonyme seul, sans prenom ni nom', () => {
    const r = signerPetitionSchema.safeParse({ ...base, pseudonyme: 'Rosa des villes' });
    expect(r.success).toBe(true);
  });

  it('accepte prenom et nom seuls, sans pseudonyme (comportement historique)', () => {
    const r = signerPetitionSchema.safeParse({ ...base, prenom: 'Camille', nom: 'Ball' });
    expect(r.success).toBe(true);
  });

  it('refuse une signature sans aucune identite', () => {
    expect(signerPetitionSchema.safeParse(base).success).toBe(false);
  });

  it('refuse un prenom seul sans nom ni pseudonyme', () => {
    const r = signerPetitionSchema.safeParse({ ...base, prenom: 'Camille' });
    expect(r.success).toBe(false);
  });

  it('refuse le pseudonyme pour une signature au nom d’une organisation', () => {
    const r = signerPetitionSchema.safeParse({
      ...base,
      type_signataire: 'organisation',
      organisation_nom: 'Syndicat des quartiers',
      organisation_categorie: 'syndicat',
      pseudonyme: 'Rosa des villes',
    });
    expect(r.success).toBe(false);
  });

  it('exige prenom ET nom pour une signature au nom d’une organisation', () => {
    const r = signerPetitionSchema.safeParse({
      ...base,
      type_signataire: 'organisation',
      organisation_nom: 'Syndicat des quartiers',
      organisation_categorie: 'syndicat',
      prenom: 'Camille',
    });
    expect(r.success).toBe(false);
  });
});

/**
 * Garde-fou demande par Lilou/Ben le 02/09/2026 : le pseudonyme s'arrete a la
 * signature. **L'adhesion continue d'exiger prenom et nom**, et n'offre aucune
 * possibilite de pseudonyme.
 *
 * L'adhesion passe par un compte (les trois chemins exigent une session), donc
 * la porte d'entree reelle est le schema d'inscription : c'est lui qu'on
 * verrouille ici. Si quelqu'un ajoutait un jour un champ `pseudonyme` a
 * l'inscription, ce test tomberait.
 */
describe('l’adhésion n’accepte pas de pseudonyme', () => {
  const inscriptionValide = {
    nom: 'Ball',
    prenom: 'Camille',
    pronom: 'iel',
    email: 'camille@exemple.fr',
    code_postal: '75011',
    date_naissance: '1990-01-01',
    mot_de_passe: 'MotDePasseSolide1',
    cgu_acceptees: true,
    token_turnstile: 'mock-valid-token',
  } as const;

  it('accepte une inscription avec prénom et nom', () => {
    expect(inscriptionSchema.safeParse(inscriptionValide).success).toBe(true);
  });

  it('refuse une inscription sans nom', () => {
    const { nom: _nom, ...sansNom } = inscriptionValide;
    expect(inscriptionSchema.safeParse(sansNom).success).toBe(false);
  });

  it('refuse une inscription sans prénom', () => {
    const { prenom: _prenom, ...sansPrenom } = inscriptionValide;
    expect(inscriptionSchema.safeParse(sansPrenom).success).toBe(false);
  });

  it('refuse un champ pseudonyme à l’inscription', () => {
    const r = inscriptionSchema.safeParse({ ...inscriptionValide, pseudonyme: 'Rosa des villes' });
    expect(r.success).toBe(false);
  });
});
