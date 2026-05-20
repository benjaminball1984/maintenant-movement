import { UneSection } from './UneSection';

/**
 * Une « cagnotte solidaire » de la page d'accueil.
 *
 * Cagnottes : 3 sous-types (ouvertes, lutte, cotisations). Stripe
 * Connect + KYC pour les porteur·euses. Branchement au chantier 3.3.
 */
export function UneCagnotte() {
  return (
    <UneSection
      type="Cagnotte solidaire"
      couleur="vous"
      titre={null}
      voirTousHref="/mobiliser/cagnottes"
      voirTousLibelle="Voir toutes les cagnottes"
      enAttente={<p>Aucune cagnotte mise en avant pour le moment. Reviens au chantier 3.3.</p>}
    />
  );
}
