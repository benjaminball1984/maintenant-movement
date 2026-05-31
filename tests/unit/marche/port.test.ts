import { portFactureCentimes } from '@/lib/marche/port';
import { describe, expect, it } from 'vitest';

/**
 * Tests du calcul des frais de port du marché solidaire (D5).
 * Règle CDC : le port n'est facturé que si la personne choisit l'envoi ET que
 * la vendeureuse le propose avec un coût strictement positif.
 */
describe('portFactureCentimes', () => {
  it("facture le port quand l'envoi est choisi, proposé et coûteux", () => {
    expect(
      portFactureCentimes({ modeRemise: 'envoi', envoiPostal: true, fraisPortCentimes: 600 }),
    ).toBe(600);
  });

  it('ne facture rien en remise main propre, même si un port est fixé', () => {
    expect(
      portFactureCentimes({ modeRemise: 'main_propre', envoiPostal: true, fraisPortCentimes: 600 }),
    ).toBe(0);
  });

  it('ne facture rien si le mode de remise est absent (rétro-compatibilité)', () => {
    expect(
      portFactureCentimes({ modeRemise: undefined, envoiPostal: true, fraisPortCentimes: 600 }),
    ).toBe(0);
  });

  it("ne facture rien si la vendeureuse ne propose pas l'envoi", () => {
    expect(
      portFactureCentimes({ modeRemise: 'envoi', envoiPostal: false, fraisPortCentimes: 600 }),
    ).toBe(0);
  });

  it('ne facture rien si le port fixé est nul', () => {
    expect(
      portFactureCentimes({ modeRemise: 'envoi', envoiPostal: true, fraisPortCentimes: 0 }),
    ).toBe(0);
  });

  it('ne facture rien pour un montant négatif ou non fini (robustesse)', () => {
    expect(
      portFactureCentimes({ modeRemise: 'envoi', envoiPostal: true, fraisPortCentimes: -10 }),
    ).toBe(0);
    expect(
      portFactureCentimes({
        modeRemise: 'envoi',
        envoiPostal: true,
        fraisPortCentimes: Number.NaN,
      }),
    ).toBe(0);
  });

  it('tronque un montant non entier vers le centime inférieur', () => {
    expect(
      portFactureCentimes({ modeRemise: 'envoi', envoiPostal: true, fraisPortCentimes: 650.9 }),
    ).toBe(650);
  });
});
