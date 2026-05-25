import {
  creerCommentaireSchema,
  creerPostSchema,
  envoyerMessageSchema,
  retraitReseauSchema,
} from '@/lib/validations/reseau';
import { describe, expect, it } from 'vitest';

/**
 * Tests des schémas de validation du réseau social (chantier 7.5).
 * Alignés sur les contraintes SQL de la migration 039.
 */

const UUID = '00000000-0000-4000-8000-000000000001';

describe('creerPostSchema', () => {
  it('accepte un post valide (avec et sans image)', () => {
    expect(creerPostSchema.safeParse({ texte: 'Bonjour', token_turnstile: 't' }).success).toBe(
      true,
    );
    expect(
      creerPostSchema.safeParse({
        texte: 'Avec image',
        image_url: 'https://exemple.org/i.png',
        token_turnstile: 't',
      }).success,
    ).toBe(true);
    // image_url vide explicitement autorisée.
    expect(
      creerPostSchema.safeParse({ texte: 'x', image_url: '', token_turnstile: 't' }).success,
    ).toBe(true);
  });

  it('refuse un texte vide ou trop long', () => {
    expect(creerPostSchema.safeParse({ texte: '   ', token_turnstile: 't' }).success).toBe(false);
    expect(
      creerPostSchema.safeParse({ texte: 'a'.repeat(5001), token_turnstile: 't' }).success,
    ).toBe(false);
  });

  it('refuse une URL d’image invalide', () => {
    expect(
      creerPostSchema.safeParse({ texte: 'x', image_url: 'pas-une-url', token_turnstile: 't' })
        .success,
    ).toBe(false);
  });

  it('refuse l’absence de token anti-bot', () => {
    expect(creerPostSchema.safeParse({ texte: 'x', token_turnstile: '' }).success).toBe(false);
  });
});

describe('creerCommentaireSchema', () => {
  it('accepte un commentaire valide', () => {
    expect(creerCommentaireSchema.safeParse({ post_id: UUID, texte: 'Bien dit' }).success).toBe(
      true,
    );
  });

  it('refuse un post_id non-uuid et un texte vide', () => {
    expect(creerCommentaireSchema.safeParse({ post_id: 'x', texte: 'a' }).success).toBe(false);
    expect(creerCommentaireSchema.safeParse({ post_id: UUID, texte: '' }).success).toBe(false);
  });
});

describe('envoyerMessageSchema', () => {
  it('accepte un message valide', () => {
    expect(envoyerMessageSchema.safeParse({ destinataire_id: UUID, texte: 'Salut' }).success).toBe(
      true,
    );
  });

  it('refuse un destinataire invalide et un texte vide', () => {
    expect(envoyerMessageSchema.safeParse({ destinataire_id: 'x', texte: 'a' }).success).toBe(
      false,
    );
    expect(envoyerMessageSchema.safeParse({ destinataire_id: UUID, texte: '  ' }).success).toBe(
      false,
    );
  });
});

describe('retraitReseauSchema', () => {
  it('accepte un retrait avec motif suffisant', () => {
    expect(
      retraitReseauSchema.safeParse({ cible_id: UUID, raison: 'Contenu haineux signalé' }).success,
    ).toBe(true);
  });

  it('refuse un motif trop court', () => {
    expect(retraitReseauSchema.safeParse({ cible_id: UUID, raison: 'court' }).success).toBe(false);
  });
});
