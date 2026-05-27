import { libelleType, trierParPertinence } from '@/lib/recherche-globale';
import { describe, expect, it } from 'vitest';

describe('libelleType', () => {
  it('retourne le libellé français pour chaque type', () => {
    expect(libelleType('petition')).toBe('Pétition');
    expect(libelleType('mobilisation')).toBe('Mobilisation');
    expect(libelleType('cagnotte')).toBe('Cagnotte');
    expect(libelleType('commune')).toBe('Commune');
    expect(libelleType('federation')).toBe('Fédération');
    expect(libelleType('media')).toBe('Article / média');
    expect(libelleType('sondage')).toBe('Sondage');
    expect(libelleType('salle_decider')).toBe('Salle Décider');
    expect(libelleType('journal_affiche')).toBe('Journal-affiche');
    expect(libelleType('groupe_entraide_local')).toBe('Groupe d’entraide');
    expect(libelleType('campagne')).toBe('Campagne');
  });
});

describe('trierParPertinence', () => {
  it('place les préfixes avant les infixes', () => {
    const items = [
      { titre: 'Une décision sur le climat' },
      { titre: 'Décision majeure' },
      { titre: 'Petite décision' },
    ];
    const trie = trierParPertinence(items, 'décision');
    expect(trie[0]?.titre).toBe('Décision majeure');
  });

  it('à pertinence égale, classe par longueur de titre croissante', () => {
    const items = [
      { titre: 'Climat global aujourd’hui' },
      { titre: 'Climat aujourd’hui' },
      { titre: 'Climat' },
    ];
    const trie = trierParPertinence(items, 'clim');
    expect(trie[0]?.titre).toBe('Climat');
    expect(trie[1]?.titre).toBe('Climat aujourd’hui');
    expect(trie[2]?.titre).toBe('Climat global aujourd’hui');
  });

  it('est insensible à la casse', () => {
    const items = [{ titre: 'climat important' }, { titre: 'Important pour le climat' }];
    const trie = trierParPertinence(items, 'CLIMAT');
    expect(trie[0]?.titre).toBe('climat important');
  });

  it('ne mute pas le tableau original', () => {
    const items = [{ titre: 'B' }, { titre: 'A' }];
    const original = [...items];
    trierParPertinence(items, 'a');
    expect(items).toEqual(original);
  });

  it('retourne tel quel si query vide', () => {
    const items = [{ titre: 'B' }, { titre: 'A' }];
    expect(trierParPertinence(items, '')).toEqual(items);
    expect(trierParPertinence(items, '   ')).toEqual(items);
  });

  it('gère les accents : la comparaison se fait sur la version brute', () => {
    const items = [
      { titre: 'Édition' },
      { titre: 'Édition spéciale n°1' },
      { titre: 'Édition pirate de l’an passé' },
    ];
    const trie = trierParPertinence(items, 'Édit');
    expect(trie[0]?.titre).toBe('Édition');
  });
});
