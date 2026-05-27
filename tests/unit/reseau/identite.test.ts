import { nomAffichageRespectantVisibilite } from '@/lib/reseau/identite';
import { describe, expect, it } from 'vitest';

describe('nomAffichageRespectantVisibilite', () => {
  const identitePartielle = {
    personneId: '11111111-2222-3333-4444-555555555555',
    photoUrl: null,
  };

  it('retourne « Prénom Nom » si les deux sont visibles', () => {
    expect(
      nomAffichageRespectantVisibilite({
        ...identitePartielle,
        prenom: 'Camille',
        nom: 'Durand',
        numero: 'MABCDEFG',
      }),
    ).toBe('Camille Durand');
  });

  it('retourne le prénom seul si le nom est masqué', () => {
    expect(
      nomAffichageRespectantVisibilite({
        ...identitePartielle,
        prenom: 'Camille',
        nom: null,
        numero: 'MABCDEFG',
      }),
    ).toBe('Camille');
  });

  it('retourne le nom seul si le prénom est masqué', () => {
    expect(
      nomAffichageRespectantVisibilite({
        ...identitePartielle,
        prenom: null,
        nom: 'Durand',
        numero: 'MABCDEFG',
      }),
    ).toBe('Durand');
  });

  it('retourne le numéro M+7 si prénom et nom sont masqués', () => {
    expect(
      nomAffichageRespectantVisibilite({
        ...identitePartielle,
        prenom: null,
        nom: null,
        numero: 'MABCDEFG',
      }),
    ).toBe('MABCDEFG');
  });

  it('retourne « Membre » si tout est masqué et que le numéro est null', () => {
    expect(
      nomAffichageRespectantVisibilite({
        ...identitePartielle,
        prenom: null,
        nom: null,
        numero: null,
      }),
    ).toBe('Membre');
  });

  it('retourne « Membre » si l’identité est undefined ou null', () => {
    expect(nomAffichageRespectantVisibilite(undefined)).toBe('Membre');
    expect(nomAffichageRespectantVisibilite(null)).toBe('Membre');
  });

  it('ignore les chaînes vides ou blanches dans prénom et nom', () => {
    expect(
      nomAffichageRespectantVisibilite({
        ...identitePartielle,
        prenom: '   ',
        nom: '',
        numero: 'MABCDEFG',
      }),
    ).toBe('MABCDEFG');
  });
});
