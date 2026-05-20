import { UneSection } from './UneSection';

/**
 * Une « mobilisation à venir » de la page d'accueil.
 *
 * Modération a posteriori, statut « je participe » d'un clic
 * (chantier 3.2).
 */
export function UneMobilisation() {
  return (
    <UneSection
      type="Mobilisation à venir"
      couleur="hue"
      titre={null}
      voirTousHref="/mobiliser/mobilisations"
      voirTousLibelle="Voir toutes les mobilisations"
      enAttente={<p>Aucune mobilisation annoncée pour le moment. Reviens au chantier 3.2.</p>}
    />
  );
}
