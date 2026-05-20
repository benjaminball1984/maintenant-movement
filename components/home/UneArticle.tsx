import { UneSection } from './UneSection';

/**
 * Une « article éditorial » de la page d'accueil.
 *
 * Le contenu réel viendra avec Média Maintenant (chantier 7.1).
 * 2 articles à reprendre de Base44 (cf. migration 10.1).
 */
export function UneArticle() {
  return (
    <UneSection
      type="Article éditorial"
      couleur="accent"
      titre={null}
      voirTousHref="/s-informer/media"
      voirTousLibelle="Voir tout le média"
      enAttente={
        <p>Aucun article publié pour le moment. Média Maintenant arrive au chantier 7.1.</p>
      }
    />
  );
}
