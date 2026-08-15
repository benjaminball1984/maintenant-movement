import { curer, dedupParUrl, estPertinent } from '@/lib/import-cagnottes/curation';
import { contientMot, detecterThemes, detecterType, estExclu } from '@/lib/import-cagnottes/themes';
import type { CandidatCagnotte } from '@/lib/import-cagnottes/types';
import { describe, expect, it } from 'vitest';

function candidat(p: Partial<CandidatCagnotte>): CandidatCagnotte {
  return {
    titre: 'Titre',
    resume: null,
    organisateur: null,
    plateforme: 'Ulule',
    source_url: 'https://fr.ulule.com/x/',
    objectif_centimes: null,
    collecte_centimes: null,
    devise: 'EUR',
    pourcentage: null,
    echeance: null,
    vignette_url: null,
    themes: [],
    type_collecte: null,
    metadata: {},
    ...p,
  };
}

describe('contientMot (mots entiers)', () => {
  it('ne matche pas une sous-chaîne (trans dans transition)', () => {
    expect(contientMot('transition ecologique', 'trans')).toBe(false);
    expect(contientMot('droits des trans', 'trans')).toBe(true);
  });

  it('traite les frontières non alphanumériques (+, tiret)', () => {
    expect(contientMot('bar lgbtqia+ toulouse', 'lgbtqia')).toBe(true);
  });
});

describe('detecterThemes', () => {
  it('classe la transition écologique en Écologie, PAS en LGBTQIA+ (non-régression)', () => {
    const t = detecterThemes('Soutenir la transition écologique et sociale');
    expect(t).toContain('Écologie');
    expect(t).not.toContain('LGBTQIA+');
  });

  it('détecte le féminisme et le LGBTQIA+ explicites', () => {
    expect(detecterThemes('AG féministe de Grenoble')).toContain('Féminisme');
    expect(detecterThemes('Prochain bar LGBTQIA+')).toContain('LGBTQIA+');
  });
});

describe('detecterType', () => {
  it('reconnaît les formats de collecte', () => {
    expect(detecterType('Caisse de grève des cheminot·es')).toBe('caisse_greve');
    expect(detecterType('Antifa, le jeu de société')).toBe('jeu');
    expect(detecterType('Mon livre engagé')).toBe('livre');
    expect(detecterType('Une micro-crèche')).toBeNull();
  });
});

describe('estExclu (marqueurs extrême droite)', () => {
  it('écarte les marqueurs et laisse passer le reste', () => {
    expect(estExclu('Jeu : Vive la France !')).toBe(true);
    expect(estExclu('Projet écologie populaire')).toBe(false);
  });
});

describe('curation', () => {
  it('garde ce qui a un thème, écarte le hors-sujet', () => {
    expect(estPertinent(candidat({ themes: ['Écologie'] }))).toBe(true);
    expect(estPertinent(candidat({ themes: [], type_collecte: null }))).toBe(false);
  });

  it('garde les types solidaires même sans thème (caisse de grève, cantine)', () => {
    expect(estPertinent(candidat({ themes: [], type_collecte: 'caisse_greve' }))).toBe(true);
    expect(estPertinent(candidat({ themes: [], type_collecte: 'livre' }))).toBe(false);
  });

  it('dédoublonne par source_url', () => {
    const liste = [
      candidat({ source_url: 'https://a', themes: ['Écologie'] }),
      candidat({ source_url: 'https://a', themes: ['Féminisme'] }),
      candidat({ source_url: 'https://b', themes: ['Féminisme'] }),
    ];
    expect(dedupParUrl(liste)).toHaveLength(2);
    expect(curer(liste)).toHaveLength(2);
  });
});
