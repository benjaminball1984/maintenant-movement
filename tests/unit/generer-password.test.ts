import { genererCodeNumerique, genererPassword, genererTokenUrlSafe } from '@/lib/generer-password';
import { describe, expect, it } from 'vitest';

describe('genererPassword', () => {
  it('respecte la longueur demandée', () => {
    expect(genererPassword({ longueur: 16 })).toHaveLength(16);
    expect(genererPassword({ longueur: 8 })).toHaveLength(8);
  });

  it('longueur minimum 4 (clampé)', () => {
    expect(genererPassword({ longueur: 1 })).toHaveLength(4);
  });

  it('défaut longueur 16', () => {
    expect(genererPassword()).toHaveLength(16);
  });

  it('contient au moins une minuscule par défaut', () => {
    for (let i = 0; i < 10; i++) {
      expect(genererPassword()).toMatch(/[a-z]/);
    }
  });

  it('contient au moins une majuscule par défaut', () => {
    for (let i = 0; i < 10; i++) {
      expect(genererPassword()).toMatch(/[A-Z]/);
    }
  });

  it('contient au moins un chiffre par défaut', () => {
    for (let i = 0; i < 10; i++) {
      expect(genererPassword()).toMatch(/\d/);
    }
  });

  it('contient au moins un caractère spécial par défaut', () => {
    for (let i = 0; i < 10; i++) {
      expect(genererPassword()).toMatch(/[!@#$%^&*()_+\-=[\]{};:,.<>?]/);
    }
  });

  it('ne contient pas de spéciaux si désactivés', () => {
    for (let i = 0; i < 10; i++) {
      expect(genererPassword({ speciaux: false })).not.toMatch(/[!@#$%^&*]/);
    }
  });

  it('lance erreur si toutes catégories désactivées', () => {
    expect(() =>
      genererPassword({
        minuscules: false,
        majuscules: false,
        chiffres: false,
        speciaux: false,
      }),
    ).toThrow();
  });

  it('non déterministe (2 appels = 2 valeurs différentes presque sûrement)', () => {
    const a = genererPassword({ longueur: 32 });
    const b = genererPassword({ longueur: 32 });
    expect(a).not.toBe(b);
  });
});

describe('genererCodeNumerique', () => {
  it('défaut 6 chiffres', () => {
    expect(genererCodeNumerique()).toHaveLength(6);
    expect(genererCodeNumerique()).toMatch(/^\d{6}$/);
  });

  it('longueur custom', () => {
    expect(genererCodeNumerique(4)).toMatch(/^\d{4}$/);
    expect(genererCodeNumerique(10)).toMatch(/^\d{10}$/);
  });

  it('lance si longueur < 1', () => {
    expect(() => genererCodeNumerique(0)).toThrow();
  });
});

describe('genererTokenUrlSafe', () => {
  it('défaut 32 caractères', () => {
    expect(genererTokenUrlSafe()).toHaveLength(32);
  });

  it('ne contient pas 0/O/1/l/I (anti-confusion)', () => {
    for (let i = 0; i < 20; i++) {
      const t = genererTokenUrlSafe(64);
      expect(t).not.toMatch(/[0O1lI]/);
    }
  });

  it('alphanumérique uniquement', () => {
    expect(genererTokenUrlSafe(32)).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('longueur custom', () => {
    expect(genererTokenUrlSafe(8)).toHaveLength(8);
  });
});
