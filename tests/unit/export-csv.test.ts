import { composerDocumentCsv, composerLigneCsv, echapperValeurCsv } from '@/lib/export-csv';
import { describe, expect, it } from 'vitest';

describe('echapperValeurCsv', () => {
  it('retourne chaîne vide pour null et undefined', () => {
    expect(echapperValeurCsv(null)).toBe('');
    expect(echapperValeurCsv(undefined)).toBe('');
  });

  it('convertit les nombres et booléens en string', () => {
    expect(echapperValeurCsv(42)).toBe('42');
    expect(echapperValeurCsv(3.14)).toBe('3.14');
    expect(echapperValeurCsv(true)).toBe('true');
    expect(echapperValeurCsv(false)).toBe('false');
  });

  it('laisse passer une string simple', () => {
    expect(echapperValeurCsv('hello')).toBe('hello');
    expect(echapperValeurCsv('M. Dupont')).toBe('M. Dupont');
  });

  it('encadre par guillemets si virgule', () => {
    expect(echapperValeurCsv('Lyon, Rhône')).toBe('"Lyon, Rhône"');
  });

  it('encadre par guillemets si saut de ligne', () => {
    expect(echapperValeurCsv('ligne1\nligne2')).toBe('"ligne1\nligne2"');
    expect(echapperValeurCsv('ligne1\r\nligne2')).toBe('"ligne1\r\nligne2"');
  });

  it('double les guillemets internes ET encadre', () => {
    expect(echapperValeurCsv('Il a dit "bonjour"')).toBe('"Il a dit ""bonjour"""');
  });

  it('encadre si guillemet sans virgule ni saut', () => {
    expect(echapperValeurCsv('a"b')).toBe('"a""b"');
  });
});

describe('composerLigneCsv', () => {
  it('joint avec virgule', () => {
    expect(composerLigneCsv(['a', 'b', 'c'])).toBe('a,b,c');
  });

  it('échappe chaque cellule', () => {
    expect(composerLigneCsv(['simple', 'avec, virgule', 42])).toBe('simple,"avec, virgule",42');
  });

  it('gère null/undefined comme cellules vides', () => {
    expect(composerLigneCsv(['a', null, 'c', undefined])).toBe('a,,c,');
  });
});

describe('composerDocumentCsv', () => {
  it('compose document complet avec CRLF', () => {
    const doc = composerDocumentCsv(
      ['nom', 'age'],
      [
        ['Alice', 30],
        ['Bob', 25],
      ],
    );
    expect(doc).toBe('nom,age\r\nAlice,30\r\nBob,25\r\n');
  });

  it('gère un document vide (juste en-têtes)', () => {
    expect(composerDocumentCsv(['a', 'b'], [])).toBe('a,b\r\n');
  });

  it('échappe correctement à travers tout le doc', () => {
    const doc = composerDocumentCsv(
      ['nom', 'description'],
      [
        ['Alice', 'a dit "hello"'],
        ['Bob, Marie', 'multi\nligne'],
      ],
    );
    expect(doc).toBe(
      'nom,description\r\nAlice,"a dit ""hello"""\r\n"Bob, Marie","multi\nligne"\r\n',
    );
  });
});
