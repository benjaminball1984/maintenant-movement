import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { articleAlaUne } from '@/lib/home/une';
import Image from 'next/image';
import Link from 'next/link';
import { UneSection } from './UneSection';

const FALLBACKS = {
  badge: 'Article éditorial',
  voirTous: 'Voir tout le média',
  emptyText: 'Aucun article publié pour le moment.',
  emptyLien: 'Découvrir Maintenant Médias',
};

/**
 * Une « article éditorial » de la page d'accueil (chantier V2.6.19).
 *
 * Branche sur l'édition du journal mise à la une : l'épinglée par l'admin si
 * elle existe, sinon la dernière publiée. État vide propre sinon.
 */
export async function UneArticle() {
  const [article, estAdmin, badge, voirTous, emptyText, emptyLien] = await Promise.all([
    articleAlaUne(),
    estAdminCourant(),
    lireContenuEditorial('home.une.article.badge', { valeurMd: FALLBACKS.badge }),
    lireContenuEditorial('home.une.article.voir_tous', { valeurMd: FALLBACKS.voirTous }),
    lireContenuEditorial('home.une.article.empty_text', { valeurMd: FALLBACKS.emptyText }),
    lireContenuEditorial('home.une.article.empty_lien', { valeurMd: FALLBACKS.emptyLien }),
  ]);

  if (article === null) {
    return (
      <UneSection
        type={badge.valeurMd}
        cleBadge="home.une.article.badge"
        couleur="accent"
        titre={null}
        voirTousHref="/s-informer/journal"
        voirTousLibelle={voirTous.valeurMd}
        cleVoirTous="home.une.article.voir_tous"
        estAdmin={estAdmin}
        enAttente={
          <p>
            <TexteEditableAdmin
              cle="home.une.article.empty_text"
              valeurInitiale={emptyText.valeurMd}
              estAdmin={estAdmin}
              libelle="empty state Une article (texte avant le lien)"
              longueurMax={200}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="home.une.article.empty_lien"
              valeurInitiale={emptyLien.valeurMd}
              estAdmin={estAdmin}
              libelle="empty state Une article (libelle du lien)"
              longueurMax={60}
            >
              {(t) => (
                <Link href="/s-informer/journal" className="text-brand hover:underline">
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>
            .
          </p>
        }
      />
    );
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
          libelle="libelle du lien Voir tout le media"
          longueurMax={60}
        >
          {(t) => (
            <Link href="/s-informer/journal" className="text-xs text-text-3 hover:text-brand">
              {t} →
            </Link>
          )}
        </TexteEditableAdmin>
      </header>

      {article.imageCouvertureUrl !== null ? (
        <Link
          href={`/s-informer/journal/${article.slug}`}
          className="relative block aspect-[16/9] overflow-hidden rounded-lg border border-border"
        >
          <Image
            src={article.imageCouvertureUrl}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
          />
        </Link>
      ) : null}

      <Heading niveau={2} apparenceComme={3} className="text-2xl">
        <Link
          href={`/s-informer/journal/${article.slug}`}
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
