import { acheterProduit, noterVendeureuse } from '@/app/(public)/s-entraider/marche/actions';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { DoubleAffichagePrix } from '@/components/marche/BadgesMonnaies';
import { FormulaireAchat } from '@/components/marche/FormulaireAchat';
import { FormulaireNotation } from '@/components/marche/FormulaireNotation';
import { NotationEtoiles } from '@/components/marche/NotationEtoiles';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { listerNotationsProduit, produitParSlug } from '@/lib/marche/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { MapPin, Package, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const FALLBACKS = {
  retour: '← Produits',
  badgeDon: 'Don gratuit',
  badgeVente: 'Vente',
  statutReserve: 'Réservé',
  statutVendu: 'Vendu',
  statutRetire: 'Retiré',
  statutExpire: 'Expiré',
  labelRetrait: 'Retrait',
  badgeMainPropre: 'Main propre',
  badgeEnvoiPostal: 'Envoi postal (port acheteureuse)',
  sectionDescription: 'Description',
  sectionAcheter: 'Acheter ce produit',
  alertDonTitre: 'Produit offert',
  alertDonAmorce: 'Ce produit est en don gratuit : entre en contact avec la personne via la',
  alertDonLien: 'messagerie interne du réseau social',
  sectionNoter: 'Noter la vendeureuse (5 étoiles)',
  noterHint: "Notation unilatérale (cf. doctrine §6F) : seule l'acheteureuse note.",
  sectionNotations: 'Notations',
  acheteureuseFallback: 'Acheteureuse',
  footerAmorce: 'Publié par',
};

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const produit = await produitParSlug(slug);
  if (produit === null) return { title: 'Produit introuvable' };
  return metadataPourPartage({
    objet: {
      titre: produit.titre,
      description: produit.description,
      image_url: produit.image_url,
      type_objet: 'produit_marche',
    },
    cheminPage: `/s-entraider/marche/produits/${slug}`,
  });
}

/**
 * Fiche détail d'un produit. Conditionne :
 *   - bouton « Acheter » si statut `disponible` + visiteureuse ≠ vendeureuse + mode `vente` ;
 *   - bandeau « Don gratuit » + bouton contact (mock) si mode `don` ;
 *   - bloc « Noter la vendeureuse » si statut `vendu` + visiteureuse ≠ vendeureuse.
 */
export default async function PageDetailProduit({ params }: PageDetailProps) {
  const { slug } = await params;
  const produit = await produitParSlug(slug);
  if (produit === null) notFound();

  const [
    session,
    notations,
    estAdmin,
    retour,
    badgeDon,
    badgeVente,
    statutReserve,
    statutVendu,
    statutRetire,
    statutExpire,
    labelRetrait,
    badgeMainPropre,
    badgeEnvoiPostal,
    sectionDescription,
    sectionAcheter,
    alertDonTitre,
    alertDonAmorce,
    alertDonLien,
    sectionNoter,
    noterHint,
    sectionNotations,
    acheteureuseFallback,
    footerAmorce,
  ] = await Promise.all([
    getSession(),
    listerNotationsProduit(produit.id),
    estAdminCourant(),
    lireContenuEditorial('produit.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('produit.fiche.badge_don', { valeurMd: FALLBACKS.badgeDon }),
    lireContenuEditorial('produit.fiche.badge_vente', { valeurMd: FALLBACKS.badgeVente }),
    lireContenuEditorial('produit.fiche.statut_reserve', { valeurMd: FALLBACKS.statutReserve }),
    lireContenuEditorial('produit.fiche.statut_vendu', { valeurMd: FALLBACKS.statutVendu }),
    lireContenuEditorial('produit.fiche.statut_retire', { valeurMd: FALLBACKS.statutRetire }),
    lireContenuEditorial('produit.fiche.statut_expire', { valeurMd: FALLBACKS.statutExpire }),
    lireContenuEditorial('produit.fiche.label_retrait', { valeurMd: FALLBACKS.labelRetrait }),
    lireContenuEditorial('produit.fiche.badge_main_propre', {
      valeurMd: FALLBACKS.badgeMainPropre,
    }),
    lireContenuEditorial('produit.fiche.badge_envoi_postal', {
      valeurMd: FALLBACKS.badgeEnvoiPostal,
    }),
    lireContenuEditorial('produit.fiche.section_description', {
      valeurMd: FALLBACKS.sectionDescription,
    }),
    lireContenuEditorial('produit.fiche.section_acheter', { valeurMd: FALLBACKS.sectionAcheter }),
    lireContenuEditorial('produit.fiche.alert_don_titre', { valeurMd: FALLBACKS.alertDonTitre }),
    lireContenuEditorial('produit.fiche.alert_don_amorce', {
      valeurMd: FALLBACKS.alertDonAmorce,
    }),
    lireContenuEditorial('produit.fiche.alert_don_lien', { valeurMd: FALLBACKS.alertDonLien }),
    lireContenuEditorial('produit.fiche.section_noter', { valeurMd: FALLBACKS.sectionNoter }),
    lireContenuEditorial('produit.fiche.noter_hint', { valeurMd: FALLBACKS.noterHint }),
    lireContenuEditorial('produit.fiche.section_notations', {
      valeurMd: FALLBACKS.sectionNotations,
    }),
    lireContenuEditorial('produit.fiche.acheteureuse_fallback', {
      valeurMd: FALLBACKS.acheteureuseFallback,
    }),
    lireContenuEditorial('produit.fiche.footer_amorce', { valeurMd: FALLBACKS.footerAmorce }),
  ]);

  const statutLibelles: Record<string, string> = {
    reserve: statutReserve.valeurMd,
    vendu: statutVendu.valeurMd,
    retire: statutRetire.valeurMd,
    expire: statutExpire.valeurMd,
  };
  const estVendeureuse = session?.userId === produit.vendeureuse_id;
  const peutAcheter =
    session !== null &&
    !estVendeureuse &&
    produit.statut === 'disponible' &&
    produit.mode === 'vente';
  const peutNoter = session !== null && !estVendeureuse && produit.statut === 'vendu';

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="produit.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour produits"
          longueurMax={30}
        >
          {(t) => (
            <Link href="/s-entraider/marche/produits" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            {produit.mode === 'don' ? (
              <TexteEditableAdmin
                cle="produit.fiche.badge_don"
                valeurInitiale={badgeDon.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Don gratuit"
                longueurMax={30}
              >
                {(t) => <Badge variant="success">{t}</Badge>}
              </TexteEditableAdmin>
            ) : (
              <TexteEditableAdmin
                cle="produit.fiche.badge_vente"
                valeurInitiale={badgeVente.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Vente"
                longueurMax={30}
              >
                {(t) => <Badge variant="brand">{t}</Badge>}
              </TexteEditableAdmin>
            )}
            {produit.statut !== 'disponible' ? (
              <Badge variant="default">{statutLibelles[produit.statut] ?? produit.statut}</Badge>
            ) : null}
          </div>
          <Heading niveau={1}>{produit.titre}</Heading>
          <DoubleAffichagePrix
            mode={produit.mode}
            prixEurosCentimes={produit.prix_euros_centimes}
            prixT99CPUnites={produit.prix_t99cp_unites}
          />
        </header>

        <Card variant="ombre" className="grid gap-3">
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <TexteEditableAdmin
                cle="produit.fiche.label_retrait"
                valeurInitiale={labelRetrait.valeurMd}
                estAdmin={estAdmin}
                libelle="label Retrait"
                longueurMax={30}
              >
                {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
              </TexteEditableAdmin>
              <p className="text-text-1">{produit.lieu}</p>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-3">
                {produit.remise_main_propre ? (
                  <span className="inline-flex items-center gap-1">
                    <Package size={12} strokeWidth={1.5} /> {badgeMainPropre.valeurMd}
                  </span>
                ) : null}
                {produit.envoi_postal ? (
                  <span className="inline-flex items-center gap-1">
                    <Truck size={12} strokeWidth={1.5} /> {badgeEnvoiPostal.valeurMd}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </Card>

        <section className="grid gap-3">
          <TexteEditableAdmin
            cle="produit.fiche.section_description"
            valeurInitiale={sectionDescription.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section description produit"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={3}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {produit.description}
          </div>
        </section>

        {peutAcheter ? (
          <Card variant="eleve" className="grid gap-3">
            <TexteEditableAdmin
              cle="produit.fiche.section_acheter"
              valeurInitiale={sectionAcheter.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section acheter"
              longueurMax={40}
            >
              {(t) => (
                <Heading niveau={2} apparenceComme={4}>
                  {t}
                </Heading>
              )}
            </TexteEditableAdmin>
            <FormulaireAchat
              produitId={produit.id}
              prixEurosCentimes={produit.prix_euros_centimes}
              prixT99CPUnites={produit.prix_t99cp_unites}
              acheterProduit={acheterProduit}
            />
          </Card>
        ) : null}

        {produit.mode === 'don' && produit.statut === 'disponible' && !estVendeureuse ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="produit.fiche.alert_don_titre"
                valeurInitiale={alertDonTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte don"
                longueurMax={40}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="produit.fiche.alert_don_amorce"
              valeurInitiale={alertDonAmorce.valeurMd}
              estAdmin={estAdmin}
              libelle="amorce alerte don"
              longueurMax={200}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="produit.fiche.alert_don_lien"
              valeurInitiale={alertDonLien.valeurMd}
              estAdmin={estAdmin}
              libelle="lien messagerie interne"
              longueurMax={60}
            >
              {(t) => (
                <a href="/s-informer/reseau/messages" className="underline">
                  {t}
                </a>
              )}
            </TexteEditableAdmin>
            .
          </Alert>
        ) : null}

        {peutNoter ? (
          <Card variant="ombre" className="grid gap-3">
            <TexteEditableAdmin
              cle="produit.fiche.section_noter"
              valeurInitiale={sectionNoter.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section noter"
              longueurMax={60}
            >
              {(t) => (
                <Heading niveau={2} apparenceComme={4}>
                  {t}
                </Heading>
              )}
            </TexteEditableAdmin>
            <TexteEditableAdmin
              cle="produit.fiche.noter_hint"
              valeurInitiale={noterHint.valeurMd}
              estAdmin={estAdmin}
              libelle="hint section noter"
              multilignes
              longueurMax={200}
            >
              {(t) => <p className="text-sm text-text-3">{t}</p>}
            </TexteEditableAdmin>
            <FormulaireNotation produitId={produit.id} noterVendeureuse={noterVendeureuse} />
          </Card>
        ) : null}

        {notations.length > 0 ? (
          <section className="grid gap-3">
            <TexteEditableAdmin
              cle="produit.fiche.section_notations"
              valeurInitiale={sectionNotations.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section notations"
              longueurMax={40}
            >
              {(t) => (
                <Heading niveau={2} apparenceComme={4}>
                  {t}
                </Heading>
              )}
            </TexteEditableAdmin>
            <ul className="grid gap-3">
              {notations.map((n) => (
                <li key={n.id}>
                  <Card variant="ombre" className="grid gap-2">
                    <header className="flex items-center justify-between gap-2">
                      <NotationEtoiles note={n.etoiles} taille={14} />
                      <span className="text-xs text-text-3">
                        {[n.acheteureuse_prenom, n.acheteureuse_nom]
                          .filter((s) => s !== null && s.trim() !== '')
                          .join(' ') || acheteureuseFallback.valeurMd}
                      </span>
                    </header>
                    {n.commentaire !== null && n.commentaire.trim() !== '' ? (
                      <p className="text-sm text-text-2">{n.commentaire}</p>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {produit.vendeureuse_prenom !== null || produit.vendeureuse_nom !== null ? (
            <p>
              <TexteEditableAdmin
                cle="produit.fiche.footer_amorce"
                valeurInitiale={footerAmorce.valeurMd}
                estAdmin={estAdmin}
                libelle="amorce footer (Publie par)"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <strong className="text-text-2">
                {[produit.vendeureuse_prenom, produit.vendeureuse_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>
              .{' '}
              <NotationEtoiles
                note={produit.moyenne_etoiles}
                nombre={produit.nombre_notations}
                taille={12}
              />
            </p>
          ) : null}
        </footer>
      </article>
    </>
  );
}
