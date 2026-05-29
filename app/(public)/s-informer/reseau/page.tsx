import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { CartePost } from '@/components/reseau/CartePost';
import { ComposerPost } from '@/components/reseau/ComposerPost';
import { Alert, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { compterMessagesNonLus, getFluxReseau } from '@/lib/reseau/requetes';
import { Heart, MessageCircle, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACKS = {
  ctaRechercher: 'Rechercher',
  ctaMesMessages: 'Mes messages',
  alertTriTitre: 'Comment ce flux est trié',
  alertTriCorps:
    'Ordre strictement transparent : d’abord tes publications, puis celles des personnes que tu suis, puis le reste, du plus récent au plus ancien. Pas de publicité, pas de pondération cachée, pas d’autoplay.',
  financementTexte: 'Ce réseau n’a pas de publicité. Il vit grâce aux cotisations et aux dons.',
  financementCta: 'Soutenir le fonctionnement',
  deconnecteAmorce: 'pour publier, soutenir et commenter.',
  deconnecteLien: 'Connecte-toi',
  emptyTexte: 'Aucune publication pour l’instant.',
  emptySoisLaPremiere: 'Sois la première personne à publier.',
};

export const metadata: Metadata = {
  title: 'Réseau social',
  description: 'Flux sans publicité, algorithme strictement transparent et hiérarchisé.',
};

/**
 * Page `/s-informer/reseau` — flux du réseau social (chantier 7.5).
 *
 * Cf. spec §4E : flux hiérarchisé TRANSPARENT (soi -> suivi·es -> reste), sans
 * publicité ni pondération cachée, modération a posteriori, encart financement.
 */
export default async function PageReseau() {
  const session = await getSession();
  const connecte = session !== null;
  const moi = session?.userId ?? null;

  const [
    flux,
    nonLus,
    estAdmin,
    ctaRechercher,
    ctaMesMessages,
    alertTriTitre,
    alertTriCorps,
    financementTexte,
    financementCta,
    deconnecteAmorce,
    deconnecteLien,
    emptyTexte,
    emptySoisLaPremiere,
  ] = await Promise.all([
    getFluxReseau(),
    connecte ? compterMessagesNonLus() : Promise.resolve(0),
    estAdminCourant(),
    lireContenuEditorial('s-informer.reseau.cta_rechercher', {
      valeurMd: FALLBACKS.ctaRechercher,
    }),
    lireContenuEditorial('s-informer.reseau.cta_mes_messages', {
      valeurMd: FALLBACKS.ctaMesMessages,
    }),
    lireContenuEditorial('s-informer.reseau.alert_tri_titre', {
      valeurMd: FALLBACKS.alertTriTitre,
    }),
    lireContenuEditorial('s-informer.reseau.alert_tri_corps', {
      valeurMd: FALLBACKS.alertTriCorps,
    }),
    lireContenuEditorial('s-informer.reseau.financement_texte', {
      valeurMd: FALLBACKS.financementTexte,
    }),
    lireContenuEditorial('s-informer.reseau.financement_cta', {
      valeurMd: FALLBACKS.financementCta,
    }),
    lireContenuEditorial('s-informer.reseau.deconnecte_amorce', {
      valeurMd: FALLBACKS.deconnecteAmorce,
    }),
    lireContenuEditorial('s-informer.reseau.deconnecte_lien', {
      valeurMd: FALLBACKS.deconnecteLien,
    }),
    lireContenuEditorial('s-informer.reseau.empty_texte', { valeurMd: FALLBACKS.emptyTexte }),
    lireContenuEditorial('s-informer.reseau.empty_sois_la_premiere', {
      valeurMd: FALLBACKS.emptySoisLaPremiere,
    }),
  ]);

  return (
    <Container taille="md" className="py-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
          <Heading niveau={1} className="bg-grad bg-clip-text text-transparent">
            Réseau social
          </Heading>
        </div>
        {connecte ? (
          <div className="flex items-center gap-1.5">
            <TexteEditableAdmin
              cle="s-informer.reseau.cta_rechercher"
              valeurInitiale={ctaRechercher.valeurMd}
              estAdmin={estAdmin}
              libelle="CTA Rechercher dans reseau"
              longueurMax={40}
            >
              {(t) => (
                <Link
                  href="/s-informer/reseau/recherche"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-bold text-text-1 transition hover:border-brand hover:text-brand"
                >
                  <Search size={14} strokeWidth={1.5} />
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>
            <TexteEditableAdmin
              cle="s-informer.reseau.cta_mes_messages"
              valeurInitiale={ctaMesMessages.valeurMd}
              estAdmin={estAdmin}
              libelle="CTA Mes messages dans reseau (le compteur s'ajoute automatiquement)"
              longueurMax={40}
            >
              {(t) => (
                <Link
                  href="/s-informer/reseau/messages"
                  className="relative inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-bold text-text-1 transition hover:border-brand hover:text-brand"
                >
                  <MessageCircle size={14} strokeWidth={1.5} />
                  {t}
                  {nonLus > 0 ? (
                    <span className="-top-1.5 -right-1.5 absolute inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1 font-bold text-white text-xs">
                      {nonLus}
                    </span>
                  ) : null}
                </Link>
              )}
            </TexteEditableAdmin>
          </div>
        ) : null}
      </header>

      <Alert
        variant="info"
        titre={
          <TexteEditableAdmin
            cle="s-informer.reseau.alert_tri_titre"
            valeurInitiale={alertTriTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre alerte explication tri reseau"
            longueurMax={60}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        }
      >
        <TexteEditableAdmin
          cle="s-informer.reseau.alert_tri_corps"
          valeurInitiale={alertTriCorps.valeurMd}
          estAdmin={estAdmin}
          libelle="corps alerte explication tri reseau"
          multilignes
          longueurMax={500}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Alert>

      <Card
        variant="ombre"
        className="my-6 flex flex-wrap items-center gap-3 border-brand/20 bg-brand-light/40"
      >
        <Heart size={20} strokeWidth={1.5} className="shrink-0 text-brand" aria-hidden="true" />
        <TexteEditableAdmin
          cle="s-informer.reseau.financement_texte"
          valeurInitiale={financementTexte.valeurMd}
          estAdmin={estAdmin}
          libelle="texte rappel financement reseau"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="flex-1 text-sm text-text-2">{t}</p>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="s-informer.reseau.financement_cta"
          valeurInitiale={financementCta.valeurMd}
          estAdmin={estAdmin}
          libelle="CTA Soutenir le fonctionnement"
          longueurMax={50}
        >
          {(t) => (
            <Link
              href="/mobiliser/cagnottes"
              className="inline-flex h-9 items-center rounded-md bg-grad px-4 text-sm font-bold text-white shadow-brand transition hover:brightness-110"
            >
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </Card>

      {connecte ? (
        <div className="mb-6">
          <ComposerPost />
        </div>
      ) : (
        <Alert variant="info" className="mb-6">
          <TexteEditableAdmin
            cle="s-informer.reseau.deconnecte_lien"
            valeurInitiale={deconnecteLien.valeurMd}
            estAdmin={estAdmin}
            libelle="libelle lien Connecte-toi"
            longueurMax={40}
          >
            {(t) => (
              <Link href="/connexion?prochaine=/s-informer/reseau" className="underline">
                {t}
              </Link>
            )}
          </TexteEditableAdmin>{' '}
          <TexteEditableAdmin
            cle="s-informer.reseau.deconnecte_amorce"
            valeurInitiale={deconnecteAmorce.valeurMd}
            estAdmin={estAdmin}
            libelle="amorce apres Connecte-toi"
            longueurMax={150}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      )}

      {flux.length === 0 ? (
        <p className="py-12 text-center text-text-3">
          <TexteEditableAdmin
            cle="s-informer.reseau.empty_texte"
            valeurInitiale={emptyTexte.valeurMd}
            estAdmin={estAdmin}
            libelle="empty state texte"
            longueurMax={100}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          {connecte ? (
            <TexteEditableAdmin
              cle="s-informer.reseau.empty_sois_la_premiere"
              valeurInitiale={emptySoisLaPremiere.valeurMd}
              estAdmin={estAdmin}
              libelle="empty state suite si connecte"
              longueurMax={100}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          ) : (
            ''
          )}
        </p>
      ) : (
        <div className="grid gap-4">
          {flux.map((post) => (
            <CartePost
              key={post.id}
              post={post}
              connecte={connecte}
              estMien={post.auteur.personneId === moi}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
