import { LONGUEUR_MAX_MESSAGE, validerContenuMessageFil } from '@/lib/fil-groupe-validation';
import { describe, expect, it } from 'vitest';

describe('validerContenuMessageFil', () => {
  it('accepte un message court', () => {
    const r = validerContenuMessageFil('Bonjour, on se voit demain ?');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.contenuNettoye).toBe('Bonjour, on se voit demain ?');
  });

  it('retire les espaces en début et fin', () => {
    const r = validerContenuMessageFil('   Coucou   ');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.contenuNettoye).toBe('Coucou');
  });

  it('refuse une chaîne vide', () => {
    const r = validerContenuMessageFil('');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.raison).toBe('vide');
  });

  it('refuse une chaîne uniquement composée d’espaces', () => {
    const r = validerContenuMessageFil('   \n\t  ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.raison).toBe('vide');
  });

  it('refuse un message qui dépasse la longueur maximale', () => {
    const r = validerContenuMessageFil('a'.repeat(LONGUEUR_MAX_MESSAGE + 1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.raison).toBe('trop_long');
  });

  it('accepte un message exactement à la longueur maximale', () => {
    const r = validerContenuMessageFil('a'.repeat(LONGUEUR_MAX_MESSAGE));
    expect(r.ok).toBe(true);
  });
});
