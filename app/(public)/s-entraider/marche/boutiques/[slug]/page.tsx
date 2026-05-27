import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { CarteProduit } from '@/components/marche/CarteProduit';
import { Alert, Badge, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { boutiqueParSlug, produitsDeLaBoutique } from '@/lib/marche/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { CalendarRange, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const boutique = await boutiqueParSlug(slug);
  if (boutique === null) return { title: 'Boutique introuvable' };
  return metadataPourPartage({
    objet: {
      titre: boutique.nom,
      description: boutique.description,
      image_url: boutique.image_url,
      type_objet: 'boutique_marche',
    },
    cheminPage: `/s-entraider/marche/boutiques/${slug}`,
  });
}

export default async function PageDetailBoutique({ params }: PageDetailProps) {
  const { slug } = await params;
  const boutique = await boutiqueParSlug(slug);
  if (boutique === null) notFound();

  const [
    produits,
    estAdmin,
    retour,
    badgePropose,
    badgeCherche,
    badgeFermee,
    badgeRetiree,
    sectionProduits,
    alertVideTitre,
    alertVideCorps,
    footerAmorce,
  ] = await Promise.all([
    produitsDeLaBoutique(boutique.id),
    estAdminCourant(),
    lireContenuEditorial('boutique.fiche.retour', { valeurMd: '← Boutiques' }),
    lireContenuEditorial('boutique.fiche.badge_propose', { valeurMd: 'Boutique' }),
    lireContenuEditorial('boutique.fiche.badge_cherche', { valeurMd: 'Cherche à co-créer' }),
    lireContenuEditorial('boutique.fiche.badge_fermee', { valeurMd: 'Fermée' }),
    lireContenuEditorial('boutique.fiche.badge_retiree', { valeurMd: 'Retirée' }),
    lireContenuEditorial('boutique.fiche.section_produits', { valeurMd: 'Produits rattachés' }),
    lireContenuEditorial('boutique.fiche.alert_vide_titre', {
      valeurMd: 'Pas encore de produit rattaché',
    }),
    lireContenuEditorial('boutique.fiche.alert_vide_corps', {
      valeurMd:
        "La créatrice n'a pas encore rattaché de produit à cette boutique. Les rattachements s'ajoutent depuis la fiche produit (chantier polish).",
    }),
    lireContenuEditorial('boutique.fiche.footer_amorce', { valeurMd: 'Créée par' }),
  ]);

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="boutique.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour boutiques"
          longueurMax={30}
        >
          {(t) => (
            <Link href="/s-entraider/marche/boutiques" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            {boutique.sens === 'propose' ? (
              <TexteEditableAdmin
                cle="boutique.fiche.badge_propose"
                valeurInitiale={badgePropose.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Boutique"
                longueurMax={30}
              >
                {(t) => <Badge variant="brand">{t}</Badge>}
              </TexteEditableAdmin>
            ) : (
              <TexteEditableAdmin
                cle="boutique.fiche.badge_cherche"
                valeurInitiale={badgeCherche.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Cherche a co-creer"
                longueurMax={30}
              >
                {(t) => <Badge variant="info">{t}</Badge>}
              </TexteEditableAdmin>
            )}
            {boutique.statut !== 'ouverte' ? (
              <Badge variant="default">
                {boutique.statut === 'fermee' ? badgeFermee.valeurMd : badgeRetiree.valeurMd}
              </Badge>
            ) : null}
          </div>
          <Heading niveau={1}>{boutique.nom}</Heading>
          <p className="text-text-2">{boutique.description}</p>
        </header>

        <dl className="grid gap-2 text-sm text-text-2 sm:grid-cols-2">
          {boutique.lieu !== null && boutique.lieu.trim() !== '' ? (
            <div className="flex items-start gap-2">
              <MapPin size={16} strokeWidth={1.5} className="mt-0.5 text-text-3" />
              <dd>{boutique.lieu}</dd>
            </div>
          ) : null}
          {boutique.ouverte_du !== null ? (
            <div className="flex items-start gap-2">
              <CalendarRange size={16} strokeWidth={1.5} className="mt-0.5 text-text-3" />
              <dd>
                {FORMATEUR_DATE.format(new Date(boutique.ouverte_du))}
                {boutique.ouverte_au !== null
                  ? ` → ${FORMATEUR_DATE.format(new Date(boutique.ouverte_au))}`
                  : ''}
              </dd>
            </div>
          ) : null}
        </dl>

        <section className="grid gap-3">
          <Heading niveau={2} apparenceComme={3}>
            <TexteEditableAdmin
              cle="boutique.fiche.section_produits"
              valeurInitiale={sectionProduits.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section produits rattaches"
              longueurMax={50}
            >
              {(t) => (
                <>
                  {t} ({produits.length})
                </>
              )}
            </TexteEditableAdmin>
          </Heading>
          {produits.length === 0 ? (
            <Alert
              variant="info"
              titre={
                <TexteEditableAdmin
                  cle="boutique.fiche.alert_vide_titre"
                  valeurInitiale={alertVideTitre.valeurMd}
                  estAdmin={estAdmin}
                  libelle="titre alerte vide boutique"
                  longueurMax={60}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>
              }
            >
              <TexteEditableAdmin
                cle="boutique.fiche.alert_vide_corps"
                valeurInitiale={alertVideCorps.valeurMd}
                estAdmin={estAdmin}
                libelle="corps alerte vide boutique"
                multilignes
                longueurMax={300}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            </Alert>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {produits.map((produit) => (
                <li key={produit.id}>
                  <CarteProduit produit={produit} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {boutique.createurice_prenom !== null || boutique.createurice_nom !== null ? (
            <p>
              <TexteEditableAdmin
                cle="boutique.fiche.footer_amorce"
                valeurInitiale={footerAmorce.valeurMd}
                estAdmin={estAdmin}
                libelle="amorce footer boutique"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <strong className="text-text-2">
                {[boutique.createurice_prenom, boutique.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>
              .
            </p>
          ) : null}
        </footer>
      </article>
    </>
  );
}
