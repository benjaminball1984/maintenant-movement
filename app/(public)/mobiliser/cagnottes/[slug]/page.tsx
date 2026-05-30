import { archiverCagnotteAction } from '@/app/actions/archivage';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonArchiverEntite } from '@/components/admin/BoutonArchiverEntite';
import { BoutonSupprimerEntite } from '@/components/admin/BoutonSupprimerEntite';
import { FormulaireDonEuros } from '@/components/cagnottes/FormulaireDonEuros';
import { FormulaireDonT99CP } from '@/components/cagnottes/FormulaireDonT99CP';
import { JaugeT99CPEuros } from '@/components/cagnottes/JaugeT99CPEuros';
import { BoutonAttacherACampagne } from '@/components/campagnes/BoutonAttacherACampagne';
import { FilCommentaires } from '@/components/commentaires/FilCommentaires';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { BoutonMettreALaUne } from '@/components/home/BoutonMettreALaUne';
import { BlocOrganisationPorteuse } from '@/components/organisations/BlocOrganisationPorteuse';
import { BoutonsPartage } from '@/components/partage/BoutonsPartage';
import { LienAuteurReseau } from '@/components/reseau/LienAuteurReseau';
import { RenduRiche } from '@/components/rich-text/RenduRiche';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { getSiteUrl } from '@/config/site';
import { estAdminCourant } from '@/lib/auth/admin';
import { cagnotteParSlug } from '@/lib/cagnottes/requetes';
import { listerCampagnesPubliees } from '@/lib/campagnes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { idEpingleUneHome } from '@/lib/home/une';
import { metadataPourPartage } from '@/lib/og-metadata';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { faireDonEuros, faireDonT99CP } from '../actions';

const FALLBACKS = {
  retour: '← Toutes les cagnottes',
  badgeSuspendue: 'Suspendue',
  badgeCloturee: 'Clôturée',
  alertSuspendueTitre: 'Cagnotte suspendue',
  alertSuspendueAmorce: 'Raison :',
  alertSuspendueNonPrecisee: 'non précisée',
  alertSuspendueFin:
    ". Les dons sont temporairement bloqués. La porteuse peut contacter l'équipe Maintenant! pour discuter du rétablissement.",
  alertClotureeTitre: 'Cagnotte clôturée',
  alertClotureeCorps: "Cette cagnotte n'accepte plus de dons. Merci aux contributeur·ices.",
  alertAnnuleTitre: 'Don annulé',
  alertAnnuleCorps: "Tu as interrompu le paiement. Aucune somme n'a été débitée.",
  alertSuccesTitre: 'Merci !',
  alertSuccesCorps:
    "Ton don est enregistré et abonde la cagnotte. Reçu envoyé par email si tu l'as renseigné.",
  sectionPresentation: 'Présentation',
  sectionSoutenir: 'Soutenir',
  cardDonEurosTitre: 'Don en euros',
  cardDonEurosBadge: 'Frais 5 %',
  cardDonT99cpTitre: 'Don en 99-coin',
  cardDonT99cpBadge: 'Frais 0 %',
  alertEurosIndisponibleTitre: 'Don en euros indisponible',
  alertEurosIndisponibleCorps:
    "Le KYC Stripe Connect du porteur n'est pas encore complété. En attendant, le don T99CP reste possible si la cagnotte expose une adresse wallet.",
  footerAmorce: 'Portée par',
  footerMilieu: '· ouverte le',
  adminSectionTitre: 'Actions admin',
};

interface PageDetailProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ annule?: string; succes?: string }>;
}

const LIBELLE_TYPE: Record<string, string> = {
  ouverte: 'Cagnotte ouverte',
  lutte: 'Caisse de lutte',
  cotisation: 'Cotisation',
};

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const cagnotte = await cagnotteParSlug(slug);
  if (cagnotte === null) {
    return { title: 'Cagnotte introuvable' };
  }
  return metadataPourPartage({
    objet: {
      titre: cagnotte.titre,
      description: cagnotte.texte,
      image_url: cagnotte.image_url,
      type_objet: 'cagnotte',
    },
    cheminPage: `/mobiliser/cagnottes/${slug}`,
  });
}

export default async function PageCagnotteDetail({ params, searchParams }: PageDetailProps) {
  const { slug } = await params;
  const { annule, succes } = await searchParams;
  const [
    cagnotte,
    estAdmin,
    retour,
    badgeSuspendue,
    badgeCloturee,
    alertSuspendueTitre,
    alertSuspendueAmorce,
    alertSuspendueNonPrecisee,
    alertSuspendueFin,
    alertClotureeTitre,
    alertClotureeCorps,
    alertAnnuleTitre,
    alertAnnuleCorps,
    alertSuccesTitre,
    alertSuccesCorps,
    sectionPresentation,
    sectionSoutenir,
    cardDonEurosTitre,
    cardDonEurosBadge,
    cardDonT99cpTitre,
    cardDonT99cpBadge,
    alertEurosIndisponibleTitre,
    alertEurosIndisponibleCorps,
    footerAmorce,
    footerMilieu,
    adminSectionTitre,
  ] = await Promise.all([
    cagnotteParSlug(slug),
    estAdminCourant(),
    lireContenuEditorial('cagnottes.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('cagnottes.fiche.badge_suspendue', {
      valeurMd: FALLBACKS.badgeSuspendue,
    }),
    lireContenuEditorial('cagnottes.fiche.badge_cloturee', { valeurMd: FALLBACKS.badgeCloturee }),
    lireContenuEditorial('cagnottes.fiche.alert_suspendue_titre', {
      valeurMd: FALLBACKS.alertSuspendueTitre,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_suspendue_amorce', {
      valeurMd: FALLBACKS.alertSuspendueAmorce,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_suspendue_non_precisee', {
      valeurMd: FALLBACKS.alertSuspendueNonPrecisee,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_suspendue_fin', {
      valeurMd: FALLBACKS.alertSuspendueFin,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_cloturee_titre', {
      valeurMd: FALLBACKS.alertClotureeTitre,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_cloturee_corps', {
      valeurMd: FALLBACKS.alertClotureeCorps,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_annule_titre', {
      valeurMd: FALLBACKS.alertAnnuleTitre,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_annule_corps', {
      valeurMd: FALLBACKS.alertAnnuleCorps,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_succes_titre', {
      valeurMd: FALLBACKS.alertSuccesTitre,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_succes_corps', {
      valeurMd: FALLBACKS.alertSuccesCorps,
    }),
    lireContenuEditorial('cagnottes.fiche.section_presentation', {
      valeurMd: FALLBACKS.sectionPresentation,
    }),
    lireContenuEditorial('cagnottes.fiche.section_soutenir', {
      valeurMd: FALLBACKS.sectionSoutenir,
    }),
    lireContenuEditorial('cagnottes.fiche.card_don_euros_titre', {
      valeurMd: FALLBACKS.cardDonEurosTitre,
    }),
    lireContenuEditorial('cagnottes.fiche.card_don_euros_badge', {
      valeurMd: FALLBACKS.cardDonEurosBadge,
    }),
    lireContenuEditorial('cagnottes.fiche.card_don_t99cp_titre', {
      valeurMd: FALLBACKS.cardDonT99cpTitre,
    }),
    lireContenuEditorial('cagnottes.fiche.card_don_t99cp_badge', {
      valeurMd: FALLBACKS.cardDonT99cpBadge,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_euros_indisponible_titre', {
      valeurMd: FALLBACKS.alertEurosIndisponibleTitre,
    }),
    lireContenuEditorial('cagnottes.fiche.alert_euros_indisponible_corps', {
      valeurMd: FALLBACKS.alertEurosIndisponibleCorps,
    }),
    lireContenuEditorial('cagnottes.fiche.footer_amorce', { valeurMd: FALLBACKS.footerAmorce }),
    lireContenuEditorial('cagnottes.fiche.footer_milieu', { valeurMd: FALLBACKS.footerMilieu }),
    lireContenuEditorial('cagnottes.fiche.admin_section_titre', {
      valeurMd: FALLBACKS.adminSectionTitre,
    }),
  ]);
  if (cagnotte === null) {
    notFound();
  }

  const estPubliee = cagnotte.statut === 'publiee';
  const estEpingleUne = estAdmin ? (await idEpingleUneHome('cagnotte')) === cagnotte.id : false;
  const peutRecevoirEuros = cagnotte.stripe_account_id !== null;
  const peutRecevoirT99CP = cagnotte.wallet_t99cp !== null;

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="cagnottes.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour vers liste cagnottes"
          longueurMax={60}
        >
          {(t) => (
            <Link href="/mobiliser/cagnottes" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>

      <article className="grid gap-8">
        <header className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={cagnotte.type === 'cotisation' ? 'accent' : 'success'}>
                {LIBELLE_TYPE[cagnotte.type] ?? cagnotte.type}
              </Badge>
              {cagnotte.statut === 'suspendue' ? (
                <TexteEditableAdmin
                  cle="cagnottes.fiche.badge_suspendue"
                  valeurInitiale={badgeSuspendue.valeurMd}
                  estAdmin={estAdmin}
                  libelle="badge Suspendue"
                  longueurMax={30}
                >
                  {(t) => <Badge variant="warning">{t}</Badge>}
                </TexteEditableAdmin>
              ) : null}
              {cagnotte.statut === 'cloturee' ? (
                <TexteEditableAdmin
                  cle="cagnottes.fiche.badge_cloturee"
                  valeurInitiale={badgeCloturee.valeurMd}
                  estAdmin={estAdmin}
                  libelle="badge Cloturee"
                  longueurMax={30}
                >
                  {(t) => <Badge variant="default">{t}</Badge>}
                </TexteEditableAdmin>
              ) : null}
            </div>
            {estAdmin && estPubliee ? (
              <BoutonMettreALaUne
                emplacement="cagnotte"
                objetId={cagnotte.id}
                estEpingleInitial={estEpingleUne}
              />
            ) : null}
            <BoutonAdminEditer href={`/admin/moderation/cagnottes?id=${cagnotte.id}`}>
              Admin
            </BoutonAdminEditer>
          </div>
          <Heading niveau={1}>{cagnotte.titre}</Heading>
          <BlocOrganisationPorteuse objetType="cagnotte" objetId={cagnotte.id} />

          {/* V2.5.11.c — bouton admin "Intégrer à une campagne" sur cagnotte. */}
          {estAdmin ? (
            <BoutonAttacherACampagne
              typeModule="cagnotte"
              cibleId={cagnotte.id}
              campagnes={(await listerCampagnesPubliees()).map((c) => ({
                id: c.id,
                titre: c.titre,
              }))}
            />
          ) : null}

          {cagnotte.image_url !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={cagnotte.image_url}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          ) : null}
        </header>

        {cagnotte.statut === 'suspendue' ? (
          <Alert
            variant="warning"
            titre={
              <TexteEditableAdmin
                cle="cagnottes.fiche.alert_suspendue_titre"
                valeurInitiale={alertSuspendueTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte cagnotte suspendue"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="cagnottes.fiche.alert_suspendue_amorce"
              valeurInitiale={alertSuspendueAmorce.valeurMd}
              estAdmin={estAdmin}
              libelle="amorce alerte suspendue (Raison :)"
              longueurMax={30}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            {cagnotte.raison_suspension ?? (
              <TexteEditableAdmin
                cle="cagnottes.fiche.alert_suspendue_non_precisee"
                valeurInitiale={alertSuspendueNonPrecisee.valeurMd}
                estAdmin={estAdmin}
                libelle="fallback si pas de raison de suspension"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            )}
            <TexteEditableAdmin
              cle="cagnottes.fiche.alert_suspendue_fin"
              valeurInitiale={alertSuspendueFin.valeurMd}
              estAdmin={estAdmin}
              libelle="fin alerte cagnotte suspendue"
              multilignes
              longueurMax={400}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : null}

        {cagnotte.statut === 'cloturee' ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="cagnottes.fiche.alert_cloturee_titre"
                valeurInitiale={alertClotureeTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte cagnotte cloturee"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="cagnottes.fiche.alert_cloturee_corps"
              valeurInitiale={alertClotureeCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps alerte cagnotte cloturee"
              multilignes
              longueurMax={300}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : null}

        {annule === '1' ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="cagnottes.fiche.alert_annule_titre"
                valeurInitiale={alertAnnuleTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte don annule"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="cagnottes.fiche.alert_annule_corps"
              valeurInitiale={alertAnnuleCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps alerte don annule"
              multilignes
              longueurMax={300}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : null}

        {succes === '1' ? (
          <Alert
            variant="success"
            titre={
              <TexteEditableAdmin
                cle="cagnottes.fiche.alert_succes_titre"
                valeurInitiale={alertSuccesTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte don succes"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="cagnottes.fiche.alert_succes_corps"
              valeurInitiale={alertSuccesCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps alerte don succes"
              multilignes
              longueurMax={400}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : null}

        <Card variant="ombre">
          <JaugeT99CPEuros
            totalEurosCentimes={cagnotte.total_euros_centimes}
            totalT99CPUnites={cagnotte.total_t99cp_unites}
            objectifEuros={cagnotte.objectif_euros}
            nombreDons={cagnotte.nombre_dons}
            taille="md"
          />
        </Card>

        <section className="grid gap-4">
          <TexteEditableAdmin
            cle="cagnottes.fiche.section_presentation"
            valeurInitiale={sectionPresentation.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section presentation"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={3}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          {(() => {
            // V2.5.53 — priorité au HTML riche (déjà sanitizé au save).
            const html = (cagnotte as { texte_html?: string | null }).texte_html ?? null;
            if (html !== null && html.trim() !== '') {
              return <RenduRiche valeurHtml={html} className="text-text-2 leading-relaxed" />;
            }
            return (
              <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
                {cagnotte.texte}
              </div>
            );
          })()}
        </section>

        {estPubliee && (peutRecevoirEuros || peutRecevoirT99CP) ? (
          <section className="grid gap-6 border-t border-border pt-6">
            <TexteEditableAdmin
              cle="cagnottes.fiche.section_soutenir"
              valeurInitiale={sectionSoutenir.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section soutenir"
              longueurMax={40}
            >
              {(t) => (
                <Heading niveau={2} apparenceComme={3}>
                  {t}
                </Heading>
              )}
            </TexteEditableAdmin>

            {peutRecevoirEuros ? (
              <Card variant="ombre" className="grid gap-3">
                <header className="flex items-center justify-between">
                  <TexteEditableAdmin
                    cle="cagnottes.fiche.card_don_euros_titre"
                    valeurInitiale={cardDonEurosTitre.valeurMd}
                    estAdmin={estAdmin}
                    libelle="titre card don euros"
                    longueurMax={40}
                  >
                    {(t) => (
                      <Heading niveau={3} apparenceComme={4}>
                        {t}
                      </Heading>
                    )}
                  </TexteEditableAdmin>
                  <TexteEditableAdmin
                    cle="cagnottes.fiche.card_don_euros_badge"
                    valeurInitiale={cardDonEurosBadge.valeurMd}
                    estAdmin={estAdmin}
                    libelle="badge frais 5 %"
                    longueurMax={20}
                  >
                    {(t) => <Badge variant="default">{t}</Badge>}
                  </TexteEditableAdmin>
                </header>
                <FormulaireDonEuros cagnotteId={cagnotte.id} faireDonEuros={faireDonEuros} />
              </Card>
            ) : (
              <Alert
                variant="info"
                titre={
                  <TexteEditableAdmin
                    cle="cagnottes.fiche.alert_euros_indisponible_titre"
                    valeurInitiale={alertEurosIndisponibleTitre.valeurMd}
                    estAdmin={estAdmin}
                    libelle="titre alerte euros indisponible"
                    longueurMax={60}
                  >
                    {(t) => <>{t}</>}
                  </TexteEditableAdmin>
                }
              >
                <TexteEditableAdmin
                  cle="cagnottes.fiche.alert_euros_indisponible_corps"
                  valeurInitiale={alertEurosIndisponibleCorps.valeurMd}
                  estAdmin={estAdmin}
                  libelle="corps alerte euros indisponible"
                  multilignes
                  longueurMax={400}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>
              </Alert>
            )}

            {peutRecevoirT99CP && cagnotte.wallet_t99cp !== null ? (
              <Card variant="ombre" className="grid gap-3">
                <header className="flex items-center justify-between">
                  <TexteEditableAdmin
                    cle="cagnottes.fiche.card_don_t99cp_titre"
                    valeurInitiale={cardDonT99cpTitre.valeurMd}
                    estAdmin={estAdmin}
                    libelle="titre card don t99cp"
                    longueurMax={40}
                  >
                    {(t) => (
                      <Heading niveau={3} apparenceComme={4}>
                        {t}
                      </Heading>
                    )}
                  </TexteEditableAdmin>
                  <TexteEditableAdmin
                    cle="cagnottes.fiche.card_don_t99cp_badge"
                    valeurInitiale={cardDonT99cpBadge.valeurMd}
                    estAdmin={estAdmin}
                    libelle="badge frais 0 %"
                    longueurMax={20}
                  >
                    {(t) => <Badge variant="success">{t}</Badge>}
                  </TexteEditableAdmin>
                </header>
                <FormulaireDonT99CP
                  cagnotteId={cagnotte.id}
                  walletPorteur={cagnotte.wallet_t99cp}
                  faireDonT99CP={faireDonT99CP}
                />
              </Card>
            ) : null}
          </section>
        ) : null}

        {/* V2.5.8 : moteur de partage applique aux cagnottes publiees.
            Pour les cagnottes solidaires en particulier, le partage est
            crucial pour atteindre l'objectif financier. */}
        {estPubliee ? (
          <BoutonsPartage
            titre={cagnotte.titre}
            url={`${getSiteUrl()}/mobiliser/cagnottes/${cagnotte.slug}`}
            message={`Une cagnotte solidaire mérite d'être vue : ${cagnotte.titre}.`}
            titreBloc="Faire connaître cette cagnotte"
            intro="Plus on est nombreuses et nombreux à savoir, plus on a de chance d'atteindre l'objectif."
          />
        ) : null}

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {cagnotte.createurice_prenom !== null || cagnotte.createurice_nom !== null ? (
            <p>
              <TexteEditableAdmin
                cle="cagnottes.fiche.footer_amorce"
                valeurInitiale={footerAmorce.valeurMd}
                estAdmin={estAdmin}
                libelle="amorce footer (Portee par)"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <LienAuteurReseau
                personneId={cagnotte.createurice_id}
                nom={[cagnotte.createurice_prenom, cagnotte.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
                className="font-bold text-text-2"
              />{' '}
              <TexteEditableAdmin
                cle="cagnottes.fiche.footer_milieu"
                valeurInitiale={footerMilieu.valeurMd}
                estAdmin={estAdmin}
                libelle="milieu footer (· ouverte le)"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <time dateTime={cagnotte.created_at}>
                {new Date(cagnotte.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              .
            </p>
          ) : null}
        </footer>

        <FilCommentaires
          objetType="cagnotte"
          objetId={cagnotte.id}
          cheminRevalidation={`/mobiliser/cagnottes/${slug}`}
        />
      </article>

      {estAdmin ? (
        <section
          aria-label="Actions admin"
          className="mt-12 grid gap-3 border-t border-border pt-8"
        >
          <TexteEditableAdmin
            cle="cagnottes.fiche.admin_section_titre"
            valeurInitiale={adminSectionTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section actions admin"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={4}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          {cagnotte.statut !== 'cloturee' ? (
            <BoutonArchiverEntite
              id={cagnotte.id}
              action={archiverCagnotteAction}
              verbe="Clôturer la cagnotte"
              description="Statut → 'cloturee'. La cagnotte disparaît de la liste publique mais reste en base avec ses dons."
              labelRaison="Raison de la clôture (optionnelle)"
            />
          ) : null}
          <BoutonSupprimerEntite
            table="cagnotte"
            id={cagnotte.id}
            redirigerVers="/mobiliser/cagnottes"
          />
        </section>
      ) : null}
    </Container>
  );
}
