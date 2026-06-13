import {
  type MediaDoublon,
  comparerTitres,
  meilleurCorps,
  normaliserTitreMedia,
  rangRichesse,
  regrouperDoublons,
  tokensTitre,
} from '@/lib/media/doublons';
import { describe, expect, it } from 'vitest';

/**
 * Tests de la détection de doublons de la revue de presse (V2.6.113) :
 * une même actualité publiée en vidéo ET en brève par la même source doit
 * être détectée comme un seul contenu (on garde la vidéo).
 */

// Le cas réel signalé par Ben (Là-bas si j'y suis) : même sujet, un titre
// préfixé du nom de l'invité, l'autre suffixé de « [EXTRAIT] ».
const TITRE_VIDEO =
  '« La question des moyens est un sous-problème de la question de la politique globale » [EXTRAIT]';
const TITRE_BREVE =
  'Jean-Pierre Rosenczveig : « La question des moyens est un sous-problème de la question de la politique globale »';

describe('normaliserTitreMedia', () => {
  it('met en minuscules, retire accents et ponctuation', () => {
    expect(normaliserTitreMedia('Écologie : « Test » [EXTRAIT]')).toBe('ecologie test extrait');
  });
});

describe('tokensTitre', () => {
  it('garde les mots significatifs, écarte mots courts et mots vides', () => {
    const tokens = tokensTitre('La question des moyens est un sous-problème');
    expect(tokens.has('question')).toBe(true);
    expect(tokens.has('moyens')).toBe(true);
    expect(tokens.has('probleme')).toBe(true);
    // « sous » est un mot vide, « des/est/un » trop courts.
    expect(tokens.has('sous')).toBe(false);
    expect(tokens.has('des')).toBe(false);
  });
});

describe('comparerTitres', () => {
  it('reconnaît le même sujet malgré préfixe nom et suffixe [EXTRAIT]', () => {
    const { score, communs } = comparerTitres(TITRE_VIDEO, TITRE_BREVE);
    expect(communs).toBeGreaterThanOrEqual(4);
    expect(score).toBeGreaterThanOrEqual(0.75);
  });

  it('distingue deux sujets différents', () => {
    const { score } = comparerTitres(
      'Grève dans les hôpitaux publics',
      'Coupe du monde de football : la finale',
    );
    expect(score).toBeLessThan(0.3);
  });

  it('renvoie 0 pour un titre sans mot significatif', () => {
    expect(comparerTitres('Le a de', 'autre titre ici').score).toBe(0);
  });
});

describe('rangRichesse', () => {
  it('classe vidéo/live au-dessus de la brève, elle-même au-dessus du dessin', () => {
    expect(rangRichesse('video')).toBeGreaterThan(rangRichesse('breve'));
    expect(rangRichesse('live')).toBeGreaterThan(rangRichesse('breve'));
    expect(rangRichesse('breve')).toBeGreaterThan(rangRichesse('dessin'));
  });
});

function media(
  p: Partial<MediaDoublon> & { id: string; titre: string; type: string },
): MediaDoublon {
  return {
    provenance_externe: 'Là-bas si j’y suis',
    corps: '',
    publie_le: '2026-06-12T10:00:00Z',
    vignette_url: null,
    media_url: null,
    tags: null,
    ...p,
  };
}

describe('regrouperDoublons', () => {
  it('fusionne la vidéo et la brève du même sujet/source, garde la vidéo', () => {
    const medias = [
      media({ id: 'v', titre: TITRE_VIDEO, type: 'video', media_url: 'embed', corps: '' }),
      media({
        id: 'b',
        titre: TITRE_BREVE,
        type: 'breve',
        corps: 'Texte de la brève sur 6 lignes…',
      }),
    ];
    const groupes = regrouperDoublons(medias);
    expect(groupes).toHaveLength(1);
    expect(groupes[0]?.garde.id).toBe('v');
    expect(groupes[0]?.absorbes.map((m) => m.id)).toEqual(['b']);
  });

  it('ne regroupe pas deux sources différentes', () => {
    const medias = [
      media({ id: 'v', titre: TITRE_VIDEO, type: 'video', provenance_externe: 'Source A' }),
      media({ id: 'b', titre: TITRE_BREVE, type: 'breve', provenance_externe: 'Source B' }),
    ];
    expect(regrouperDoublons(medias)).toHaveLength(0);
  });

  it('ne regroupe pas des sujets différents de la même source', () => {
    const medias = [
      media({ id: '1', titre: 'Grève générale dans les transports', type: 'video' }),
      media({ id: '2', titre: 'Festival de cinéma à Cannes', type: 'breve' }),
    ];
    expect(regrouperDoublons(medias)).toHaveLength(0);
  });

  it('ne regroupe pas hors de la fenêtre de dates', () => {
    const medias = [
      media({ id: 'v', titre: TITRE_VIDEO, type: 'video', publie_le: '2026-06-01T10:00:00Z' }),
      media({ id: 'b', titre: TITRE_BREVE, type: 'breve', publie_le: '2026-06-12T10:00:00Z' }),
    ];
    expect(regrouperDoublons(medias, { fenetreJours: 4 })).toHaveLength(0);
  });

  it('ne fusionne PAS deux contenus de même format aux titres seulement recouvrants', () => {
    // Deux dessins DIFFÉRENTS (titres courts qui partagent des mots) : faux
    // positif à écarter (cas Basta! repéré en prod).
    const medias = [
      media({
        id: 'd1',
        titre: 'Souffrance au travail à la SNCF : les cheminots en grève',
        type: 'dessin',
        provenance_externe: 'Basta!',
      }),
      media({
        id: 'd2',
        titre: 'Travail : souffrance des cheminots SNCF en grève générale',
        type: 'dessin',
        provenance_externe: 'Basta!',
      }),
    ];
    expect(regrouperDoublons(medias)).toHaveLength(0);
  });

  it('fusionne deux contenus de même format aux titres STRICTEMENT identiques (ré-import)', () => {
    const t = 'Porcherie de Royère : les syndicats contre-attaquent 🐖';
    const medias = [
      media({ id: 'a', titre: t, type: 'video', provenance_externe: 'Télé Millevaches' }),
      media({ id: 'b', titre: t, type: 'video', provenance_externe: 'Télé Millevaches' }),
    ];
    expect(regrouperDoublons(medias)).toHaveLength(1);
  });

  it('choisit le corps le plus long du groupe', () => {
    const groupe = {
      garde: media({ id: 'v', titre: TITRE_VIDEO, type: 'video', corps: 'court' }),
      absorbes: [
        media({ id: 'b', titre: TITRE_BREVE, type: 'breve', corps: 'un texte beaucoup plus long' }),
      ],
    };
    expect(meilleurCorps(groupe)).toBe('un texte beaucoup plus long');
  });
});
