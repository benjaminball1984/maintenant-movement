import { masquerEmail } from '@/lib/petitions/gestion-signatures';
import { describe, expect, it } from 'vitest';

/**
 * Tests du masquage d'adresse email (V2.6.139).
 *
 * La personne qui a lancé une pétition peut gérer ses signatures, mais ne doit
 * pas récupérer le carnet d'adresses de ses signataires. Elle voit donc une
 * forme masquée : assez pour repérer un doublon, pas assez pour écrire.
 *
 * Le point sensible est l'identifiant avant l'arobase : c'est lui qui contient
 * presque toujours le nom complet de la personne.
 */
describe('masquerEmail', () => {
  it('ne garde que deux caractères avant l’arobase', () => {
    expect(masquerEmail('camille.dupont@exemple.fr')).toBe('ca***@exemple.fr');
  });

  it('conserve le domaine en entier (utile pour repérer un doublon)', () => {
    expect(masquerEmail('a.b.c@sous.domaine.exemple.org')).toBe('a.***@sous.domaine.exemple.org');
  });

  it('masque aussi un identifiant très court', () => {
    expect(masquerEmail('a@b.fr')).toBe('a***@b.fr');
  });

  it('ne laisse rien passer si l’adresse n’a pas d’arobase', () => {
    expect(masquerEmail('pas-une-adresse')).toBe('***');
  });

  it('ne laisse rien passer si l’adresse commence par l’arobase', () => {
    expect(masquerEmail('@exemple.fr')).toBe('***');
  });

  it('coupe sur la DERNIÈRE arobase, jamais sur une première trompeuse', () => {
    expect(masquerEmail('bizarre@interne@exemple.fr')).toBe('bi***@exemple.fr');
  });

  it('ne réexpose jamais le nom complet contenu dans l’identifiant', () => {
    const masque = masquerEmail('jean-baptiste.grenouille@exemple.fr');
    expect(masque).not.toContain('grenouille');
    expect(masque).not.toContain('baptiste');
  });
});
