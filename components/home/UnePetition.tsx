import { UneSection } from './UneSection';

/**
 * Une « pétition » de la page d'accueil.
 *
 * Pour le chantier 2.1, aucune pétition n'existe en BDD (les tables
 * `petition` sont posées au chantier 3.1). On affiche donc un état
 * vide propre.
 *
 * Le CTA spécifié (« Signer en modale ») sera branché à la
 * `<ModaleSignaturePetition>` quand la une affichera une vraie pétition.
 */
export function UnePetition() {
  return (
    <UneSection
      type="Pétition en cours"
      couleur="brand"
      titre={null}
      voirTousHref="/mobiliser/petitions"
      voirTousLibelle="Voir toutes les pétitions"
      enAttente={
        <p>Aucune pétition active pour le moment. Les pétitions arrivent au chantier 3.1.</p>
      }
    />
  );
}
