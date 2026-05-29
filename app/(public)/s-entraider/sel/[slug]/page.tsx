import { FilCommentaires } from '@/components/commentaires/FilCommentaires';
import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { LienAuteurReseau } from '@/components/reseau/LienAuteurReseau';
import { BoutonReserverOffre } from '@/components/reservation/BoutonReserverOffre';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { metadataPourPartage } from '@/lib/og-metadata';
import { serviceSelParSlug } from '@/lib/sel/requetes';
import { Clock, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const FALLBACKS = {
  retour: '← SEL',
  badgeService: 'Service',
  badgeVolontariat: 'Volontariat',
  badgeOffre: 'Offre',
  badgeDemande: 'Demande',
  alertInactifTitre: "Ce service n'est plus actif",
  alertInactifCorps: 'Tu peux consulter la fiche mais la réservation est désactivée.',
  labelDuree: 'Durée',
  labelLieu: 'Lieu',
  minutesLabel: 'minutes',
  coinAttendus: '99-coin attendus',
  sectionDescription: 'Description',
  sectionCommentCaMarche: 'Comment ça marche',
  commentCaMarcheListe:
    '- Tu réserves ce service en proposant un créneau et la quantité voulue.\n- Un message d’amorce est pré-rempli et envoyé à la personne prestataire.\n- La personne prestataire déclare la durée réelle après réalisation.\n- 2 h plus tard sans contestation : crédit automatique en 99-coin (1 min = 1 unité).\n- Tu peux contester pendant ces 2 h si la prestation pose problème.',
  sectionReserver: 'Demander une réservation',
  reserverHint:
    'Propose un créneau. Le message d’amorce est généré pour toi à partir du service et de la durée estimée.',
  footerAmorce: 'Publié par',
};

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await serviceSelParSlug(slug);
  if (service === null) return { title: 'Service introuvable' };
  return metadataPourPartage({
    objet: {
      titre: service.titre,
      description: service.description,
      // Pas d'image_url en V1 sur service_sel : on tombe sur l'image par défaut.
      image_url: null,
      type_objet: 'service_sel',
    },
    cheminPage: `/s-entraider/sel/${slug}`,
  });
}

/**
 * Fiche détail d'un service SEL.
 *
 * Pour 4.2 v1, le bouton de réservation est posé mais déclenche un
 * appel direct à la Server Action (sans étape de planning) : on
 * réserve, le prestataire déclare ensuite la réalisation avec la durée
 * effective. La planification fine (créneaux) viendra en polish.
 */
export default async function PageDetailService({ params }: PageDetailProps) {
  const { slug } = await params;
  const [
    service,
    estAdmin,
    session,
    retour,
    badgeService,
    badgeVolontariat,
    badgeOffre,
    badgeDemande,
    alertInactifTitre,
    alertInactifCorps,
    labelDuree,
    labelLieu,
    minutesLabel,
    coinAttendus,
    sectionDescription,
    sectionCommentCaMarche,
    commentCaMarcheListe,
    sectionReserver,
    reserverHint,
    footerAmorce,
  ] = await Promise.all([
    serviceSelParSlug(slug),
    estAdminCourant(),
    getSession(),
    lireContenuEditorial('sel.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('sel.fiche.badge_service', { valeurMd: FALLBACKS.badgeService }),
    lireContenuEditorial('sel.fiche.badge_volontariat', { valeurMd: FALLBACKS.badgeVolontariat }),
    lireContenuEditorial('sel.fiche.badge_offre', { valeurMd: FALLBACKS.badgeOffre }),
    lireContenuEditorial('sel.fiche.badge_demande', { valeurMd: FALLBACKS.badgeDemande }),
    lireContenuEditorial('sel.fiche.alert_inactif_titre', {
      valeurMd: FALLBACKS.alertInactifTitre,
    }),
    lireContenuEditorial('sel.fiche.alert_inactif_corps', {
      valeurMd: FALLBACKS.alertInactifCorps,
    }),
    lireContenuEditorial('sel.fiche.label_duree', { valeurMd: FALLBACKS.labelDuree }),
    lireContenuEditorial('sel.fiche.label_lieu', { valeurMd: FALLBACKS.labelLieu }),
    lireContenuEditorial('sel.fiche.minutes_label', { valeurMd: FALLBACKS.minutesLabel }),
    lireContenuEditorial('sel.fiche.coin_attendus', { valeurMd: FALLBACKS.coinAttendus }),
    lireContenuEditorial('sel.fiche.section_description', {
      valeurMd: FALLBACKS.sectionDescription,
    }),
    lireContenuEditorial('sel.fiche.section_comment_ca_marche', {
      valeurMd: FALLBACKS.sectionCommentCaMarche,
    }),
    lireContenuEditorial('sel.fiche.comment_ca_marche_liste', {
      valeurMd: FALLBACKS.commentCaMarcheListe,
    }),
    lireContenuEditorial('sel.fiche.section_reserver', { valeurMd: FALLBACKS.sectionReserver }),
    lireContenuEditorial('sel.fiche.reserver_hint', { valeurMd: FALLBACKS.reserverHint }),
    lireContenuEditorial('sel.fiche.footer_amorce', { valeurMd: FALLBACKS.footerAmorce }),
  ]);
  if (service === null) notFound();

  const estPublie = service.statut === 'publie';

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="sel.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour SEL"
          longueurMax={30}
        >
          {(t) => (
            <Link href="/s-entraider/sel" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            {service.categorie === 'service' ? (
              <TexteEditableAdmin
                cle="sel.fiche.badge_service"
                valeurInitiale={badgeService.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Service"
                longueurMax={20}
              >
                {(t) => <Badge variant="brand">{t}</Badge>}
              </TexteEditableAdmin>
            ) : (
              <TexteEditableAdmin
                cle="sel.fiche.badge_volontariat"
                valeurInitiale={badgeVolontariat.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Volontariat"
                longueurMax={20}
              >
                {(t) => <Badge variant="accent">{t}</Badge>}
              </TexteEditableAdmin>
            )}
            {service.sens === 'propose' ? (
              <TexteEditableAdmin
                cle="sel.fiche.badge_offre"
                valeurInitiale={badgeOffre.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Offre"
                longueurMax={20}
              >
                {(t) => <Badge variant="success">{t}</Badge>}
              </TexteEditableAdmin>
            ) : (
              <TexteEditableAdmin
                cle="sel.fiche.badge_demande"
                valeurInitiale={badgeDemande.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Demande"
                longueurMax={20}
              >
                {(t) => <Badge variant="info">{t}</Badge>}
              </TexteEditableAdmin>
            )}
            {!estPublie ? <Badge variant="default">{service.statut}</Badge> : null}
          </div>
          <Heading niveau={1}>{service.titre}</Heading>
        </header>

        {!estPublie ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="sel.fiche.alert_inactif_titre"
                valeurInitiale={alertInactifTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte service inactif"
                longueurMax={50}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="sel.fiche.alert_inactif_corps"
              valeurInitiale={alertInactifCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps alerte service inactif"
              longueurMax={200}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : null}

        <Card variant="ombre" className="grid gap-3">
          <div className="flex items-start gap-3">
            <Clock size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" aria-hidden="true" />
            <div>
              <TexteEditableAdmin
                cle="sel.fiche.label_duree"
                valeurInitiale={labelDuree.valeurMd}
                estAdmin={estAdmin}
                libelle="label Duree"
                longueurMax={20}
              >
                {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
              </TexteEditableAdmin>
              <p className="text-text-1">
                {service.duree_minutes_estimee}{' '}
                <TexteEditableAdmin
                  cle="sel.fiche.minutes_label"
                  valeurInitiale={minutesLabel.valeurMd}
                  estAdmin={estAdmin}
                  libelle="label 'minutes'"
                  longueurMax={20}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>{' '}
                ·{' '}
                <span className="text-text-3">
                  {service.duree_minutes_estimee}{' '}
                  <TexteEditableAdmin
                    cle="sel.fiche.coin_attendus"
                    valeurInitiale={coinAttendus.valeurMd}
                    estAdmin={estAdmin}
                    libelle="suffixe '99-coin attendus'"
                    longueurMax={40}
                  >
                    {(t) => <>{t}</>}
                  </TexteEditableAdmin>
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" aria-hidden="true" />
            <div>
              <TexteEditableAdmin
                cle="sel.fiche.label_lieu"
                valeurInitiale={labelLieu.valeurMd}
                estAdmin={estAdmin}
                libelle="label Lieu"
                longueurMax={20}
              >
                {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
              </TexteEditableAdmin>
              <p className="text-text-1">{service.lieu}</p>
            </div>
          </div>
        </Card>

        <section className="grid gap-3">
          <TexteEditableAdmin
            cle="sel.fiche.section_description"
            valeurInitiale={sectionDescription.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section Description"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={3}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {service.description}
          </div>
        </section>

        <Card variant="ombre" className="grid gap-2">
          <TexteEditableAdmin
            cle="sel.fiche.section_comment_ca_marche"
            valeurInitiale={sectionCommentCaMarche.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section Comment ca marche"
            longueurMax={50}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={4}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          <TexteEditableAdmin
            cle="sel.fiche.comment_ca_marche_liste"
            valeurInitiale={commentCaMarcheListe.valeurMd}
            estAdmin={estAdmin}
            libelle="liste 'Comment ca marche' (Markdown : -  pour les items)"
            multilignes
            longueurMax={1500}
          >
            {(t) => (
              <div className="text-sm text-text-2">
                <MarkdownLeger texte={t} />
              </div>
            )}
          </TexteEditableAdmin>
        </Card>

        {estPublie ? (
          <Card variant="ombre">
            <TexteEditableAdmin
              cle="sel.fiche.section_reserver"
              valeurInitiale={sectionReserver.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section Demander une reservation"
              longueurMax={60}
            >
              {(t) => (
                <Heading niveau={2} apparenceComme={4}>
                  {t}
                </Heading>
              )}
            </TexteEditableAdmin>
            <TexteEditableAdmin
              cle="sel.fiche.reserver_hint"
              valeurInitiale={reserverHint.valeurMd}
              estAdmin={estAdmin}
              libelle="hint section reserver"
              multilignes
              longueurMax={300}
            >
              {(t) => <p className="mt-2 mb-4 text-sm text-text-2">{t}</p>}
            </TexteEditableAdmin>
            <BoutonReserverOffre
              offreType="service_sel"
              offreId={service.id}
              estConnecte={session !== null}
              estCreateur={session?.userId === service.createurice_id}
              cheminRevalidation={`/s-entraider/sel/${slug}`}
            />
          </Card>
        ) : null}

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {service.createurice_prenom !== null || service.createurice_nom !== null ? (
            <p>
              <TexteEditableAdmin
                cle="sel.fiche.footer_amorce"
                valeurInitiale={footerAmorce.valeurMd}
                estAdmin={estAdmin}
                libelle="amorce footer (Publie par)"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <LienAuteurReseau
                personneId={service.createurice_id}
                nom={[service.createurice_prenom, service.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
                className="font-bold text-text-2"
              />
              .
            </p>
          ) : null}
        </footer>

        <FilCommentaires
          objetType="service_sel"
          objetId={service.id}
          cheminRevalidation={`/s-entraider/sel/${slug}`}
        />
      </article>
    </>
  );
}
