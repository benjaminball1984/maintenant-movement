import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Heading, ImageAffiche } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { articleAlaUne } from '@/lib/home/une';
import Link from 'next/link';
import { UneNonEpinglee } from './UneNonEpinglee';

const FALLBACKS = {
  badge: 'Article éditorial',
  voirTous: 'Voir Maintenant Médias',
};

/**
 * Une « article éditorial » de la page d'accueil (chantier V2.6.19).
 *
 * Branche sur les contenus de Maintenant Médias (table media) **épinglés
 * par l'administration** (décision Lilou/Ben du 15/08/2026 : plus aucune
 * mise à la une automatique, ce qui écarte de fait tout contenu importé
 * par les routines horaires). Sans épinglage, le bloc n'apparaît pas.
 */
export async function UneArticle() {
  const [article, estAdmin, badge, voirTous] = await Promise.all([
    articleAlaUne(),
    estAdminCourant(),
    lireContenuEditorial('home.une.article.badge', { valeurMd: FALLBACKS.badge }),
    lireContenuEditorial('home.une.article.voir_tous', { valeurMd: FALLBACKS.voirTous }),
  ]);

  if (article === null) {
    return estAdmin ? <UneNonEpinglee type={badge.valeurMd} couleur="accent" /> : null;
  }

  return (
    <Card variant="ombre" className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <TexteEditableAdmin
          cle="home.une.article.badge"
          valeurInitiale={badge.valeurMd}
          estAdmin={estAdmin}
          libelle="texte du badge Une article"
          longueurMax={40}
        >
          {(t) => <Badge variant="accent">{t}</Badge>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="home.une.article.voir_tous"
          valeurInitiale={voirTous.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle du lien Voir Maintenant Médias"
          longueurMax={60}
        >
          {(t) => (
            <Link href="/s-informer/media" className="text-xs text-text-3 hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </header>

      {article.imageCouvertureUrl !== null ? (
        <Link href={`/s-informer/media/${article.slug}`} className="block">
          <ImageAffiche
            src={article.imageCouvertureUrl}
            sizes="(max-width: 768px) 100vw, 720px"
            className="aspect-[16/9] rounded-lg border border-border bg-surface-2"
          />
        </Link>
      ) : null}

      <Heading niveau={2} apparenceComme={3} className="text-2xl">
        <Link
          href={`/s-informer/media/${article.slug}`}
          className="text-text-1 underline-offset-4 hover:underline"
        >
          {article.titre}
        </Link>
      </Heading>

      {article.sousTitre !== null && article.sousTitre.trim() !== '' ? (
        <p className="text-sm text-text-2">{article.sousTitre}</p>
      ) : null}
    </Card>
  );
}
