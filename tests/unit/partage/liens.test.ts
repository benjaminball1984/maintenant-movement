/**
 * Tests des fabricants de liens de partage (V2.5.7 Phase F).
 *
 * Vérifie que chaque URL retournée :
 *  - utilise la bonne origine (whatsapp, telegram, etc.)
 *  - encode bien le texte (espaces, caractères spéciaux, accents)
 *  - inclut bien l'URL à partager + le message
 *
 * Tests purs, pas de DOM, pas de fetch.
 */

import { describe, expect, it } from 'vitest';
import {
  FABRICANTS_PARTAGE,
  lienEmail,
  lienMastodon,
  lienMessenger,
  lienSignal,
  lienTelegram,
  lienWhatsApp,
} from '../../../lib/partage/liens';

const PARAMS = {
  titre: 'Pétition pour les transports gratuits',
  url: 'https://maintenant-le-mouvement.org/petitions/transports-gratuits',
  message: 'Je viens de signer cette pétition, à toi !',
};

describe('lienWhatsApp', () => {
  it('utilise le domaine wa.me et encode le texte', () => {
    const r = lienWhatsApp(PARAMS);
    expect(r.startsWith('https://wa.me/?text=')).toBe(true);
    expect(r).toContain('p%C3%A9tition'); // accent encodé
    expect(r).toContain('https%3A%2F%2Fmaintenant'); // URL encodée
  });
});

describe('lienTelegram', () => {
  it('utilise le domaine t.me/share/url avec url= et text= séparés', () => {
    const r = lienTelegram(PARAMS);
    expect(r.startsWith('https://t.me/share/url?url=')).toBe(true);
    expect(r).toContain('&text=');
  });
});

describe('lienMessenger', () => {
  it('utilise dialog/send avec link=', () => {
    const r = lienMessenger(PARAMS);
    expect(r.startsWith('https://www.facebook.com/dialog/send')).toBe(true);
    expect(r).toContain('link=https%3A%2F%2Fmaintenant');
  });
});

describe('lienSignal', () => {
  it('utilise le scheme sgnl://', () => {
    const r = lienSignal(PARAMS);
    expect(r.startsWith('sgnl://send?text=')).toBe(true);
  });
});

describe('lienEmail', () => {
  it('utilise mailto: avec subject et body', () => {
    const r = lienEmail(PARAMS);
    expect(r.startsWith('mailto:?subject=')).toBe(true);
    expect(r).toContain('&body=');
    // Le body contient un saut de ligne entre message et URL
    expect(r).toContain('%0A%0A');
  });

  it('encode bien le titre avec caractères spéciaux', () => {
    const r = lienEmail({ ...PARAMS, titre: 'Titre & test < > "' });
    expect(r).toContain('%26'); // &
    expect(r).toContain('%3C'); // <
    expect(r).toContain('%22'); // "
  });
});

describe('lienMastodon', () => {
  it('utilise mastodon.social/share avec text=', () => {
    const r = lienMastodon(PARAMS);
    expect(r.startsWith('https://mastodon.social/share?text=')).toBe(true);
  });
});

describe('FABRICANTS_PARTAGE', () => {
  it("liste les 6 services attendus dans l'ordre", () => {
    const ids = FABRICANTS_PARTAGE.map((f) => f.id);
    expect(ids).toEqual(['whatsapp', 'telegram', 'messenger', 'signal', 'email', 'mastodon']);
  });

  it('chaque fabricant produit une URL non vide pour des params valides', () => {
    for (const f of FABRICANTS_PARTAGE) {
      const r = f.fabricant(PARAMS);
      expect(r).toBeTruthy();
      expect(r.length).toBeGreaterThan(20);
    }
  });
});
