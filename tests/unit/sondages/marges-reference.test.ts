import {
  CLES_REDRESSEMENT,
  MARGES_REFERENCE,
  cibleParReponse,
  margesNormalisees,
} from '@/lib/sondages/marges-reference';
import { QUESTIONS_PAR_CLE } from '@/lib/sondages/qualification';
import { describe, expect, it } from 'vitest';

describe('marges de référence (socle du redressement)', () => {
  it('chaque variable existe dans le panel et ses cibles sont alignées sur les options', () => {
    for (const marge of MARGES_REFERENCE) {
      const question = QUESTIONS_PAR_CLE.get(marge.cle);
      expect(question, `question inconnue : ${marge.cle}`).toBeDefined();
      expect(marge.cibles.length, `cibles désalignées pour ${marge.cle}`).toBe(
        question?.options.length,
      );
    }
  });

  it('les cibles non nulles somment à ~1 (avant normalisation) pour chaque variable de quota', () => {
    for (const marge of MARGES_REFERENCE.filter((m) => m.redressement)) {
      const somme = marge.cibles.reduce<number>((s, c) => s + (c ?? 0), 0);
      expect(somme, `somme hors plage pour ${marge.cle} (${somme})`).toBeGreaterThan(0.9);
      expect(somme, `somme hors plage pour ${marge.cle} (${somme})`).toBeLessThan(1.02);
    }
  });

  it('margesNormalisees somme exactement à 1 sur les modalités mesurées', () => {
    for (const cle of CLES_REDRESSEMENT) {
      const map = margesNormalisees(cle);
      expect(map, `pas de marge normalisée pour ${cle}`).not.toBeNull();
      const somme = [...(map?.values() ?? [])].reduce((s, v) => s + v, 0);
      expect(somme).toBeCloseTo(1, 6);
    }
  });

  it('le calage présidentielle 2022 reflète les résultats officiels (Macron en tête)', () => {
    const map = margesNormalisees('presidentielle_2022');
    expect(map?.size).toBe(12);
    const macron = map?.get('Emmanuel Macron (La République en marche)') ?? 0;
    const lepen = map?.get('Marine Le Pen (Rassemblement national)') ?? 0;
    expect(macron).toBeGreaterThan(lepen);
    expect(macron).toBeCloseTo(0.2785, 3);
  });

  it('cibleParReponse mappe une réponse à sa part, et rend null pour une modalité non redressée', () => {
    expect(cibleParReponse('genre', 'Homme')).toBeCloseTo(0.478, 3);
    expect(cibleParReponse('genre', 'Non binaire')).toBeNull();
    expect(cibleParReponse('csp', 'Ne souhaite pas répondre')).toBeNull();
    expect(cibleParReponse('inconnue', 'x')).toBeNull();
  });
});
