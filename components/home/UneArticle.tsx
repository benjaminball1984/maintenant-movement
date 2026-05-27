import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { UneSection } from './UneSection';

const FALLBACKS = {
  badge: 'Article éditorial',
  voirTous: 'Voir tout le média',
  emptyText: 'Aucun article publié pour le moment. Média Maintenant arrive au chantier 7.1.',
};

/**
 * Une « article éditorial » de la page d'accueil.
 *
 * Stub : actuellement toujours en empty state. Le contenu réel viendra
 * avec Média Maintenant (chantier 7.1). Microcopy editable admin pour
 * permettre de retirer la mention « chantier 7.1 » quand pertinent.
 */
export async function UneArticle() {
  const [estAdmin, badge, voirTous, emptyText] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('home.une.article.badge', { valeurMd: FALLBACKS.badge }),
    lireContenuEditorial('home.une.article.voir_tous', { valeurMd: FALLBACKS.voirTous }),
    lireContenuEditorial('home.une.article.empty_text', { valeurMd: FALLBACKS.emptyText }),
  ]);

  return (
    <UneSection
      type={badge.valeurMd}
      cleBadge="home.une.article.badge"
      couleur="accent"
      titre={null}
      voirTousHref="/s-informer/media"
      voirTousLibelle={voirTous.valeurMd}
      cleVoirTous="home.une.article.voir_tous"
      estAdmin={estAdmin}
      enAttente={
        <TexteEditableAdmin
          cle="home.une.article.empty_text"
          valeurInitiale={emptyText.valeurMd}
          estAdmin={estAdmin}
          libelle="empty state Une article"
          multilignes
          longueurMax={300}
        >
          {(t) => <p>{t}</p>}
        </TexteEditableAdmin>
      }
    />
  );
}
