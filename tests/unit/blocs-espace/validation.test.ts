/**
 * Tests du décodeur de blocs personnalisables (V2.5.5).
 *
 * Garantit que :
 *  - les contenus bien formés sont acceptés et bien typés en sortie
 *  - les contenus mal formés ou types inconnus renvoient `null` (le
 *    rendu doit alors ignorer silencieusement le bloc)
 *  - les contraintes de validation Zod (URL valide, longueur max, etc.)
 *    sont effectivement appliquées
 */

import { describe, expect, it } from 'vitest';
import { decoderBloc, estTypeBloc } from '../../../lib/blocs-espace/validation';

describe('estTypeBloc', () => {
  it('accepte les 4 types supportés', () => {
    expect(estTypeBloc('texte')).toBe(true);
    expect(estTypeBloc('image')).toBe(true);
    expect(estTypeBloc('lien')).toBe(true);
    expect(estTypeBloc('bouton')).toBe(true);
  });

  it('refuse un type inconnu', () => {
    expect(estTypeBloc('video')).toBe(false);
    expect(estTypeBloc('TEXTE')).toBe(false);
    expect(estTypeBloc('')).toBe(false);
    expect(estTypeBloc(null)).toBe(false);
    expect(estTypeBloc(undefined)).toBe(false);
  });
});

describe('decoderBloc - cas valides', () => {
  it('décode un bloc texte', () => {
    const r = decoderBloc({ type: 'texte', contenu_json: { texte: 'Bonjour' } });
    expect(r).toEqual({ type: 'texte', contenu: { texte: 'Bonjour' } });
  });

  it('décode un bloc image avec légende', () => {
    const r = decoderBloc({
      type: 'image',
      contenu_json: { url: 'https://example.com/img.jpg', alt: 'Alt', legende: 'Légende' },
    });
    expect(r).toEqual({
      type: 'image',
      contenu: { url: 'https://example.com/img.jpg', alt: 'Alt', legende: 'Légende' },
    });
  });

  it('décode un bloc image sans légende (champ optionnel)', () => {
    const r = decoderBloc({
      type: 'image',
      contenu_json: { url: 'https://example.com/img.jpg', alt: 'Alt' },
    });
    expect(r?.type).toBe('image');
  });

  it('décode un bloc lien externe', () => {
    const r = decoderBloc({
      type: 'lien',
      contenu_json: { url: 'https://wa.me/33612345678', libelle: 'WhatsApp', externe: true },
    });
    expect(r).toEqual({
      type: 'lien',
      contenu: { url: 'https://wa.me/33612345678', libelle: 'WhatsApp', externe: true },
    });
  });

  it('décode un bloc bouton', () => {
    const r = decoderBloc({
      type: 'bouton',
      contenu_json: { url: '/inscription', libelle: 'Rejoindre', variante: 'primary' },
    });
    expect(r).toEqual({
      type: 'bouton',
      contenu: { url: '/inscription', libelle: 'Rejoindre', variante: 'primary' },
    });
  });

  it('accepte une URL interne (slash leading)', () => {
    const r = decoderBloc({ type: 'lien', contenu_json: { url: '/agenda', libelle: 'Agenda' } });
    expect(r).not.toBeNull();
  });
});

describe('decoderBloc - cas invalides', () => {
  it('renvoie null pour un type inconnu', () => {
    expect(decoderBloc({ type: 'video', contenu_json: {} })).toBeNull();
  });

  it('renvoie null pour un contenu manquant le champ requis', () => {
    expect(decoderBloc({ type: 'texte', contenu_json: {} })).toBeNull();
    expect(decoderBloc({ type: 'image', contenu_json: { url: 'http://x' } })).toBeNull(); // alt manquant
  });

  it('renvoie null pour une URL invalide', () => {
    expect(
      decoderBloc({ type: 'lien', contenu_json: { url: 'javascript:alert(1)', libelle: 'X' } }),
    ).toBeNull();
    expect(decoderBloc({ type: 'bouton', contenu_json: { url: 'foo', libelle: 'X' } })).toBeNull();
  });

  it('renvoie null pour un libellé vide', () => {
    expect(decoderBloc({ type: 'bouton', contenu_json: { url: '/x', libelle: '' } })).toBeNull();
  });

  it('renvoie null pour un texte trop long', () => {
    const tropLong = 'a'.repeat(5001);
    expect(decoderBloc({ type: 'texte', contenu_json: { texte: tropLong } })).toBeNull();
  });

  it('renvoie null pour une variante inconnue', () => {
    expect(
      decoderBloc({
        type: 'bouton',
        contenu_json: { url: '/x', libelle: 'X', variante: 'danger' },
      }),
    ).toBeNull();
  });
});
