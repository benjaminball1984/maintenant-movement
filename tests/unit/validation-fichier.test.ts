import { TAILLES, mimeAutorise, validerFichier } from '@/lib/validation-fichier';
import { describe, expect, it } from 'vitest';

describe('mimeAutorise', () => {
  it('accepte un MIME dans la liste', () => {
    expect(mimeAutorise('image/jpeg', ['image/jpeg', 'image/png'])).toBe(true);
  });

  it('refuse un MIME hors liste', () => {
    expect(mimeAutorise('application/pdf', ['image/jpeg', 'image/png'])).toBe(false);
  });

  it('liste vide refuse tout', () => {
    expect(mimeAutorise('image/jpeg', [])).toBe(false);
  });
});

describe('TAILLES', () => {
  it('Ko, Mo, Go correctement définies', () => {
    expect(TAILLES.Ko).toBe(1024);
    expect(TAILLES.Mo).toBe(1024 * 1024);
    expect(TAILLES.Go).toBe(1024 * 1024 * 1024);
  });
});

const OPTS_IMAGE = {
  mimesAutorises: ['image/jpeg', 'image/png', 'image/webp'] as const,
  tailleMaxOctets: 5 * TAILLES.Mo,
};

describe('validerFichier', () => {
  it('accepte un fichier valide', () => {
    const r = validerFichier({ size: 100_000, type: 'image/png', name: 'photo.png' }, OPTS_IMAGE);
    expect(r.ok).toBe(true);
  });

  it('refuse nom vide', () => {
    const r = validerFichier({ size: 100, type: 'image/png', name: '   ' }, OPTS_IMAGE);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('nom_vide');
  });

  it('refuse taille zéro', () => {
    const r = validerFichier({ size: 0, type: 'image/png', name: 'foo.png' }, OPTS_IMAGE);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('taille_zero');
  });

  it('refuse trop volumineux', () => {
    const r = validerFichier(
      { size: 10 * TAILLES.Mo, type: 'image/png', name: 'gros.png' },
      OPTS_IMAGE,
    );
    expect(r.ok).toBe(false);
    expect(r.code).toBe('trop_volumineux');
    expect(r.message).toContain('5.0 Mo');
  });

  it('refuse MIME non autorisé', () => {
    const r = validerFichier({ size: 100, type: 'application/pdf', name: 'doc.pdf' }, OPTS_IMAGE);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('mime_non_autorise');
    expect(r.message).toContain('image/jpeg');
  });

  it('refuse taille négative comme taille_zero', () => {
    const r = validerFichier({ size: -100, type: 'image/png', name: 'foo.png' }, OPTS_IMAGE);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('taille_zero');
  });
});
