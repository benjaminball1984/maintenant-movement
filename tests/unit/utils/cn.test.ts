import { cn } from '@/lib/utils';
import { describe, expect, it } from 'vitest';

/**
 * `cn()` est utilisé partout dans `components/ui/` pour assembler des
 * classes Tailwind conditionnelles. Son comportement doit être stable :
 * concaténation simple, filtrage des valeurs falsy, pas de déduplication
 * implicite (c'est une garantie d'absence de magie, pas un défaut).
 */
describe('cn()', () => {
  it('concatène plusieurs classes avec un espace', () => {
    expect(cn('btn', 'btn-primary', 'shadow')).toBe('btn btn-primary shadow');
  });

  it('filtre les valeurs falsy (null, undefined, false, "")', () => {
    expect(cn('btn', null, undefined, false, '', 'active')).toBe('btn active');
  });

  it('retourne une chaîne vide si tout est falsy', () => {
    expect(cn(null, undefined, false, '')).toBe('');
  });

  it('gère un appel sans argument', () => {
    expect(cn()).toBe('');
  });

  it("préserve l'ordre exact des classes (pas de tri)", () => {
    expect(cn('z', 'a', 'm')).toBe('z a m');
  });
});
